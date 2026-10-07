import { describe, expect, it } from "vitest";
import { numeric, text } from "@/lib/test-utils/grade";
import type { Period } from "@/lib/types";
import { averageHistory, periodAverages, ranking, withHypothetical } from "./overview";

const periods: Period[] = [
  { id: "p1", name: "Periode 1", start: "2026-08-24", end: "2026-11-15" },
  { id: "p2", name: "Periode 2", start: "2026-11-16", end: "2027-02-14" },
  { id: "p3", name: "Periode 3", start: "2027-02-15", end: "2027-07-10" },
];

describe("periodAverages", () => {
  it("geeft per periode het gewogen gemiddelde en het aantal cijfers", () => {
    const result = periodAverages(
      [
        numeric(6, 1, { periodId: "p1" }),
        numeric(8, 3, { periodId: "p1" }),
        numeric(5, 1, { periodId: "p2" }),
        text("V", { subjectId: "wisa", periodId: "p2" }),
        numeric(9, 1, { periodId: null }),
      ],
      periods,
    );
    expect(result).toEqual([
      { periodId: "p1", average: 7.5, count: 2 },
      { periodId: "p2", average: 5, count: 2 },
      { periodId: "p3", average: null, count: 0 },
    ]);
  });

  it("werkt voor een vak zonder cijfers", () => {
    expect(periodAverages([], periods).map((p) => p.average)).toEqual([null, null, null]);
  });
});

describe("ranking (ranglijst)", () => {
  it("sorteert op gemiddelde, met de verandering door het laatste cijfer", () => {
    const rows = ranking(
      [
        numeric(6, 1, { subjectId: "ne", enteredAt: "2026-09-01T10:00:00Z" }),
        numeric(8, 1, { subjectId: "ne", enteredAt: "2026-10-01T10:00:00Z" }),
        numeric(7, 1, { subjectId: "en", enteredAt: "2026-09-05T10:00:00Z" }),
        numeric(6, 1, { subjectId: "en", enteredAt: "2026-10-03T10:00:00Z" }),
        numeric(9, 1, { subjectId: "biol", enteredAt: "2026-10-03T10:00:00Z" }),
        text("G", { subjectId: "lo" }),
      ],
      ["ne", "en", "biol", "lo", "gs"],
    );
    expect(rows).toEqual([
      { subjectId: "biol", average: 9, previous: null, direction: "nieuw" },
      { subjectId: "ne", average: 7, previous: 6, direction: "op" },
      { subjectId: "en", average: 6.5, previous: 7, direction: "neer" },
    ]);
  });

  it("zegt 'gelijk' als het laatste cijfer niet meetelde of niets veranderde", () => {
    const rows = ranking(
      [
        numeric(7, 1, { subjectId: "ne", enteredAt: "2026-09-01T10:00:00Z" }),
        numeric(3, 0, { subjectId: "ne", enteredAt: "2026-10-01T10:00:00Z" }),
      ],
      ["ne"],
    );
    expect(rows[0]).toMatchObject({ average: 7, previous: 7, direction: "gelijk" });
  });
});

describe("averageHistory (voor de grafiek)", () => {
  it("geeft per cijfer het gemiddelde tot dan toe, op datum", () => {
    const points = averageHistory([
      numeric(8, 2, { date: "2026-10-01" }),
      numeric(5, 1, { date: "2026-09-01" }),
      numeric(1, 0, { date: "2026-09-15" }),
      text("V", { date: "2026-09-20" }),
    ]);
    expect(points.map((p) => [p.date, p.value, p.weight, p.counts, p.average])).toEqual([
      ["2026-09-01", 5, 1, true, 5],
      ["2026-09-15", 1, 0, false, 5],
      ["2026-10-01", 8, 2, true, 7],
    ]);
  });
});

describe("withHypothetical (simulator)", () => {
  it("voegt denkbeeldige cijfers toe die gewoon meetellen", () => {
    const grades = [numeric(5, 1, { subjectId: "ne" })];
    const simulated = withHypothetical(grades, [{ id: "a", subjectId: "ne", value: 7, weight: 3 }]);
    expect(simulated).toHaveLength(2);
    expect(simulated[1]).toMatchObject({
      id: "sim-a",
      subjectId: "ne",
      kind: "numeric",
      value: 7,
      weight: 3,
      countsTowardAverage: true,
    });
    expect(grades).toHaveLength(1);
  });

  it("kan een denkbeeldig cijfer als PTA laten tellen (voor het SE)", () => {
    const [sim] = withHypothetical(
      [],
      [{ id: "b", subjectId: "du", value: 4, weight: 2, isPTA: true }],
    );
    expect(sim).toMatchObject({ isPTA: true });
  });
});
