import type { Lesson } from "@/lib/types";

/**
 * Fase 3a: een schooldag in stukken, voor de dagtijdlijn en de laadbalk.
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

export interface LoadSegment extends DaySegment {
  /** Plek op de balk, als deel van de schooldag (0–1). */
  from: number;
  to: number;
}

export interface SchoolDayLoad {
  /** Voor de eerste les, onderweg, klaar, of vandaag geen school. */
  state: "voor" | "bezig" | "klaar" | "vrij";
  /** Hoeveel van de schooldag erop zit, 0–100 (naar beneden afgerond). */
  percent: number;
  /** Minuten tot de laatste bel (0 als je klaar bent). */
  minutesLeft: number;
  /** Begin van de eerste les en einde van de laatste die doorgaan. */
  start: Date | null;
  end: Date | null;
  segments: LoadSegment[];
}

/**
 * De schooldag als downloadbalk: van de eerste tot de laatste les die
 * doorgaat. Valt het eerste uur uit, dan begint je dag later.
 */
export function schoolDayLoad(lessons: readonly Lesson[], now: Date): SchoolDayLoad {
  const all = daySegments(lessons);
  const first = all.findIndex((segment) => segment.kind === "les");
  const last = all.findLastIndex((segment) => segment.kind === "les");
  if (first === -1) {
    return { state: "vrij", percent: 0, minutesLeft: 0, start: null, end: null, segments: [] };
  }
  const parts = all.slice(first, last + 1);
  const start = parts[0]!.start;
  const end = parts.at(-1)!.end;
  const span = end - start;
  const t = now.getTime();
  const segments = parts.map((part) => ({
    ...part,
    from: (part.start - start) / span,
    to: (part.end - start) / span,
  }));
  const state = t < start ? "voor" : t >= end ? "klaar" : "bezig";
  const fraction = Math.min(1, Math.max(0, (t - start) / span));
  return {
    state,
    percent: state === "klaar" ? 100 : Math.floor(fraction * 100),
    minutesLeft: state === "klaar" ? 0 : Math.ceil((end - Math.max(t, start)) / 60_000),
    start: new Date(start),
    end: new Date(end),
    segments,
  };
}
