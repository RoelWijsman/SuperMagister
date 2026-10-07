import { describe, expect, it } from "vitest";
import type { Lesson, LessonStatus } from "@/lib/types";
import { daySegments } from "./day-parts";

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
