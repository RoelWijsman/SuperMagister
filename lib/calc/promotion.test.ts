import { describe, expect, it } from "vitest";
import { numeric, text } from "@/lib/test-utils/grade";
import {
  COMBINATION_ID,
  evaluatePromotion,
  NORM_PRESETS,
  promotionSubjects,
  shortagePoints,
  type PromotionSubject,
} from "./promotion";

const standaard = NORM_PRESETS.standaard.norms;
const examen = NORM_PRESETS.examen.norms;

/** Vakken met een gemiddelde; de eerste drie zijn kernvakken (Ne/En/Wi). */
function subjects(...averages: (number | null)[]): PromotionSubject[] {
  return averages.map((average, i) => ({ subjectId: `vak${i + 1}`, average, isCore: i < 3 }));
}

describe("shortagePoints", () => {
  it("telt per heel punt onder de 6", () => {
    expect([6, 7, 5, 4, 3].map(shortagePoints)).toEqual([0, 0, 1, 2, 3]);
  });
});

describe("evaluatePromotion (overgangsmeter)", () => {
  it("is 'over' zonder tekorten", () => {
    const result = evaluatePromotion(subjects(6.8, 7.1, 6.2, 7.5, 8), standaard);
    expect(result.status).toBe("over");
    expect(result.points).toBe(0);
    expect(result.checks.every((check) => check.ok)).toBe(true);
  });

  it("gebruikt het rapportcijfer zoals je het ziet: 5,45 telt als 6", () => {
    const result = evaluatePromotion(subjects(6.8, 7.1, 6.2, 5.45, 8), standaard);
    expect(result.grades.find((g) => g.subjectId === "vak4")?.report).toBe(6);
    expect(result.points).toBe(0);
  });

  it("laat één vrij tekortpunt toe zonder eisen", () => {
    const result = evaluatePromotion(subjects(6.8, 7.1, 6.2, 5.2, 6), standaard);
    expect(result).toMatchObject({ status: "over", points: 1, shortSubjects: 1 });
  });

  it("eist bij meer tekortpunten een gemiddelde van 6,0", () => {
    // Twee vijven, gemiddeld (7+7+6+5+5+6)/6 = 6,0: over.
    expect(evaluatePromotion(subjects(7, 7, 6, 5, 5, 6), standaard).status).toBe("over");
    // Twee vijven, gemiddeld (6+6+6+5+5+6)/6 = 5,67: bespreekgeval.
    const krap = evaluatePromotion(subjects(6, 6, 6, 5, 5, 6), standaard);
    expect(krap.status).toBe("bespreek");
    expect(krap.checks.find((c) => c.id === "gemiddeldBijTekort")?.ok).toBe(false);
  });

  it("maakt van één tekortpunt te veel een bespreekgeval, en van meer de gevarenzone", () => {
    // Vier tekortpunten (max 3): bespreekgeval.
    expect(evaluatePromotion(subjects(7, 8, 7, 4, 4, 9, 9), standaard).status).toBe("bespreek");
    // Vijf tekortpunten in drie vakken: gevarenzone.
    expect(evaluatePromotion(subjects(7, 8, 7, 4, 4, 5, 9, 9), standaard).status).toBe("gevaar");
  });

  it("is streng op kernvakken", () => {
    // Twee vijven in Ne/En/Wi (max 1 tekortpunt): bespreekgeval.
    const twee = evaluatePromotion(subjects(5, 5, 7, 8, 8, 8), standaard);
    expect(twee.corePoints).toBe(2);
    expect(twee.status).toBe("bespreek");
    // Een 4 in een kernvak (laagste toegestaan: 5): gevarenzone.
    expect(evaluatePromotion(subjects(4, 7, 7, 8, 8, 8), standaard).status).toBe("gevaar");
  });

  it("vindt een 3 altijd te veel", () => {
    expect(evaluatePromotion(subjects(7, 7, 7, 3, 9, 9, 9, 9), standaard).status).toBe("gevaar");
  });

  it("slaat vakken zonder cijfers (of met alleen V/G) over", () => {
    const result = evaluatePromotion(subjects(7, 7, 7, null, 6), standaard);
    expect(result.grades.map((g) => g.subjectId)).toEqual(["vak1", "vak2", "vak3", "vak5"]);
    expect(result.status).toBe("over");
  });

  it("zegt 'onbekend' zonder enig gemiddelde", () => {
    expect(evaluatePromotion(subjects(null, null), standaard).status).toBe("onbekend");
    expect(evaluatePromotion([], standaard).status).toBe("onbekend");
  });

  it("kent bij de slaag-zakregeling geen bespreekgeval", () => {
    expect(examen.discussPoints).toBe(0);
    // 5 + 4 (3 punten) met gemiddeld ≥ 6: geslaagd.
    expect(evaluatePromotion(subjects(7, 7, 7, 5, 4, 8, 8), examen).status).toBe("over");
    // Twee vieren (4 punten): gezakt.
    expect(evaluatePromotion(subjects(7, 7, 7, 4, 4, 8, 8), examen).status).toBe("gevaar");
  });

  describe("welke vakken het verschil maken", () => {
    it("noemt de tekortvakken die de status zouden verbeteren", () => {
      const result = evaluatePromotion(subjects(7, 8, 7, 4, 4, 9, 9), standaard);
      expect(result.decisive).toEqual([
        { subjectId: "vak4", report: 4, kind: "tekort", wouldBe: "over" },
        { subjectId: "vak5", report: 4, kind: "tekort", wouldBe: "over" },
      ]);
    });

    it("waarschuwt voor vakken op het randje die de status zouden verslechteren", () => {
      // vak4 staat op 5,6 (rapport 6). Wordt dat een 5, dan zijn er twee vijven
      // en is het gemiddelde te laag.
      const result = evaluatePromotion(subjects(6, 6, 6, 5.6, 5.2, 6), standaard);
      expect(result.status).toBe("over");
      expect(result.decisive).toContainEqual({
        subjectId: "vak4",
        report: 6,
        kind: "randje",
        wouldBe: "bespreek",
      });
    });
  });
});

describe("promotionSubjects (wat de meter meeneemt)", () => {
  const list = [
    { id: "ne", isCore: true },
    { id: "wisa", isCore: true },
    { id: "maat", isCore: false },
    { id: "pws", isCore: false },
    { id: "lo", isCore: false },
  ];
  const grades = [
    numeric(6, 1, { subjectId: "ne", isPTA: true }),
    numeric(9, 1, { subjectId: "ne", isPTA: false }),
    numeric(5.2, 1, { subjectId: "wisa" }),
    numeric(6.6, 1, { subjectId: "maat", isPTA: true }),
    numeric(7.4, 1, { subjectId: "pws", isPTA: true }),
    text("G", { subjectId: "lo" }),
  ];

  it("gebruikt normaal het jaargemiddelde", () => {
    expect(promotionSubjects(list, grades, { exam: false, combination: [] })).toEqual([
      { subjectId: "ne", average: 7.5, isCore: true },
      { subjectId: "wisa", average: 5.2, isCore: true },
      { subjectId: "maat", average: 6.6, isCore: false },
      { subjectId: "pws", average: 7.4, isCore: false },
      { subjectId: "lo", average: null, isCore: false },
    ]);
  });

  it("gebruikt in het examenjaar het SE, met het combinatiecijfer als één vak", () => {
    expect(promotionSubjects(list, grades, { exam: true, combination: ["maat", "pws"] })).toEqual([
      { subjectId: "ne", average: 6, isCore: true },
      { subjectId: "wisa", average: null, isCore: true },
      { subjectId: "lo", average: null, isCore: false },
      // Eindcijfers 7 en 7 → combinatiecijfer 7.
      { subjectId: COMBINATION_ID, average: 7, isCore: false },
    ]);
  });
});
