import type { Grade, NumericGrade } from "@/lib/types";

export interface GradeTrend {
  /** Je laatste cijfers, oud naar nieuw. */
  recent: NumericGrade[];
  direction: "omhoog" | "omlaag" | "gelijk";
  /** Stijging per cijfer (lijn door de punten). */
  slope: number;
}

/** Vanaf zoveel stijging of daling per cijfer zie je een pijltje. */
const THRESHOLD = 0.12;

/** Je laatste vijf cijfers en of je stijgt of daalt. Null met minder dan twee cijfers. */
export function gradeTrend(grades: readonly Grade[], count = 5): GradeTrend | null {
  const recent = grades
    .filter((grade): grade is NumericGrade => grade.kind === "numeric")
    .sort((a, b) => a.date.localeCompare(b.date) || a.enteredAt.localeCompare(b.enteredAt))
    .slice(-count);
  if (recent.length < 2) return null;
  // Kleinste kwadraten: de helling van de lijn door de punten.
  const n = recent.length;
  const meanX = (n - 1) / 2;
  const meanY = recent.reduce((sum, grade) => sum + grade.value, 0) / n;
  let top = 0;
  let bottom = 0;
  recent.forEach((grade, x) => {
    top += (x - meanX) * (grade.value - meanY);
    bottom += (x - meanX) ** 2;
  });
  const slope = top / bottom;
  const direction = slope >= THRESHOLD ? "omhoog" : slope <= -THRESHOLD ? "omlaag" : "gelijk";
  return { recent, direction, slope };
}
