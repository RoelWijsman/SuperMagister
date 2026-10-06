import { describe, expect, it } from "vitest";
import type { Grade } from "@/lib/types";
import { averageWith, requiredGrade } from "./whatif";

function g(value: number, weight: number): Grade {
  return {
    id: `g-${value}-${weight}`,
    subjectId: "wis",
    description: "Toets",
    weight,
    date: "2026-09-01",
    enteredAt: "2026-09-01T15:00:00.000Z",
    periodId: "p1",
    countsTowardAverage: true,
    isPTA: false,
    kind: "numeric",
    value,
    display: String(value),
    isSufficient: value >= 5.5,
  };
}

describe("averageWith", () => {
  it("rekent het gemiddelde uit met een extra (denkbeeldig) cijfer", () => {
    expect(averageWith([g(6, 1), g(5, 1)], 7, 2)).toBeCloseTo(6.25, 10);
  });

  it("werkt ook zonder eerdere cijfers", () => {
    expect(averageWith([], 7, 1)).toBe(7);
  });
});

describe("requiredGrade", () => {
  it("geeft het benodigde cijfer, naar boven afgerond op één decimaal", () => {
    expect(requiredGrade([g(6, 1), g(5, 1)], 6, 2)).toEqual({ status: "mogelijk", grade: 6.5 });
    // (5 + x) / 2 ≥ 5,5 → x ≥ 6,0
    expect(requiredGrade([g(5, 1)], 5.5, 1)).toEqual({ status: "mogelijk", grade: 6 });
    // (4,9×3 + x) / 4 ≥ 5,5 → x ≥ 7,3
    expect(requiredGrade([g(4.9, 3)], 5.5, 1)).toEqual({ status: "mogelijk", grade: 7.3 });
  });

  it("zegt 'binnen' als zelfs een 1,0 genoeg is", () => {
    expect(requiredGrade([g(9, 3)], 5.5, 1)).toEqual({ status: "binnen", grade: 1 });
  });

  it("zegt 'onmogelijk' als er meer dan een 10 nodig is", () => {
    expect(requiredGrade([g(2, 3)], 5.5, 1)).toEqual({ status: "onmogelijk", grade: null });
  });

  it("is niet gevoelig voor floating-point-ruis", () => {
    // (6 + x) / 2 ≥ 6,1 → x ≥ 6,2 (en niet 6,3)
    expect(requiredGrade([g(6, 1)], 6.1, 1)).toEqual({ status: "mogelijk", grade: 6.2 });
  });
});
