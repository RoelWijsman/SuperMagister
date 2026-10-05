import { describe, expect, it } from "vitest";
import {
  addDays,
  atTime,
  diffInCalendarDays,
  formatLongDate,
  formatRelativeDay,
  formatShortDate,
  formatTime,
  isWeekend,
  isoWeek,
  nextWeekday,
  parseISODate,
  startOfWeek,
  toISODate,
} from "./date";

describe("toISODate", () => {
  it("formats the local calendar date as YYYY-MM-DD", () => {
    expect(toISODate(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05");
  });

  it("pads month and day", () => {
    expect(toISODate(new Date(2026, 0, 7))).toBe("2026-01-07");
  });
});

describe("parseISODate", () => {
  it("parses to local midnight", () => {
    const d = parseISODate("2026-03-29");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 29, 0]);
  });
});

describe("addDays", () => {
  it("crosses month boundaries", () => {
    expect(toISODate(addDays(new Date(2026, 9, 30), 3))).toBe("2026-11-02");
  });

  it("keeps the wall-clock time across a DST change", () => {
    const d = addDays(new Date(2026, 9, 24, 8, 30), 2);
    expect(toISODate(d)).toBe("2026-10-26");
    expect([d.getHours(), d.getMinutes()]).toEqual([8, 30]);
  });

  it("supports negative amounts", () => {
    expect(toISODate(addDays(new Date(2026, 2, 1), -1))).toBe("2026-02-28");
  });
});

describe("startOfWeek", () => {
  it("returns the monday of the week for a sunday", () => {
    expect(toISODate(startOfWeek(new Date(2026, 9, 11, 15)))).toBe("2026-10-05");
  });

  it("returns the same day at midnight for a monday", () => {
    const d = startOfWeek(new Date(2026, 9, 5, 15));
    expect(toISODate(d)).toBe("2026-10-05");
    expect(d.getHours()).toBe(0);
  });
});

describe("diffInCalendarDays", () => {
  it("counts calendar days and ignores the time of day", () => {
    expect(diffInCalendarDays(new Date(2026, 9, 6, 0, 1), new Date(2026, 9, 5, 23, 59))).toBe(1);
  });

  it("is correct across a DST change", () => {
    expect(diffInCalendarDays(new Date(2026, 9, 26), new Date(2026, 9, 24))).toBe(2);
  });

  it("is negative for dates in the past", () => {
    expect(diffInCalendarDays(new Date(2026, 9, 1), new Date(2026, 9, 5))).toBe(-4);
  });
});

describe("isWeekend", () => {
  it("is true on saturday and sunday only", () => {
    expect(isWeekend(new Date(2026, 9, 10))).toBe(true);
    expect(isWeekend(new Date(2026, 9, 11))).toBe(true);
    expect(isWeekend(new Date(2026, 9, 9))).toBe(false);
  });
});

describe("nextWeekday", () => {
  it("returns tomorrow on a normal weekday", () => {
    expect(toISODate(nextWeekday(new Date(2026, 9, 5)))).toBe("2026-10-06");
  });

  it("skips the weekend", () => {
    expect(toISODate(nextWeekday(new Date(2026, 9, 9)))).toBe("2026-10-12");
    expect(toISODate(nextWeekday(new Date(2026, 9, 10)))).toBe("2026-10-12");
  });
});

describe("atTime", () => {
  it("builds a local date-time from an ISO date and HH:MM", () => {
    const d = atTime("2026-10-05", "09:20");
    expect(toISODate(d)).toBe("2026-10-05");
    expect([d.getHours(), d.getMinutes()]).toEqual([9, 20]);
  });
});

describe("formatTime", () => {
  it("pads hours and minutes", () => {
    expect(formatTime(new Date(2026, 9, 5, 8, 5))).toBe("08:05");
  });
});

describe("isoWeek", () => {
  it("returns week 41 for monday 5 october 2026", () => {
    expect(isoWeek(new Date(2026, 9, 5))).toEqual({ year: 2026, week: 41 });
  });

  it("puts 1 january 2027 in week 53 of 2026", () => {
    expect(isoWeek(new Date(2027, 0, 1))).toEqual({ year: 2026, week: 53 });
  });
});

describe("formatRelativeDay", () => {
  const now = new Date(2026, 9, 5, 10, 0); // maandag

  it("uses words for nearby days", () => {
    expect(formatRelativeDay(new Date(2026, 9, 5), now)).toBe("vandaag");
    expect(formatRelativeDay(new Date(2026, 9, 6), now)).toBe("morgen");
    expect(formatRelativeDay(new Date(2026, 9, 7), now)).toBe("overmorgen");
    expect(formatRelativeDay(new Date(2026, 9, 4), now)).toBe("gisteren");
  });

  it("uses the weekday name within the coming week", () => {
    expect(formatRelativeDay(new Date(2026, 9, 9), now)).toBe("vrijdag");
  });

  it("uses a short date further away", () => {
    expect(formatRelativeDay(new Date(2026, 9, 15), now)).toBe("do 15 okt");
  });
});

describe("formatLongDate / formatShortDate", () => {
  it("formats in Dutch", () => {
    expect(formatLongDate(new Date(2026, 9, 5))).toBe("maandag 5 oktober");
    expect(formatShortDate(new Date(2026, 2, 3))).toBe("3 mrt");
  });
});
