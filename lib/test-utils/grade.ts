import type { Grade, NumericGrade, TextGrade, TextGradeValue } from "@/lib/types";

let counter = 0;

/**
 * Alleen voor tests: een numeriek cijfer met redelijke standaardwaarden.
 * `numeric(6.8, 2, { subjectId: "ne", isPTA: true })`
 */
export function numeric(value: number, weight = 1, extra: Partial<NumericGrade> = {}): Grade {
  counter += 1;
  return {
    id: `cijfer-${counter}`,
    subjectId: "wisa",
    description: "Toets",
    weight,
    date: "2026-10-01",
    enteredAt: "2026-10-02T12:00:00.000Z",
    periodId: "p1",
    countsTowardAverage: true,
    isPTA: false,
    kind: "numeric",
    value,
    display: String(value).replace(".", ","),
    isSufficient: value >= 5.5,
    ...extra,
  };
}

/** Alleen voor tests: een beoordeling als V, G of O. */
export function text(value: TextGradeValue, extra: Partial<TextGrade> = {}): Grade {
  counter += 1;
  return {
    id: `beoordeling-${counter}`,
    subjectId: "lo",
    description: "Beoordeling",
    weight: 1,
    date: "2026-10-01",
    enteredAt: "2026-10-02T12:00:00.000Z",
    periodId: "p1",
    countsTowardAverage: true,
    isPTA: false,
    kind: "text",
    value,
    display: value,
    isSufficient: value === "O" ? false : value === "V" || value === "G" ? true : null,
    ...extra,
  };
}
