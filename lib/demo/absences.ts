import { atTime, toISODate } from "@/lib/date";
import type { Absence, AbsenceKind } from "@/lib/types";
import { addSchoolDays } from "./calendar";
import { BELL_SCHEDULE, WEEK_TIMETABLE } from "./school";

interface AbsenceSpec {
  ago: number;
  kind: AbsenceKind;
  reason: string;
  authorized: boolean;
  /** Welke lessen van die dag: "first", "all" of een lesuur. */
  lessons: "first" | "all" | number;
}

const ABSENCE_SPECS: readonly AbsenceSpec[] = [
  { ago: 3, kind: "te-laat", reason: "Te laat (bus gemist)", authorized: false, lessons: "first" },
  { ago: 6, kind: "materiaal-vergeten", reason: "Boeken vergeten", authorized: false, lessons: 3 },
  { ago: 9, kind: "ziek", reason: "Ziek gemeld door ouders", authorized: true, lessons: "all" },
  {
    ago: 14,
    kind: "huiswerk-vergeten",
    reason: "Huiswerk niet gemaakt",
    authorized: false,
    lessons: 2,
  },
  { ago: 22, kind: "te-laat", reason: "Te laat (tandarts)", authorized: true, lessons: "first" },
  { ago: 31, kind: "afwezig", reason: "Bezoek huisarts", authorized: true, lessons: 4 },
  { ago: 40, kind: "te-laat", reason: "Te laat", authorized: false, lessons: "first" },
];

type Slot = readonly [number, number, string];

function pickSlots(slots: readonly Slot[], which: AbsenceSpec["lessons"]): readonly Slot[] {
  if (which === "all") return slots;
  if (which === "first") return slots.slice(0, 1);
  const match = slots.find(([from, to]) => from <= which && which <= to) ?? slots[0];
  return match ? [match] : [];
}

export function buildDemoAbsences(now: Date): Absence[] {
  const result: Absence[] = [];
  ABSENCE_SPECS.forEach((spec, index) => {
    const day = addSchoolDays(now, -spec.ago);
    const slots = WEEK_TIMETABLE[day.getDay()] ?? [];

    pickSlots(slots, spec.lessons).forEach(([hourFrom, hourTo, subjectId], n) => {
      const [startTime] = BELL_SCHEDULE[hourFrom] ?? ["08:30"];
      const [, endTime] = BELL_SCHEDULE[hourTo] ?? ["", "09:20"];
      const date = toISODate(day);
      result.push({
        id: `demo-absentie-${index + 1}-${n + 1}`,
        start: atTime(day, startTime).toISOString(),
        end: atTime(day, endTime).toISOString(),
        date,
        lessonId: `demo-les-${date}-${hourFrom}`,
        subjectId,
        hour: hourFrom,
        kind: spec.kind,
        reason: spec.reason,
        isAuthorized: spec.authorized,
      });
    });
  });
  return result;
}
