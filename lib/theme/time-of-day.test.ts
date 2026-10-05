import { describe, expect, it } from "vitest";
import { getTimeOfDay } from "./time-of-day";

const at = (h: number, m: number) => new Date(2026, 9, 5, h, m);

describe("getTimeOfDay", () => {
  it.each([
    [0, 30, "nacht"],
    [4, 59, "nacht"],
    [5, 0, "ochtend"],
    [9, 59, "ochtend"],
    [10, 0, "dag"],
    [17, 29, "dag"],
    [17, 30, "avond"],
    [21, 59, "avond"],
    [22, 0, "nacht"],
  ] as const)("%i:%i is %s", (h, m, expected) => {
    expect(getTimeOfDay(at(h, m))).toBe(expected);
  });
});
