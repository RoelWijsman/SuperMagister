import type { Lesson } from "@/lib/types";

/**
 * Alleen voor tests: een les op een dag, met redelijke standaardwaarden.
 * `lesson("2026-10-06", "08:30", "09:20", { subjectId: "ne" })`
 */
export function lesson(
  date: string,
  from: string,
  to: string,
  extra: Partial<Lesson> = {},
): Lesson {
  return {
    id: `les-${date}-${from}`,
    start: `${date}T${from}:00`,
    end: `${date}T${to}:00`,
    date,
    hourFrom: null,
    hourTo: null,
    subjectId: "wisa",
    title: "",
    location: "A12",
    previousLocation: null,
    teachers: [{ code: "VDB" }],
    infoType: "geen",
    status: "normaal",
    contentHtml: null,
    isDone: false,
    ...extra,
  };
}
