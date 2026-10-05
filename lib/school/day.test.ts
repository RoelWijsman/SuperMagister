import { describe, expect, it } from "vitest";
import { atTime } from "@/lib/date";
import type { Lesson, LessonStatus } from "@/lib/types";
import { getDayStatus } from "./day";

function lesson(id: string, from: string, to: string, status: LessonStatus = "normaal"): Lesson {
  return {
    id,
    start: atTime("2026-10-05", from).toISOString(),
    end: atTime("2026-10-05", to).toISOString(),
    date: "2026-10-05",
    hourFrom: null,
    hourTo: null,
    subjectId: id,
    title: id,
    location: null,
    previousLocation: null,
    teachers: [],
    infoType: "geen",
    status,
    contentHtml: null,
    isDone: false,
  };
}

const day = [
  lesson("b", "09:20", "10:10"),
  lesson("a", "08:30", "09:20"),
  lesson("c", "10:30", "11:20"),
  lesson("d", "11:20", "12:10", "uitval"),
  lesson("e", "12:40", "13:30"),
];
const at = (time: string) => atTime("2026-10-05", time);

describe("getDayStatus", () => {
  it("is 'voor-school' before the first lesson", () => {
    const s = getDayStatus(day, at("07:50"));
    expect(s.kind).toBe("voor-school");
    expect(s.next?.id).toBe("a");
  });

  it("knows the current and next lesson", () => {
    const s = getDayStatus(day, at("08:45"));
    expect(s.kind).toBe("les");
    expect(s.current?.id).toBe("a");
    expect(s.next?.id).toBe("b");
    expect(s.minutesLeft).toBe(35);
    expect(s.progress).toBeCloseTo(15 / 50, 5);
  });

  it("calls a short gap a break", () => {
    const s = getDayStatus(day, at("10:15"));
    expect(s.kind).toBe("pauze");
    expect(s.next?.id).toBe("c");
    expect(s.minutesLeft).toBe(15);
  });

  it("calls a long gap (for example after a cancelled lesson) a free period", () => {
    const s = getDayStatus(day, at("11:30"));
    expect(s.kind).toBe("tussenuur");
    expect(s.next?.id).toBe("e");
  });

  it("is 'na-school' after the last lesson", () => {
    const s = getDayStatus(day, at("14:00"));
    expect(s.kind).toBe("na-school");
    expect(s.current).toBeNull();
    expect(s.next).toBeNull();
  });

  it("is 'vrij' without lessons or when everything is cancelled", () => {
    expect(getDayStatus([], at("10:00")).kind).toBe("vrij");
    expect(getDayStatus([lesson("x", "08:30", "09:20", "uitval")], at("08:00")).kind).toBe("vrij");
  });

  it("counts the lessons that are still to come or in progress", () => {
    expect(getDayStatus(day, at("07:00")).lessonsLeft).toBe(4);
    expect(getDayStatus(day, at("09:00")).lessonsLeft).toBe(4);
    expect(getDayStatus(day, at("12:00")).lessonsLeft).toBe(1);
  });
});
