import { addDays, startOfWeek, toISODate } from "@/lib/date";
import type { ISODate } from "@/lib/types";

export interface MonthCell {
  date: ISODate;
  /** Hoort bij deze maand (anders grijs: einde vorige of begin volgende maand). */
  inMonth: boolean;
}

/** Zes weken van maandag tot en met zondag rond een maand (`month` telt vanaf 0). */
export function monthGrid(year: number, month: number): MonthCell[][] {
  const first = new Date(year, month, 1, 12);
  const start = startOfWeek(first);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = addDays(start, week * 7 + day);
      return { date: toISODate(date), inMonth: date.getMonth() === month };
    }),
  );
}
