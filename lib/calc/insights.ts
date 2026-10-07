import { DAY_NAMES, MONTH_NAMES, parseISODate } from "@/lib/date";
import type { Grade, NumericGrade, Period } from "@/lib/types";
import { formatGrade, roundHalfUp, weightedAverage } from "./average";

/**
 * Fase 4: inzichten in gewone taal ("Engels gaat al 3 toetsen omhoog") en de
 * cijfertijdlijn als verhaal. Alleen rekenwerk; de zinnen staan in
 * content/copy.ts onder "inzicht." en "tijdlijn.".
 */

export type InsightKey =
  | "inzicht.stijgt"
  | "inzicht.daalt"
  | "inzicht.randje"
  | "inzicht.jaarOmhoog"
  | "inzicht.jaarOmlaag"
  | "inzicht.dag"
  | "inzicht.beste"
  | "inzicht.negens";

export interface Insight {
  id: string;
  key: InsightKey;
  vars: Record<string, string | number>;
  tone: "good" | "warn" | "neutral";
}

const MIN_RUN = 3;
const MIN_PER_DAY = 3;
const MAX_INSIGHTS = 5;

const counts = (grade: Grade): grade is NumericGrade =>
  grade.kind === "numeric" && grade.countsTowardAverage && grade.weight > 0;
const byDate = (a: Grade, b: Grade) =>
  a.date.localeCompare(b.date) || a.enteredAt.localeCompare(b.enteredAt);

/** Hoe vaak op rij (aan het eind) een cijfer hoger (of lager) was dan het vorige. */
function tailRun(values: readonly number[], up: boolean): number {
  let run = 0;
  for (let i = values.length - 1; i > 0; i--) {
    const diff = values[i]! - values[i - 1]!;
    if (up ? diff > 0 : diff < 0) run++;
    else break;
  }
  return run;
}

const mean = (values: readonly number[]) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

export function gradeInsights(
  grades: readonly Grade[],
  { name, periods }: { name: (subjectId: string) => string; periods: readonly Period[] },
): Insight[] {
  const counted = grades.filter(counts).sort(byDate);
  if (counted.length === 0) return [];
  const bySubject = new Map<string, NumericGrade[]>();
  for (const grade of counted)
    bySubject.set(grade.subjectId, [...(bySubject.get(grade.subjectId) ?? []), grade]);

  const found: (Insight & { priority: number })[] = [];
  const push = (insight: Insight, priority: number) => found.push({ ...insight, priority });

  // Op rij omhoog of omlaag: het vak met de langste reeks.
  for (const up of [true, false]) {
    let best: { subjectId: string; run: number } | null = null;
    for (const [subjectId, list] of bySubject) {
      const run = tailRun(
        list.map((g) => g.value),
        up,
      );
      if (run >= MIN_RUN && (!best || run > best.run)) best = { subjectId, run };
    }
    if (best)
      push(
        {
          id: `${up ? "stijgt" : "daalt"}-${best.subjectId}`,
          key: up ? "inzicht.stijgt" : "inzicht.daalt",
          vars: { vak: name(best.subjectId), aantal: best.run },
          tone: up ? "good" : "warn",
        },
        up ? 1 : 2,
      );
  }

  const averages = [...bySubject.entries()].map(([subjectId, list]) => ({
    subjectId,
    average: weightedAverage(list)!,
    count: list.length,
  }));

  // Op het randje: je staat er net een 5,5 of 5,6.
  const edge = averages
    .filter((a) => {
      const shown = roundHalfUp(a.average, 1);
      return shown >= 5.5 && shown <= 5.6;
    })
    .sort((a, b) => a.average - b.average)[0];
  if (edge)
    push(
      {
        id: `randje-${edge.subjectId}`,
        key: "inzicht.randje",
        vars: { vak: name(edge.subjectId), cijfer: formatGrade(edge.average) },
        tone: "warn",
      },
      3,
    );

  // Dit jaar: je gemiddelde nu tegenover periode 1 (zelfde vakken).
  const first = periods[0];
  if (first && counted.some((g) => g.periodId !== first.id)) {
    const pairs = [...bySubject.entries()].flatMap(([, list]) => {
      const start = weightedAverage(list.filter((g) => g.periodId === first.id));
      return start === null ? [] : [{ start, now: weightedAverage(list)! }];
    });
    const diff = (mean(pairs.map((p) => p.now)) ?? 0) - (mean(pairs.map((p) => p.start)) ?? 0);
    if (pairs.length > 0 && Math.abs(diff) >= 0.1)
      push(
        {
          id: "jaar",
          key: diff > 0 ? "inzicht.jaarOmhoog" : "inzicht.jaarOmlaag",
          vars: { verschil: formatGrade(Math.abs(diff)) },
          tone: diff > 0 ? "good" : "warn",
        },
        4,
      );
  }

  // De dag van de week met je hoogste cijfers (op de dag van de toets).
  const byDay = new Map<number, number[]>();
  for (const grade of counted) {
    const day = parseISODate(grade.date).getDay();
    byDay.set(day, [...(byDay.get(day) ?? []), grade.value]);
  }
  const days = [...byDay.entries()].filter(([, values]) => values.length >= MIN_PER_DAY);
  if (days.length >= 2) {
    const [day, values] = days.sort((a, b) => mean(b[1])! - mean(a[1])!)[0]!;
    push(
      {
        id: "dag",
        key: "inzicht.dag",
        vars: { dag: DAY_NAMES[day] ?? "", cijfer: formatGrade(mean(values)!) },
        tone: "neutral",
      },
      5,
    );
  }

  const best = averages.filter((a) => a.count >= 2).sort((a, b) => b.average - a.average)[0];
  if (best && averages.length >= 2)
    push(
      {
        id: `beste-${best.subjectId}`,
        key: "inzicht.beste",
        vars: { vak: name(best.subjectId), cijfer: formatGrade(best.average) },
        tone: "good",
      },
      6,
    );

  const nines = counted.filter((g) => g.value >= 9).length;
  if (nines >= 2)
    push({ id: "negens", key: "inzicht.negens", vars: { aantal: nines }, tone: "good" }, 7);

  return found
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_INSIGHTS)
    .map(({ priority: _priority, ...insight }) => insight);
}

export type Milestone =
  { kind: "eerste" } | { kind: "hoogste" } | { kind: "negen" } | { kind: "comeback"; from: number };

export interface TimelineEntry {
  grade: Grade;
  milestone: Milestone | null;
}

export interface TimelineMonth {
  /** "2026-09" */
  key: string;
  /** "september 2026" */
  label: string;
  entries: TimelineEntry[];
}

const COMEBACK_FROM = 5.5;
const COMEBACK_TO = 7;

/** Al je cijfers op volgorde, per maand, met mijlpalen: de eerste, de hoogste, je eerste 9, comebacks. */
export function gradeTimeline(grades: readonly Grade[]): TimelineMonth[] {
  const sorted = [...grades].sort(byDate);
  const numeric = sorted.filter((g): g is NumericGrade => g.kind === "numeric");
  const highest = numeric.reduce<NumericGrade | null>(
    (top, g) => (!top || g.value > top.value ? g : top),
    null,
  );
  const firstNine = numeric.find((g) => g.value >= 9 && g !== highest) ?? null;
  const lastBySubject = new Map<string, NumericGrade>();

  const months: TimelineMonth[] = [];
  sorted.forEach((grade, index) => {
    let milestone: Milestone | null = null;
    if (grade.kind === "numeric") {
      const previous = lastBySubject.get(grade.subjectId);
      if (grade === highest) milestone = { kind: "hoogste" };
      else if (previous && previous.value < COMEBACK_FROM && grade.value >= COMEBACK_TO)
        milestone = { kind: "comeback", from: previous.value };
      else if (grade === firstNine) milestone = { kind: "negen" };
      lastBySubject.set(grade.subjectId, grade);
    }
    if (!milestone && index === 0) milestone = { kind: "eerste" };

    const key = grade.date.slice(0, 7);
    let month = months.at(-1);
    if (!month || month.key !== key) {
      const date = parseISODate(grade.date);
      month = { key, label: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`, entries: [] };
      months.push(month);
    }
    month.entries.push({ grade, milestone });
  });
  return months;
}
