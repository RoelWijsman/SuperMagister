import { diffInCalendarDays, parseISODate, startOfDay } from "@/lib/date";
import type { Test } from "@/lib/types";

/** Zo ver kijkt de toets-radar vooruit. */
export const RADAR_DAYS = 14;

export interface RadarDot {
  test: Test;
  /** Dagen tot de toets (0 = vandaag). */
  days: number;
  /** Afstand tot het midden, 0–1: dichterbij in tijd is dichter bij het midden. */
  radius: number;
  /** Hoek in radialen (0 = rechts, met de klok mee). */
  angle: number;
}

/** Gulden hoek: opeenvolgende stipjes komen nooit op elkaar terecht. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
/** Vandaag staat niet precies in het midden (daar draait de sweep). */
const INNER = 0.14;

/** Toetsen van vandaag tot over twee weken als stipjes op de radar. */
export function radarDots(tests: readonly Test[], now: Date): RadarDot[] {
  const today = startOfDay(now);
  return tests
    .map((test) => ({ test, days: diffInCalendarDays(parseISODate(test.date), today) }))
    .filter(({ days }) => days >= 0 && days <= RADAR_DAYS)
    .sort((a, b) => a.test.start.localeCompare(b.test.start) || a.test.id.localeCompare(b.test.id))
    .map(({ test, days }, i) => ({
      test,
      days,
      radius: INNER + (1 - INNER) * (days / RADAR_DAYS),
      angle: (-Math.PI / 2 + i * GOLDEN_ANGLE) % (Math.PI * 2),
    }));
}
