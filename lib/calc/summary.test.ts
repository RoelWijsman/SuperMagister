import { describe, expect, it } from "vitest";
import { overallAverage } from "./summary";

describe("overallAverage", () => {
  it("is het gemiddelde van de vakgemiddeldes, zonder vakken zonder gemiddelde", () => {
    expect(overallAverage([{ average: 6 }, { average: 8 }, { average: null }])).toBe(7);
    expect(overallAverage([{ average: null }])).toBeNull();
    expect(overallAverage([])).toBeNull();
  });
});
