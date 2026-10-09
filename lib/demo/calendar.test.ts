import { describe, expect, it } from "vitest";
import { toISODate } from "@/lib/date";
import { addSchoolDays, isDemoSchoolDay } from "./calendar";

describe("isDemoSchoolDay", () => {
  it("is false in the weekend", () => {
    expect(isDemoSchoolDay(new Date(2026, 9, 10))).toBe(false);
  });

  it("is false during the summer and christmas breaks", () => {
    expect(isDemoSchoolDay(new Date(2026, 7, 12))).toBe(false);
    expect(isDemoSchoolDay(new Date(2026, 11, 28))).toBe(false);
  });

  it("is true on a normal weekday", () => {
    expect(isDemoSchoolDay(new Date(2026, 9, 6))).toBe(true);
  });
});

describe("addSchoolDays", () => {
  it("skips the weekend", () => {
    expect(toISODate(addSchoolDays(new Date(2026, 9, 9), 1))).toBe("2026-10-12");
    expect(toISODate(addSchoolDays(new Date(2026, 9, 12), -1))).toBe("2026-10-09");
  });

  it("skips the summer break", () => {
    expect(toISODate(addSchoolDays(new Date(2026, 8, 1), -1))).toBe("2026-07-14");
  });

  it("returns a copy of the date for 0", () => {
    expect(toISODate(addSchoolDays(new Date(2026, 9, 6), 0))).toBe("2026-10-06");
  });
});
