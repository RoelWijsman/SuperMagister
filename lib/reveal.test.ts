import { describe, expect, it } from "vitest";
import {
  initialRevealedIds,
  unrevealedGrades,
  welcomePackIds,
  withHistoryRevealed,
} from "./reveal";

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

describe("welcomePackIds", () => {
  const graded = (id: string, day: number, value: string) => ({
    id,
    enteredAt: `2026-09-${String(day).padStart(2, "0")}T10:00:00Z`,
    kind: value === "INH" || value === "VR" ? ("text" as const) : ("numeric" as const),
    value,
  });

  it("kiest de laatste vijf ingevoerde cijfers", () => {
    const list = Array.from({ length: 8 }, (_, i) => graded(`g${i}`, i + 1, "7"));
    expect(welcomePackIds(list)).toEqual(["g7", "g6", "g5", "g4", "g3"]);
  });

  it("slaat inhalen en vrijstellingen over: dat zijn geen cijfers", () => {
    const list = [graded("inh", 9, "INH"), graded("vr", 8, "VR"), graded("echt", 1, "6")];
    expect(welcomePackIds(list)).toEqual(["echt"]);
  });
});

describe("withHistoryRevealed", () => {
  it("telt cijfers uit eerdere jaren als onthuld, behalve die in het welkomstpack", () => {
    const effective = withHistoryRevealed(new Set(["nu-1"]), ["oud-1", "oud-2"], ["oud-2"]);
    expect([...effective!].sort()).toEqual(["nu-1", "oud-1"]);
  });

  it("laat een geopend welkomstpack onthuld", () => {
    const effective = withHistoryRevealed(new Set(["oud-2"]), ["oud-1", "oud-2"], ["oud-2"]);
    expect(effective!.has("oud-2")).toBe(true);
  });

  it("wacht zolang de opslag nog laadt", () => {
    expect(withHistoryRevealed(null, ["oud-1"], [])).toBeNull();
  });
});
