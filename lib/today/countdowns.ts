import { diffInCalendarDays, parseISODate, startOfDay, toISODate } from "@/lib/date";
import type { ISODate } from "@/lib/types";

/**
 * Fase 3a: aftellen naar het weekend en het eindexamen. (De vakantie zit in
 * lib/school/holidays.)
 */

export type WeekendCountdown =
  { kind: "weekend" } | { kind: "minuten"; minutes: number } | { kind: "dagen"; days: number };

/**
 * Hoe lang nog tot het weekend. Op vrijdag tot de laatste bel (zonder lessen
 * is het meteen weekend); op maandag tot en met donderdag in dagen.
 */
export function weekendCountdown(now: Date, lastBellToday: Date | null): WeekendCountdown {
  const weekday = now.getDay();
  if (weekday === 0 || weekday === 6) return { kind: "weekend" };
  if (weekday === 5) {
    if (!lastBellToday || now >= lastBellToday) return { kind: "weekend" };
    return {
      kind: "minuten",
      minutes: Math.ceil((lastBellToday.getTime() - now.getTime()) / 60_000),
    };
  }
  return { kind: "dagen", days: 6 - weekday };
}

/**
 * Begin van het centraal examen (eerste tijdvak, havo en vwo), per jaar.
 * Bron: DUO, "1e tv rooster havo 2027" en "1e tv rooster vwo 2027"
 * (beide woensdag 12 mei 2027). Voeg elk jaar de nieuwe datum toe.
 */
export const EXAM_START: Readonly<Record<number, ISODate>> = {
  2027: "2027-05-12",
};

/** Dagen tot je eerste centraal examen; null als het voorbij of onbekend is. */
export function examCountdown(now: Date): { date: ISODate; days: number } | null {
  const today = toISODate(now);
  const upcoming = Object.values(EXAM_START)
    .filter((date) => date >= today)
    .sort()[0];
  if (!upcoming) return null;
  return { date: upcoming, days: diffInCalendarDays(parseISODate(upcoming), startOfDay(now)) };
}
