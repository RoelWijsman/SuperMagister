import type { Grade } from "@/lib/types";

function totals(grades: readonly Grade[]) {
  let sum = 0;
  let weights = 0;
  for (const grade of grades) {
    if (grade.kind !== "numeric" || !grade.countsTowardAverage || !(grade.weight > 0)) continue;
    sum += grade.value * grade.weight;
    weights += grade.weight;
  }
  return { sum, weights };
}

/** Gemiddelde als er nog een (denkbeeldig) cijfer met deze weging bij komt. */
export function averageWith(grades: readonly Grade[], value: number, weight: number): number {
  const { sum, weights } = totals(grades);
  const total = weights + weight;
  return total > 0 ? (sum + value * weight) / total : value;
}

export type RequiredStatus = "binnen" | "mogelijk" | "onmogelijk" | "telt-niet";

/**
 * Welk cijfer is minimaal nodig om op `target` uit te komen? Naar boven
 * afgerond op één decimaal, en zonder op afronding te gokken (5,45 is geen
 * 5,5). "binnen" als zelfs een 1,0 genoeg is, "onmogelijk" als er meer dan
 * een 10 nodig is, "telt-niet" als de volgende toets geen weging heeft.
 */
export function requiredGrade(
  grades: readonly Grade[],
  target: number,
  weight: number,
): { status: RequiredStatus; grade: number | null } {
  const { sum, weights } = totals(grades);
  // Een toets zonder weging verandert niets aan je gemiddelde.
  if (!(weight > 0)) return { status: "telt-niet", grade: null };
  const raw = (target * (weights + weight) - sum) / weight;
  const cleaned = Math.round(raw * 1e9) / 1e9;
  const grade = Math.ceil(cleaned * 10 - 1e-9) / 10;
  if (grade <= 1) return { status: "binnen", grade: 1 };
  if (grade > 10) return { status: "onmogelijk", grade: null };
  return { status: "mogelijk", grade };
}
