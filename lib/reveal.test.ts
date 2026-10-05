import { describe, expect, it } from "vitest";
import { initialRevealedIds, unrevealedGrades } from "./reveal";

const grade = (id: string, enteredAt: string) => ({ id, enteredAt });

describe("initialRevealedIds", () => {
  it("reveals everything except the starting pack", () => {
    expect(initialRevealedIds(["a", "b", "c", "d"], ["c", "d"])).toEqual(["a", "b"]);
  });
});

describe("unrevealedGrades", () => {
  const grades = [
    grade("a", "2026-10-01T10:00:00Z"),
    grade("b", "2026-10-04T10:00:00Z"),
    grade("c", "2026-10-02T10:00:00Z"),
  ];

  it("returns grades that were not revealed yet, oldest first", () => {
    expect(unrevealedGrades(grades, new Set(["a"])).map((g) => g.id)).toEqual(["c", "b"]);
  });

  it("returns nothing when the revealed set is still loading", () => {
    expect(unrevealedGrades(grades, null)).toEqual([]);
  });
});
