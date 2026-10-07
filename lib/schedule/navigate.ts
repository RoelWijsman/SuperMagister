import { addDays, isWeekend, nextWeekday, parseISODate, startOfWeek, toISODate } from "@/lib/date";
import type { DateRange, ISODate } from "@/lib/types";
import { monthGrid } from "./month";

export type ScheduleView = "dag" | "week" | "lijst" | "maand";

/** Waar het rooster opent: vandaag, of in het weekend de maandag erna. */
export function defaultFocus(now: Date): ISODate {
  return toISODate(isWeekend(now) ? nextWeekday(now) : now);
}

/** Vorige of volgende: een schooldag, een week of een maand (eerste schooldag). */
export function shiftFocus(focus: ISODate, view: ScheduleView, delta: -1 | 1): ISODate {
  const date = parseISODate(focus);
  if (view === "maand") {
    const first = new Date(date.getFullYear(), date.getMonth() + delta, 1);
    return defaultFocus(first);
  }
  if (view === "dag") {
    let next = addDays(date, delta);
    while (isWeekend(next)) next = addDays(next, delta);
    return toISODate(next);
  }
  return toISODate(addDays(date, delta * 7));
}

/** Welke lessen een weergave nodig heeft. */
export function viewRange(focus: ISODate, view: ScheduleView): DateRange {
  const date = parseISODate(focus);
  if (view === "maand") {
    const grid = monthGrid(date.getFullYear(), date.getMonth());
    return { from: grid[0]![0]!.date, to: grid.at(-1)!.at(-1)!.date };
  }
  const monday = startOfWeek(date);
  return { from: toISODate(monday), to: toISODate(addDays(monday, 6)) };
}
