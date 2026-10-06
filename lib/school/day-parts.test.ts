import { describe, expect, it } from "vitest";
import type { Lesson, LessonStatus } from "@/lib/types";
import { daySegments, schoolDayLoad } from "./day-parts";

const DAY = "2026-10-06";
let counter = 0;
function lesson(from: string, to: string, status: LessonStatus = "normaal"): Lesson {
  counter++;
  return {
    id: `les-${counter}`,
    start: `${DAY}T${from}:00`,
    end: `${DAY}T${to}:00`,
    date: DAY,
    hourFrom: null,
    hourTo: null,
    subjectId: "wisa",
    title: "",
    location: "1.12",
    previousLocation: null,
    teachers: [],
    infoType: "geen",
    status,
    contentHtml: null,
    isDone: false,
  };
}
const at = (time: string) => new Date(`${DAY}T${time}:00`);

// 08:30–09:20, 09:20–10:10, pauze, 10:30–11:20, tussenuur (uitval), 12:10–13:00
const day = [
  lesson("08:30", "09:20"),
  lesson("09:20", "10:10"),
  lesson("10:30", "11:20"),
  lesson("11:20", "12:10", "uitval"),
  lesson("12:40", "13:30"),
];

describe("daySegments (dagtijdlijn)", () => {
  it("zet lessen, pauzes, uitval en tussenuren op volgorde", () => {
    expect(daySegments(day).map((s) => s.kind)).toEqual([
      "les",
      "les",
      "pauze",
      "les",
      "uitval",
      "pauze",
      "les",
    ]);
  });

  it("noemt een gat van 40 minuten of meer een tussenuur", () => {
    const gap = daySegments([lesson("08:30", "09:20"), lesson("10:10", "11:00")]);
    expect(gap.map((s) => s.kind)).toEqual(["les", "tussenuur", "les"]);
  });

  it("is leeg zonder lessen", () => {
    expect(daySegments([])).toEqual([]);
  });
});

describe("schoolDayLoad (de laadbalk)", () => {
  it("is voor de eerste les nog niet begonnen", () => {
    const load = schoolDayLoad(day, at("07:45"));
    expect(load.state).toBe("voor");
    expect(load.percent).toBe(0);
    expect(load.start).toEqual(at("08:30"));
  });

  it("laadt mee met de dag, van de eerste tot de laatste les", () => {
    const load = schoolDayLoad(day, at("11:00"));
    expect(load.state).toBe("bezig");
    // 08:30–13:30 is 300 minuten; om 11:00 zijn er 150 voorbij.
    expect(load.percent).toBe(50);
    expect(load.minutesLeft).toBe(150);
  });

  it("is om de laatste bel klaar", () => {
    const load = schoolDayLoad(day, at("13:30"));
    expect(load.state).toBe("klaar");
    expect(load.percent).toBe(100);
    expect(load.minutesLeft).toBe(0);
  });

  it("begint later als het eerste uur uitvalt", () => {
    const late = [lesson("08:30", "09:20", "uitval"), lesson("09:20", "10:10")];
    const load = schoolDayLoad(late, at("09:00"));
    expect(load.state).toBe("voor");
    expect(load.start).toEqual(at("09:20"));
    expect(load.segments.map((s) => s.kind)).toEqual(["les"]);
  });

  it("geeft de stukken van de balk als deel van de dag", () => {
    const { segments } = schoolDayLoad(day, at("11:00"));
    expect(segments[0]!.from).toBe(0);
    expect(segments.at(-1)!.to).toBe(1);
    segments.slice(1).forEach((s, i) => expect(s.from).toBeCloseTo(segments[i]!.to));
  });

  it("is vrij als er niets doorgaat", () => {
    expect(schoolDayLoad([lesson("08:30", "09:20", "uitval")], at("09:00")).state).toBe("vrij");
    expect(schoolDayLoad([], at("09:00")).state).toBe("vrij");
  });
});
