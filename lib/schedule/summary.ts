import { formatTime } from "@/lib/date";
import { isTestInfoType } from "@/lib/school/derive";
import type { Lesson } from "@/lib/types";
import { freePeriods } from "./gaps";

/**
 * Fase 3b: samenvattingen voor het rooster. Dagsamenvatting, weekbelasting,
 * weekstatistiek, langste en kortste dag, en uitslapen of vroeg naar huis.
 */

const active = (lessons: readonly Lesson[]) =>
  lessons
    .filter((lesson) => lesson.status !== "uitval")
    .sort((a, b) => a.start.localeCompare(b.start));

/** "3e uur" of bij een blokuur "5e–6e uur"; null zonder lesuur. */
export function hourLabel(lesson: Lesson): string | null {
  if (lesson.hourFrom === null) return null;
  if (lesson.hourTo === null || lesson.hourTo === lesson.hourFrom) return `${lesson.hourFrom}e uur`;
  return `${lesson.hourFrom}e–${lesson.hourTo}e uur`;
}

/** Lesuren die doorgaan; een blokuur (5e–6e) telt als twee. */
export function lessonHours(lessons: readonly Lesson[]): number {
  return active(lessons).reduce(
    (sum, lesson) =>
      sum +
      (lesson.hourFrom !== null && lesson.hourTo !== null
        ? Math.max(1, lesson.hourTo - lesson.hourFrom + 1)
        : 1),
    0,
  );
}

/** "6 uur · 08:30–14:50 · 1 toets · 2× huiswerk". */
export function daySummary(lessons: readonly Lesson[], homeworkCount: number): string {
  const list = active(lessons);
  if (list.length === 0) return "Alles valt uit";
  const tests = list.filter((lesson) => isTestInfoType(lesson.infoType)).length;
  const parts = [
    `${lessonHours(list)} uur`,
    `${formatTime(new Date(list[0]!.start))}–${formatTime(new Date(list.at(-1)!.end))}`,
  ];
  if (tests > 0) parts.push(`${tests} ${tests === 1 ? "toets" : "toetsen"}`);
  if (homeworkCount > 0) parts.push(`${homeworkCount}× huiswerk`);
  return parts.join(" · ");
}

export interface DayEdges {
  /** Je eerste uur (of uren) valt uit: je begint later. */
  sleepIn: { until: Date; lessonIds: string[] } | null;
  /** Je laatste uur (of uren) valt uit: je bent eerder vrij. */
  homeEarly: { from: Date; lessonIds: string[] } | null;
}

/** Uitval aan het begin of eind van de dag (niet als alles uitvalt). */
export function dayEdges(lessons: readonly Lesson[]): DayEdges {
  const sorted = [...lessons].sort((a, b) => a.start.localeCompare(b.start));
  const first = sorted.findIndex((lesson) => lesson.status !== "uitval");
  if (first === -1) return { sleepIn: null, homeEarly: null };
  const last = sorted.findLastIndex((lesson) => lesson.status !== "uitval");
  const before = sorted.slice(0, first);
  const after = sorted.slice(last + 1);
  return {
    sleepIn:
      before.length > 0
        ? { until: new Date(sorted[first]!.start), lessonIds: before.map((l) => l.id) }
        : null,
    homeEarly:
      after.length > 0
        ? { from: new Date(sorted[last]!.end), lessonIds: after.map((l) => l.id) }
        : null,
  };
}

export type LoadLevel = "vrij" | "rustig" | "normaal" | "druk" | "zwaar";

/** Vanaf zoveel toetsen in een week waarschuwen we. */
export const BUSY_WEEK_TESTS = 3;

/** Hoe druk een dag is: lesuren, huiswerk (×1,5) en toetsen (×4). */
export function dayLoad(
  lessons: readonly Lesson[],
  homeworkCount: number,
  testCount: number,
): { score: number; level: LoadLevel } {
  const score = lessonHours(lessons) + homeworkCount * 1.5 + testCount * 4;
  const level: LoadLevel =
    score === 0
      ? "vrij"
      : score < 6
        ? "rustig"
        : score < 11
          ? "normaal"
          : score < 15
            ? "druk"
            : "zwaar";
  return { score, level };
}

/** "Deze week: 31 lessen, 2 uitgevallen, 4 tussenuren". */
export function weekStats(lessons: readonly Lesson[]) {
  const byDate = new Map<string, Lesson[]>();
  for (const lesson of lessons)
    byDate.set(lesson.date, [...(byDate.get(lesson.date) ?? []), lesson]);
  let freeCount = 0;
  for (const day of byDate.values()) freeCount += freePeriods(day).length;
  return {
    lessons: lessons.filter((lesson) => lesson.status !== "uitval").length,
    cancelled: lessons.filter((lesson) => lesson.status === "uitval").length,
    freePeriods: freeCount,
  };
}

/** Langste en kortste schooldag (van eerste tot laatste les die doorgaat). */
export function longestAndShortest(
  days: readonly { date: string; lessons: readonly Lesson[] }[],
): { longest: string; shortest: string } | null {
  const spans = days.flatMap(({ date, lessons }) => {
    const list = active(lessons);
    if (list.length === 0) return [];
    return [{ date, minutes: (+new Date(list.at(-1)!.end) - +new Date(list[0]!.start)) / 60_000 }];
  });
  if (spans.length < 2) return null;
  const sorted = [...spans].sort((a, b) => a.minutes - b.minutes);
  return { longest: sorted.at(-1)!.date, shortest: sorted[0]!.date };
}
