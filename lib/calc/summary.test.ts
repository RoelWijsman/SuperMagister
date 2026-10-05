import { describe, expect, it } from "vitest";
import type { Grade } from "@/lib/types";
import { overallAverage, summarizeSubject } from "./summary";

let n = 0;
function grade(subjectId: string, value: number | "V", weight: number, date: string): Grade {
  n++;
  const base = {
    id: `g${n}`,
    subjectId,
    description: "Toets",
    weight,
    date,
    enteredAt: `${date}T15:00:00.000Z`,
    periodId: "p1",
    countsTowardAverage: true,
    isPTA: false,
  };
  return typeof value === "number"
    ? { ...base, kind: "numeric", value, display: String(value), isSufficient: value >= 5.5 }
    : { ...base, kind: "text", value, display: value, isSufficient: true };
}

const grades = [
  grade("wisa", 6, 1, "2026-09-01"),
  grade("wisa", 8, 1, "2026-09-10"),
  grade("wisa", 9, 2, "2026-09-20"),
  grade("en", 7, 1, "2026-09-05"),
  grade("lo", "V", 1, "2026-09-03"),
];
const [g1, g2, g3, g4, g5] = grades.map((g) => g.id);

describe("summarizeSubject", () => {
  it("averages only revealed grades and counts the locked ones", () => {
    const summary = summarizeSubject("wisa", grades, new Set([g1!, g2!, g4!, g5!]));
    expect(summary.average).toBe(7);
    expect(summary.count).toBe(2);
    expect(summary.lockedCount).toBe(1);
  });

  it("lists the latest revealed grades oldest first", () => {
    const summary = summarizeSubject("wisa", grades, new Set([g1!, g2!, g3!]));
    expect(summary.latest.map((g) => g.id)).toEqual([g1, g2, g3]);
  });

  it("keeps everything locked while the revealed set is loading", () => {
    const summary = summarizeSubject("wisa", grades, null);
    expect(summary.average).toBeNull();
    expect(summary.lockedCount).toBe(3);
  });

  it("has no average for subjects with only text grades", () => {
    const summary = summarizeSubject("lo", grades, new Set([g5!]));
    expect(summary.average).toBeNull();
    expect(summary.count).toBe(1);
  });
});

describe("overallAverage", () => {
  it("averages the subject averages and skips subjects without one", () => {
    expect(overallAverage([{ average: 6 }, { average: 8 }, { average: null }])).toBe(7);
    expect(overallAverage([{ average: null }])).toBeNull();
  });
});
