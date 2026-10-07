import { describe, expect, it } from "vitest";
import { numeric, text } from "@/lib/test-utils/grade";
import {
  combinationGrade,
  examOverview,
  finalFromSe,
  seAverage,
  seGrade,
  suggestedCombination,
} from "./exam";

describe("seAverage (schoolexamen)", () => {
  it("rekent alleen met PTA-cijfers, gewogen", () => {
    const grades = [
      numeric(6, 2, { isPTA: true }),
      numeric(8, 1, { isPTA: true }),
      numeric(2, 5, { isPTA: false }),
    ];
    expect(seAverage(grades)).toBeCloseTo(20 / 3, 10);
  });

  it("negeert V/G/O, weging 0 en cijfers die niet meetellen", () => {
    const grades = [
      numeric(7, 1, { isPTA: true }),
      text("O", { isPTA: true }),
      numeric(1, 0, { isPTA: true }),
      numeric(1, 2, { isPTA: true, countsTowardAverage: false }),
    ];
    expect(seAverage(grades)).toBe(7);
  });

  it("geeft null zonder PTA-cijfers", () => {
    expect(seAverage([])).toBeNull();
    expect(seAverage([numeric(7, 1)])).toBeNull();
  });
});

describe("afronden in het examenjaar", () => {
  it("rondt het SE-cijfer af op één decimaal", () => {
    expect(seGrade(6.449)).toBe(6.4);
    expect(seGrade(6.45)).toBe(6.5);
  });

  it("maakt van het SE-cijfer (met één decimaal) het eindcijfer, zoals de regels zeggen", () => {
    // 5,449 → SE 5,4 → 5; 5,45 → SE 5,5 → 6. De dubbele afronding is hier de regel.
    expect(finalFromSe(5.449)).toBe(5);
    expect(finalFromSe(5.45)).toBe(6);
    expect(finalFromSe(9.96)).toBe(10);
  });
});

describe("combinationGrade (combinatiecijfer)", () => {
  it("is het afgeronde gemiddelde van de afgeronde eindcijfers", () => {
    // Eindcijfers 6 (5,5) en 7 → 6,5 → 7.
    expect(combinationGrade([5.5, 7])).toEqual({ grade: 7, finals: [6, 7], valid: true });
    // Eindcijfers 5 en 6 → 5,5 → 6.
    expect(combinationGrade([5.2, 6.1])).toEqual({ grade: 6, finals: [5, 6], valid: true });
  });

  it("is ongeldig met een onderdeel onder de 4", () => {
    expect(combinationGrade([3.4, 9]).valid).toBe(false);
  });

  it("heeft geen cijfer zolang een onderdeel nog niets heeft", () => {
    expect(combinationGrade([7, null])).toEqual({ grade: null, finals: [7, null], valid: true });
    expect(combinationGrade([])).toEqual({ grade: null, finals: [], valid: true });
  });
});

describe("examOverview", () => {
  it("zet per vak de PTA-kolommen apart, op datum, met SE afgerond en onafgerond", () => {
    const rows = examOverview(
      [
        numeric(6.8, 2, { subjectId: "ne", isPTA: true, date: "2026-11-02" }),
        numeric(5.4, 3, { subjectId: "ne", isPTA: true, date: "2026-10-01" }),
        numeric(9, 1, { subjectId: "ne", isPTA: false }),
        numeric(7, 1, { subjectId: "lo", isPTA: false }),
      ],
      ["ne", "lo", "wisa"],
    );
    expect(rows.map((r) => r.subjectId)).toEqual(["ne"]);
    const [ne] = rows;
    expect(ne!.pta.map((g) => g.date)).toEqual(["2026-10-01", "2026-11-02"]);
    expect(ne!.seRaw).toBeCloseTo((5.4 * 3 + 6.8 * 2) / 5, 10);
    expect(ne!.se).toBe(6);
    expect(ne!.final).toBe(6);
  });
});

describe("suggestedCombination", () => {
  it("stelt de gebruikelijke combinatievakken voor", () => {
    expect(
      suggestedCombination([
        { id: "ne", code: "ne", name: "Nederlands" },
        { id: "maat", code: "maat", name: "Maatschappijleer" },
        { id: "pws", code: "PWS", name: "Profielwerkstuk" },
        { id: "ckv", code: "ckv", name: "CKV" },
        { id: "gs", code: "gs", name: "Geschiedenis" },
      ]),
    ).toEqual(["maat", "pws", "ckv"]);
  });

  it("stelt niets voor als er geen combinatievakken zijn", () => {
    expect(suggestedCombination([{ id: "ne", code: "ne", name: "Nederlands" }])).toEqual([]);
  });
});
