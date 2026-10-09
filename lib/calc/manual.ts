import type { NumericGrade } from "@/lib/types";

/** Een cijfer dat je zelf invult (zonder koppeling, of bij een oefenkaart). */
export interface ManualRow {
  value: number;
  weight: number;
}

/**
 * Zet zelf ingevulde cijfers om naar cijfers waar de calculator mee rekent.
 * Lege of onzinnige regels (geen getal, buiten 1–10, geen weging) tellen niet.
 */
export function manualGrades(rows: readonly ManualRow[]): NumericGrade[] {
  return rows
    .filter(
      (row) => Number.isFinite(row.value) && row.value >= 1 && row.value <= 10 && row.weight > 0,
    )
    .map((row, index) => ({
      id: `handmatig-${index}`,
      subjectId: "handmatig",
      description: "Zelf ingevuld",
      kind: "numeric",
      value: row.value,
      display: String(row.value).replace(".", ","),
      isSufficient: row.value >= 5.5,
      weight: row.weight,
      date: "2000-01-01",
      enteredAt: "2000-01-01T00:00:00Z",
      periodId: null,
      countsTowardAverage: true,
      isPTA: false,
    }));
}
