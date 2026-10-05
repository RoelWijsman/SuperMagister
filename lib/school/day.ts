import type { Lesson } from "@/lib/types";

export type DayStatusKind = "voor-school" | "les" | "pauze" | "tussenuur" | "na-school" | "vrij";

export interface DayStatus {
  kind: DayStatusKind;
  /** De les die nu bezig is. */
  current: Lesson | null;
  /** De eerstvolgende les die nog moet beginnen. */
  next: Lesson | null;
  /** Minuten tot de bel (einde les) of tot de volgende les begint. */
  minutesLeft: number | null;
  /** Hoe ver de les of pauze is, 0–1. */
  progress: number | null;
  /** Lessen die nog komen of nu bezig zijn (zonder uitval). */
  lessonsLeft: number;
}

/** Een gat van minstens zoveel minuten is een tussenuur, korter is pauze. */
const FREE_PERIOD_MINUTES = 40;

const ms = (iso: string) => new Date(iso).getTime();
const minutesUntil = (target: number, now: number) => Math.ceil((target - now) / 60_000);

/** Wat speelt er nu op school? Verwacht de lessen van één dag (uitval mag erbij zitten). */
export function getDayStatus(lessons: readonly Lesson[], now: Date): DayStatus {
  const active = lessons
    .filter((lesson) => lesson.status !== "uitval")
    .sort((a, b) => a.start.localeCompare(b.start));
  const t = now.getTime();
  const lessonsLeft = active.filter((lesson) => ms(lesson.end) > t).length;
  const base = { current: null, next: null, minutesLeft: null, progress: null, lessonsLeft };

  if (active.length === 0) return { ...base, kind: "vrij" };

  const current = active.find((lesson) => ms(lesson.start) <= t && t < ms(lesson.end)) ?? null;
  const next = active.find((lesson) => ms(lesson.start) > t) ?? null;

  if (current) {
    const start = ms(current.start);
    const end = ms(current.end);
    return {
      ...base,
      kind: "les",
      current,
      next,
      minutesLeft: minutesUntil(end, t),
      progress: (t - start) / (end - start),
    };
  }

  if (!next) return { ...base, kind: "na-school" };

  const previous = active.filter((lesson) => ms(lesson.end) <= t).at(-1);
  const nextStart = ms(next.start);
  if (!previous)
    return { ...base, kind: "voor-school", next, minutesLeft: minutesUntil(nextStart, t) };

  const gapStart = ms(previous.end);
  const gapMinutes = (nextStart - gapStart) / 60_000;
  return {
    ...base,
    kind: gapMinutes >= FREE_PERIOD_MINUTES ? "tussenuur" : "pauze",
    next,
    minutesLeft: minutesUntil(nextStart, t),
    progress: (t - gapStart) / (nextStart - gapStart),
  };
}
