import { describe, expect, it } from "vitest";
import { monthGrid } from "./month";

describe("monthGrid (maandweergave)", () => {
  it("geeft zes weken van maandag tot en met zondag", () => {
    const grid = monthGrid(2026, 9); // oktober 2026
    expect(grid).toHaveLength(6);
    for (const week of grid) expect(week).toHaveLength(7);
    // 1 oktober 2026 is een donderdag: de eerste rij begint op maandag 28 september.
    expect(grid[0]![0]).toEqual({ date: "2026-09-28", inMonth: false });
    expect(grid[0]![3]).toEqual({ date: "2026-10-01", inMonth: true });
    expect(grid[4]![5]).toEqual({ date: "2026-10-31", inMonth: true });
    expect(grid[5]![6]).toEqual({ date: "2026-11-08", inMonth: false });
  });
});
