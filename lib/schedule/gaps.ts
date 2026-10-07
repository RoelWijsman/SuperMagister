import { estimateMinutes } from "@/lib/homework/estimate";
import { daySegments } from "@/lib/school/day-parts";
import type { Homework, ISODate, Lesson } from "@/lib/types";

/** Een gat van minstens zoveel minuten is een tussenuur (net als lib/school/day). */
const FREE_PERIOD_MINUTES = 40;

export interface FreePeriod {
  start: Date;
  end: Date;
  minutes: number;
  /** Het gat komt (ook) door uitval. */
  cancelled: boolean;
}

/**
 * Tussenuren: gaten tussen je eerste en laatste les die doorgaan, inclusief
 * uitval in het midden. Uitval aan het begin of eind is uitslapen of vroeg
 * naar huis (zie dayEdges), geen tussenuur.
 */
export function freePeriods(lessons: readonly Lesson[]): FreePeriod[] {
  const segments = daySegments(lessons);
  const first = segments.findIndex((segment) => segment.kind === "les");
  const last = segments.findLastIndex((segment) => segment.kind === "les");
  if (first === -1) return [];
  const result: FreePeriod[] = [];
  let block: { start: number; end: number; cancelled: boolean } | null = null;
  for (const segment of segments.slice(first, last + 1)) {
    if (segment.kind === "les") {
      if (block) {
        const minutes = (block.end - block.start) / 60_000;
        if (minutes >= FREE_PERIOD_MINUTES) {
          result.push({
            start: new Date(block.start),
            end: new Date(block.end),
            minutes,
            cancelled: block.cancelled,
          });
        }
      }
      block = null;
      continue;
    }
    const cancelled = segment.kind === "uitval";
    block = block
      ? { start: block.start, end: segment.end, cancelled: block.cancelled || cancelled }
      : { start: segment.start, end: segment.end, cancelled };
  }
  return result;
}

/**
 * Slim tussenuur: het huiswerk dat het eerst af moet en in het gat past.
 * Alleen huiswerk voor een volgende dag dat nog niet is afgevinkt.
 */
export function suggestForGap(
  gapMinutes: number,
  homework: readonly Homework[],
  today: ISODate,
): { homework: Homework; minutes: number } | null {
  const fitting = homework
    .filter((item) => !item.isDone && item.dueDate > today)
    .map((item) => ({ homework: item, minutes: estimateMinutes(item) }))
    .filter(({ minutes }) => minutes <= gapMinutes)
    .sort((a, b) => a.homework.dueAt.localeCompare(b.homework.dueAt) || b.minutes - a.minutes);
  return fitting[0] ?? null;
}
