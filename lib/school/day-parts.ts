import type { Lesson } from "@/lib/types";

/**
 * Fase 3a: een schooldag in stukken, voor de dagtijdlijn.
 * Lessen, uitval, pauzes en tussenuren, op volgorde van tijd.
 */

export type DaySegmentKind = "les" | "uitval" | "pauze" | "tussenuur";

export interface DaySegment {
  kind: DaySegmentKind;
  /** Tijd in milliseconden. */
  start: number;
  end: number;
  /** De les (bij "les" en "uitval"). */
  lesson: Lesson | null;
}

/** Een gat van minstens zoveel minuten is een tussenuur, korter is pauze (zoals lib/school/day). */
const FREE_PERIOD_MINUTES = 40;

const ms = (iso: string) => new Date(iso).getTime();

/** Alle lessen van één dag (ook uitval) met de gaten ertussen. */
export function daySegments(lessons: readonly Lesson[]): DaySegment[] {
  const sorted = [...lessons].sort((a, b) => a.start.localeCompare(b.start));
  const segments: DaySegment[] = [];
  let cursor: number | null = null;
  for (const lesson of sorted) {
    const start = ms(lesson.start);
    const end = ms(lesson.end);
    if (cursor !== null && start > cursor) {
      const minutes = (start - cursor) / 60_000;
      segments.push({
        kind: minutes >= FREE_PERIOD_MINUTES ? "tussenuur" : "pauze",
        start: cursor,
        end: start,
        lesson: null,
      });
    }
    segments.push({ kind: lesson.status === "uitval" ? "uitval" : "les", start, end, lesson });
    cursor = cursor === null ? end : Math.max(cursor, end);
  }
  return segments;
}
