import type { Grade } from "@/lib/types";

/** Gewogen gemiddelde van alle numerieke cijfers die meetellen. */
export function weightedAverage(grades: readonly Grade[]): number | null {
  let sum = 0;
  let weights = 0;
  for (const grade of grades) {
    if (grade.kind !== "numeric" || !grade.countsTowardAverage || !(grade.weight > 0)) continue;
    sum += grade.value * grade.weight;
    weights += grade.weight;
  }
  return weights > 0 ? sum / weights : null;
}

/**
 * Rekenkundig afronden (5 naar boven) zonder last van floating-point-ruis:
 * 6,449999999999999 is gewoon 6,45 en wordt dus 6,5.
 */
export function roundHalfUp(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  const cleaned = Math.round(value * 1e9) / 1e9;
  return Math.round(cleaned * factor + 1e-7) / factor;
}

/** "7,8" — met decimale komma, zoals op school. */
export function formatGrade(value: number, decimals = 1): string {
  return roundHalfUp(value, decimals).toFixed(decimals).replace(".", ",");
}

export type GradeTone = "bad" | "warn" | "good";

/** Rood < 5,5 · oranje 5,5–6,4 · groen ≥ 6,5, op basis van de getoonde (afgeronde) waarde. */
export function gradeTone(value: number): GradeTone {
  const rounded = roundHalfUp(value, 1);
  if (rounded < 5.5) return "bad";
  if (rounded < 6.5) return "warn";
  return "good";
}
