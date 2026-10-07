import type { Grade, NumericGrade, Period } from "@/lib/types";
import { weightedAverage } from "./average";

/**
 * Fase 4: rekenwerk voor het cijferoverzicht. Periodes vergelijken, de
 * ranglijst met wat het laatste cijfer deed, het verloop voor de grafiek en
 * denkbeeldige cijfers voor de simulator.
 */

const counts = (grade: Grade): grade is NumericGrade =>
  grade.kind === "numeric" && grade.countsTowardAverage && grade.weight > 0;

const byEntered = (a: Grade, b: Grade) =>
  a.enteredAt.localeCompare(b.enteredAt) || a.date.localeCompare(b.date);

/** Per periode (in volgorde) het gemiddelde van één vak; cijfers zonder periode tellen niet. */
export function periodAverages(
  grades: readonly Grade[],
  periods: readonly Period[],
): { periodId: string; average: number | null; count: number }[] {
  return periods.map((period) => {
    const own = grades.filter((grade) => grade.periodId === period.id);
    return { periodId: period.id, average: weightedAverage(own), count: own.length };
  });
}

export type RankDirection = "op" | "neer" | "gelijk" | "nieuw";

export interface RankRow {
  subjectId: string;
  average: number;
  /** Het gemiddelde vóór het laatst ingevoerde cijfer. */
  previous: number | null;
  direction: RankDirection;
}

/** Vakken op gemiddelde (hoogste eerst), met ↑↓ voor wat het laatste cijfer deed. */
export function ranking(grades: readonly Grade[], subjectIds: readonly string[]): RankRow[] {
  const rows = subjectIds.flatMap((subjectId): RankRow[] => {
    const own = grades.filter((grade) => grade.subjectId === subjectId).sort(byEntered);
    const average = weightedAverage(own);
    if (average === null) return [];
    const previous = weightedAverage(own.slice(0, -1));
    const direction: RankDirection =
      previous === null
        ? "nieuw"
        : Math.abs(average - previous) < 1e-9
          ? "gelijk"
          : average > previous
            ? "op"
            : "neer";
    return [{ subjectId, average, previous, direction }];
  });
  const order = new Map(subjectIds.map((id, i) => [id, i]));
  return rows.sort(
    (a, b) => b.average - a.average || order.get(a.subjectId)! - order.get(b.subjectId)!,
  );
}

export interface HistoryPoint {
  id: string;
  date: string;
  value: number;
  weight: number;
  counts: boolean;
  /** Het gemiddelde na dit cijfer (null zolang er nog niets meetelt). */
  average: number | null;
  grade: NumericGrade;
}

/** Alle numerieke cijfers op datum, met het gemiddelde tot dan toe (de lijn in de grafiek). */
export function averageHistory(grades: readonly Grade[]): HistoryPoint[] {
  const numeric = grades
    .filter((grade): grade is NumericGrade => grade.kind === "numeric")
    .sort((a, b) => a.date.localeCompare(b.date) || a.enteredAt.localeCompare(b.enteredAt));
  let sum = 0;
  let weights = 0;
  return numeric.map((grade) => {
    const isCounted = counts(grade);
    if (isCounted) {
      sum += grade.value * grade.weight;
      weights += grade.weight;
    }
    return {
      id: grade.id,
      date: grade.date,
      value: grade.value,
      weight: grade.weight,
      counts: isCounted,
      average: weights > 0 ? sum / weights : null,
      grade,
    };
  });
}

export interface Hypothetical {
  id: string;
  subjectId: string;
  value: number;
  weight: number;
  /** Telt mee voor het SE (in een examenklas). */
  isPTA?: boolean;
}

/** De simulator: je cijfers plus denkbeeldige cijfers die gewoon meetellen. */
export function withHypothetical(
  grades: readonly Grade[],
  extra: readonly Hypothetical[],
): Grade[] {
  const now = new Date().toISOString();
  return [
    ...grades,
    ...extra.map((item): NumericGrade => ({
      id: `sim-${item.id}`,
      subjectId: item.subjectId,
      description: "Denkbeeldig cijfer",
      weight: item.weight,
      date: now.slice(0, 10),
      enteredAt: now,
      periodId: null,
      countsTowardAverage: true,
      isPTA: item.isPTA ?? false,
      kind: "numeric",
      value: item.value,
      display: String(item.value).replace(".", ","),
      isSufficient: item.value >= 5.5,
    })),
  ];
}
