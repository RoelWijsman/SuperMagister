import { describe, expect, it } from "vitest";
import { lesson } from "@/lib/test-utils/lesson";
import {
  BUSY_WEEK_TESTS,
  dayEdges,
  dayLoad,
  daySummary,
  hourLabel,
  lessonHours,
  longestAndShortest,
  weekStats,
} from "./summary";

const D = "2026-10-06";
const day = [
  lesson(D, "08:30", "09:20", { hourFrom: 1, hourTo: 1 }),
  lesson(D, "09:20", "10:10", { hourFrom: 2, hourTo: 2, infoType: "toets" }),
  lesson(D, "10:30", "11:20", { hourFrom: 3, hourTo: 3, status: "uitval" }),
  lesson(D, "11:20", "12:10", { hourFrom: 4, hourTo: 4 }),
  lesson(D, "12:40", "14:20", { hourFrom: 5, hourTo: 6 }),
];

describe("daySummary", () => {
  it("vat een dag samen: uren, begin en eind, toetsen en huiswerk", () => {
    expect(daySummary(day, 2)).toBe("5 uur · 08:30–14:20 · 1 toets · 2× huiswerk");
  });

  it("laat weg wat er niet is", () => {
    expect(daySummary([day[0]!], 0)).toBe("1 uur · 08:30–09:20");
  });

  it("zegt het als alles uitvalt", () => {
    expect(daySummary([day[2]!], 0)).toBe("Alles valt uit");
  });
});

describe("hourLabel", () => {
  it("noemt het lesuur, of een blokuur", () => {
    expect(hourLabel(day[0]!)).toBe("1e uur");
    expect(hourLabel(day[4]!)).toBe("5e–6e uur");
    expect(hourLabel(lesson(D, "08:30", "09:20"))).toBeNull();
  });
});

describe("lessonHours", () => {
  it("telt een blokuur als twee uur", () => {
    expect(lessonHours(day)).toBe(5);
  });
});

describe("dayEdges (uitslapen en vroeg naar huis)", () => {
  it("ziet uitval aan het begin als uitslapen", () => {
    const late = [
      lesson(D, "08:30", "09:20", { status: "uitval" }),
      lesson(D, "09:20", "10:10"),
      lesson(D, "10:30", "11:20"),
    ];
    expect(dayEdges(late)).toEqual({
      sleepIn: { until: new Date(`${D}T09:20:00`), lessonIds: [late[0]!.id] },
      homeEarly: null,
    });
  });

  it("ziet uitval aan het eind als vroeg naar huis", () => {
    const early = [
      lesson(D, "08:30", "09:20"),
      lesson(D, "09:20", "10:10", { status: "uitval" }),
      lesson(D, "10:30", "11:20", { status: "uitval" }),
    ];
    const { homeEarly } = dayEdges(early);
    expect(homeEarly?.from).toEqual(new Date(`${D}T09:20:00`));
    expect(homeEarly?.lessonIds).toHaveLength(2);
  });

  it("noemt uitval in het midden geen van beide", () => {
    expect(dayEdges(day)).toEqual({ sleepIn: null, homeEarly: null });
  });

  it("doet niets als de hele dag uitvalt", () => {
    expect(dayEdges([lesson(D, "08:30", "09:20", { status: "uitval" })])).toEqual({
      sleepIn: null,
      homeEarly: null,
    });
  });
});

describe("dayLoad (weekbelasting)", () => {
  it("weegt lessen, huiswerk en toetsen", () => {
    expect(dayLoad(day, 2, 1).score).toBe(5 + 2 * 1.5 + 4);
  });

  it("geeft een niveau van rustig tot zwaar", () => {
    expect(dayLoad([], 0, 0).level).toBe("vrij");
    expect(dayLoad([day[0]!], 0, 0).level).toBe("rustig");
    expect(dayLoad(day, 1, 0).level).toBe("normaal");
    expect(dayLoad(day, 2, 1).level).toBe("druk");
    expect(dayLoad(day, 4, 2).level).toBe("zwaar");
  });

  it("noemt een week met drie toetsen druk", () => {
    expect(BUSY_WEEK_TESTS).toBe(3);
  });
});

describe("weekStats", () => {
  it("telt lessen, uitval en tussenuren", () => {
    const other = "2026-10-07";
    const week = [
      ...day,
      lesson(other, "08:30", "09:20"),
      lesson(other, "10:30", "11:20"),
      lesson(other, "11:20", "12:10", { status: "uitval" }),
      lesson(other, "13:30", "14:20"),
    ];
    // Di: één tussenuur (uitval 3e uur). Wo: gat van 09:20 tot 10:30 en uitval + pauze.
    expect(weekStats(week)).toEqual({ lessons: 7, cancelled: 2, freePeriods: 3 });
  });
});

describe("longestAndShortest", () => {
  it("vindt de langste en kortste schooldag", () => {
    const days = [
      { date: "2026-10-05", lessons: [lesson("2026-10-05", "08:30", "15:20")] },
      { date: "2026-10-06", lessons: [lesson("2026-10-06", "08:30", "12:10")] },
      { date: "2026-10-07", lessons: [lesson("2026-10-07", "09:20", "14:20")] },
      { date: "2026-10-08", lessons: [] },
    ];
    expect(longestAndShortest(days)).toEqual({ longest: "2026-10-05", shortest: "2026-10-06" });
  });

  it("heeft minstens twee schooldagen nodig", () => {
    expect(longestAndShortest([{ date: D, lessons: [lesson(D, "08:30", "09:20")] }])).toBeNull();
  });
});
