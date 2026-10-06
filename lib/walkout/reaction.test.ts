import { describe, expect, it } from "vitest";
import { computeCards } from "@/lib/calc/cards";
import type { Grade, TextGradeValue } from "@/lib/types";
import { guessReaction, reactionLines } from "./reaction";

let n = 0;
function g(value: number | TextGradeValue, weight: number, date: string): Grade {
  n++;
  const base = {
    id: `r${n}`,
    subjectId: "wis",
    description: "SO Kansrekening",
    weight,
    date,
    enteredAt: `${date}T15:00:00.000Z`,
    periodId: "p1",
    countsTowardAverage: true,
    isPTA: false,
  };
  return typeof value === "number"
    ? {
        ...base,
        kind: "numeric",
        value,
        display: String(value).replace(".", ","),
        isSufficient: value >= 5.5,
      }
    : { ...base, kind: "text", value, display: value, isSufficient: value !== "O" };
}

function linesFor(grades: Grade[], index: number) {
  const cards = computeCards(grades);
  const grade = grades[index]!;
  return reactionLines(cards.get(grade.id)!, grades, { subjectName: "Wiskunde A" });
}

describe("reactionLines bij een voldoende", () => {
  it("kiest de reactie van de tier, met het echte cijfer", () => {
    const lines = linesFor([g(8.2, 1, "2026-09-01")], 0);
    expect(lines[0]).toEqual({
      key: "walkout.reactie.goud",
      vars: { cijfer: "8,2", vak: "Wiskunde A", omschrijving: "SO Kansrekening" },
    });
  });

  it("voegt een regel toe voor de variant met het beste verhaal: een record gaat voor In Form", () => {
    const grades = [g(6, 1, "2026-09-01"), g(8, 1, "2026-09-02")];
    const lines = linesFor(grades, 1);
    expect(lines[1]).toEqual({
      key: "walkout.variant.record",
      vars: { verschil: "2,0", vak: "Wiskunde A", aantal: 2 },
    });
  });

  it("vertelt bij meerdere varianten het beste verhaal: eerst de comeback", () => {
    const grades = [g(6, 1, "2026-09-01"), g(4.2, 1, "2026-09-08"), g(8.4, 1, "2026-09-15")];
    const variants = computeCards(grades).get(grades[2]!.id)!.variants;
    expect(variants).toEqual(expect.arrayContaining(["inform", "comeback"]));
    expect(linesFor(grades, 2)[1]?.key).toBe("walkout.variant.comeback");
  });

  it("heeft een eigen reactie voor beoordelingen als V en G", () => {
    expect(linesFor([g("G", 1, "2026-09-01")], 0)[0]?.key).toBe("walkout.reactie.tekst");
  });
});

describe("reactionLines bij een onvoldoende", () => {
  it("geeft eerst de grap, dan steun, dan een actie met echte getallen", () => {
    // 6,0 en dan een 4,8 (×1): gemiddelde 5,4. Nodig voor 5,5 met weging 1: 5,7.
    const grades = [g(6, 1, "2026-09-01"), g(4.8, 1, "2026-09-08")];
    const lines = linesFor(grades, 1);
    expect(lines.map((l) => l.key)).toEqual([
      "walkout.onvoldoende.grap",
      "walkout.onvoldoende.steun",
      "walkout.onvoldoende.actie",
    ]);
    expect(lines[2]?.vars).toEqual({ nodig: "5,7", doel: "5,5" });
  });

  it("gebruikt de 'bijna'-grap tussen 5,0 en 5,4", () => {
    expect(linesFor([g(5.4, 1, "2026-09-01")], 0)[0]?.key).toBe("walkout.onvoldoende.bijna");
  });

  it("blijft rustig als het gemiddelde nog voldoende is", () => {
    const grades = [g(8, 3, "2026-09-01"), g(5, 1, "2026-09-08")];
    const action = linesFor(grades, 1)[2];
    // (24 + 5) / 4 = 7,25 → 7,3. Met een 7 (×1) erbij: (29 + 7) / 5 = 7,2.
    expect(action).toEqual({
      key: "walkout.onvoldoende.actieRustig",
      vars: { gem: "7,3", nodig: "7,0", doel: "7,2" },
    });
  });

  it("is eerlijk als één toets niet genoeg is", () => {
    const grades = [g(2, 3, "2026-09-01"), g(3, 3, "2026-09-08")];
    expect(linesFor(grades, 1)[2]?.key).toBe("walkout.onvoldoende.actieLang");
  });

  it("geeft geen rekenactie bij een O", () => {
    const keys = linesFor([g("O", 1, "2026-09-01")], 0).map((l) => l.key);
    expect(keys).toEqual(["walkout.onvoldoende.grap", "walkout.onvoldoende.steun"]);
  });
});

describe("guessReaction", () => {
  const cardFor = (value: number) => {
    const grades = [g(value, 1, "2026-09-01")];
    return computeCards(grades).get(grades[0]!.id)!;
  };

  it("noemt de echte getallen als je cijfer veel hoger is dan je dacht", () => {
    const reaction = guessReaction(cardFor(7.4), 5.8);
    expect(reaction.outcome.kind).toBe("veelHoger");
    expect(reaction.line).toEqual({
      key: "gok.uitslag.veelHoger",
      vars: { gok: "5,8", cijfer: "7,4", verschil: "1,6" },
    });
    expect(reaction.support).toBeNull();
    expect(reaction.showWhatToGet).toBe(false);
  });

  it("steunt je na een veel te hoge gok, ook bij een voldoende, met de knop erbij", () => {
    const reaction = guessReaction(cardFor(6.8), 8.5);
    expect(reaction.outcome.kind).toBe("veelLager");
    expect(reaction.support?.key).toBe("gok.steun");
    expect(reaction.showWhatToGet).toBe(true);
  });

  it("laat de steun bij een onvoldoende over aan de gewone reactie", () => {
    const reaction = guessReaction(cardFor(4.2), 6.5);
    expect(reaction.support).toBeNull();
    expect(reaction.showWhatToGet).toBe(true);
  });

  it("geeft het verschil zonder min-teken in de tekst", () => {
    expect(guessReaction(cardFor(7), 7.2).line).toEqual({
      key: "gok.uitslag.dichtbij",
      vars: { gok: "7,2", cijfer: "7,0", verschil: "0,2" },
    });
    expect(guessReaction(cardFor(7.2), 7.2).line.key).toBe("gok.uitslag.exact");
  });
});
