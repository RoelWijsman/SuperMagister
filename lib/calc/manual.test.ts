import { describe, expect, it } from "vitest";
import { weightedAverage } from "./average";
import { manualGrades } from "./manual";
import { requiredGrade } from "./whatif";

describe("manualGrades", () => {
  it("maakt van zelf ingevulde cijfers iets waar de calculator mee rekent", () => {
    const grades = manualGrades([
      { value: 6, weight: 1 },
      { value: 4.5, weight: 2 },
    ]);
    expect(weightedAverage(grades)).toBe(5);
    expect(requiredGrade(grades, 5.5, 1)).toEqual({ status: "mogelijk", grade: 7 });
  });

  it("slaat lege of onzinnige regels over", () => {
    const grades = manualGrades([
      { value: Number.NaN, weight: 1 },
      { value: 11, weight: 1 },
      { value: 7, weight: 0 },
      { value: 8, weight: 1 },
    ]);
    expect(grades).toHaveLength(1);
    expect(weightedAverage(grades)).toBe(8);
  });
});
