import { describe, expect, it } from "vitest";
import { numeric, text } from "@/lib/test-utils/grade";
import type { Grade, Period } from "@/lib/types";
import { gradeInsights, gradeTimeline } from "./insights";

const periods: Period[] = [
  { id: "p1", name: "Periode 1", start: "2026-08-24", end: "2026-11-15" },
  { id: "p2", name: "Periode 2", start: "2026-11-16", end: "2027-02-14" },
];
const names = new Map([
  ["en", "Engels"],
  ["du", "Duits"],
  ["ne", "Nederlands"],
  ["wisa", "Wiskunde A"],
]);
const name = (id: string) => names.get(id) ?? id;

/** Een rij cijfers voor één vak, elke week een nieuwe (maandagen vanaf 7 sep 2026). */
function series(subjectId: string, values: number[], periodId = "p1", startDay = 7): Grade[] {
  return values.map((value, i) => {
    const date = new Date(2026, 8, startDay + i * 7);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return numeric(value, 1, { subjectId, date: iso, enteredAt: `${iso}T15:00:00Z`, periodId });
  });
}

const keysOf = (grades: Grade[]) => gradeInsights(grades, { name, periods }).map((i) => i.key);

describe("gradeInsights", () => {
  it("ziet een vak al een paar toetsen op rij omhoog gaan", () => {
    const insights = gradeInsights(series("en", [5.9, 6.3, 6.8, 7.4]), { name, periods });
    expect(insights[0]).toEqual({
      id: "stijgt-en",
      key: "inzicht.stijgt",
      vars: { vak: "Engels", aantal: 3 },
      tone: "good",
    });
  });

  it("ziet ook een vak dat zakt (pas vanaf drie keer)", () => {
    expect(keysOf(series("du", [7, 6.5, 6, 5.8]))).toContain("inzicht.daalt");
    expect(keysOf(series("du", [7, 6.5, 6]))).not.toContain("inzicht.daalt");
  });

  it("vindt de dag waarop je je hoogste cijfers haalt", () => {
    // Maandagen: 6, 6, 6. Dinsdagen: 8, 8, 8.
    const grades = [...series("ne", [6, 6, 6]), ...series("wisa", [8, 8, 8], "p1", 8)];
    const dag = gradeInsights(grades, { name, periods }).find((i) => i.key === "inzicht.dag");
    expect(dag?.vars).toEqual({ dag: "dinsdag", cijfer: "8,0" });
  });

  it("vergelijkt je gemiddelde met periode 1", () => {
    const grades = [
      ...series("ne", [6, 6], "p1"),
      ...series("ne", [7, 7], "p2", 30),
      ...series("en", [7, 7], "p1"),
      ...series("en", [7.8, 7.8], "p2", 30),
    ];
    const jaar = gradeInsights(grades, { name, periods }).find((i) => i.id === "jaar");
    // Periode 1: (6 + 7) / 2 = 6,5. Nu: (6,5 + 7,4) / 2 = 6,95. Verschil 0,45 → "0,5".
    expect(jaar).toMatchObject({ key: "inzicht.jaarOmhoog", vars: { verschil: "0,5" } });
  });

  it("waarschuwt voor een vak op het randje", () => {
    const randje = gradeInsights(series("du", [5, 6.1]), { name, periods }).find(
      (i) => i.key === "inzicht.randje",
    );
    expect(randje?.vars).toEqual({ vak: "Duits", cijfer: "5,6" });
  });

  it("negeert V/G/O en cijfers die niet meetellen", () => {
    const grades = [
      ...series("en", [5, 6, 7]),
      numeric(8, 0, { subjectId: "en", date: "2026-10-30", periodId: "p1" }),
      text("G", { subjectId: "en", date: "2026-10-31" }),
    ];
    expect(keysOf(grades)).not.toContain("inzicht.stijgt");
  });

  it("zegt niets zonder cijfers", () => {
    expect(gradeInsights([], { name, periods })).toEqual([]);
  });
});

describe("gradeTimeline", () => {
  it("vertelt je cijfers als verhaal, per maand, met mijlpalen", () => {
    const grades = [
      numeric(6.2, 1, { subjectId: "ne", date: "2026-09-03", enteredAt: "2026-09-04T10:00:00Z" }),
      numeric(4.8, 1, { subjectId: "du", date: "2026-09-10", enteredAt: "2026-09-11T10:00:00Z" }),
      numeric(9.1, 1, { subjectId: "en", date: "2026-10-01", enteredAt: "2026-10-02T10:00:00Z" }),
      numeric(7.6, 1, { subjectId: "du", date: "2026-10-08", enteredAt: "2026-10-09T10:00:00Z" }),
      numeric(9.4, 1, { subjectId: "ne", date: "2026-10-12", enteredAt: "2026-10-13T10:00:00Z" }),
    ];
    const months = gradeTimeline(grades);
    expect(months.map((m) => [m.key, m.label, m.entries.length])).toEqual([
      ["2026-09", "september 2026", 2],
      ["2026-10", "oktober 2026", 3],
    ]);
    expect(months.flatMap((m) => m.entries.map((e) => e.milestone))).toEqual([
      { kind: "eerste" },
      null,
      { kind: "negen" },
      { kind: "comeback", from: 4.8 },
      { kind: "hoogste" },
    ]);
  });

  it("geeft een lege tijdlijn zonder cijfers", () => {
    expect(gradeTimeline([])).toEqual([]);
  });
});
