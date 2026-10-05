import type { Grade } from "@/lib/types";
import { weightedAverage } from "./average";

export interface SubjectSummary {
  subjectId: string;
  /** Gewogen gemiddelde van de onthulde cijfers. */
  average: number | null;
  /** Aantal onthulde cijfers (ook beoordelingen als V/G). */
  count: number;
  /** Nog niet onthuld: zit in het pack. */
  lockedCount: number;
  /** De laatste vijf onthulde cijfers, oudste eerst. */
  latest: Grade[];
}

const LATEST_COUNT = 5;

/**
 * Samenvatting per vak voor het cijferoverzicht. Niet-onthulde cijfers tellen
 * nergens mee, zodat het gemiddelde je pack niet verklapt.
 */
export function summarizeSubject(
  subjectId: string,
  grades: readonly Grade[],
  revealed: ReadonlySet<string> | null,
): SubjectSummary {
  const own = grades.filter((g) => g.subjectId === subjectId);
  const visible = revealed ? own.filter((g) => revealed.has(g.id)) : [];
  const sorted = [...visible].sort(
    (a, b) => a.date.localeCompare(b.date) || a.enteredAt.localeCompare(b.enteredAt),
  );
  return {
    subjectId,
    average: weightedAverage(visible),
    count: visible.length,
    lockedCount: own.length - visible.length,
    latest: sorted.slice(-LATEST_COUNT),
  };
}

/** Gemiddelde van de vakgemiddeldes (vakken zonder gemiddelde tellen niet mee). */
export function overallAverage(summaries: readonly { average: number | null }[]): number | null {
  const values = summaries.flatMap((s) => (s.average === null ? [] : [s.average]));
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}
