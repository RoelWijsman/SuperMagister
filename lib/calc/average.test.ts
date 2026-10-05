import { describe, expect, it } from "vitest";
import type { Grade } from "@/lib/types";
import { formatGrade, gradeTone, roundHalfUp, weightedAverage } from "./average";

function numeric(value: number, weight: number, extra: Partial<Grade> = {}): Grade {
  return {
    id: `g-${value}-${weight}`,
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
    display: String(value),
    isSufficient: value >= 5.5,
    ...extra,
  } as Grade;
}

describe("weightedAverage", () => {
  it("weighs grades by their weight", () => {
    expect(weightedAverage([numeric(6, 1), numeric(9, 2)])).toBeCloseTo(8, 10);
  });

  it("returns null without countable grades", () => {
    expect(weightedAverage([])).toBeNull();
  });

  it("skips grades that do not count or have weight 0", () => {
    const grades = [numeric(8, 1), numeric(2, 1, { countsTowardAverage: false }), numeric(3, 0)];
    expect(weightedAverage(grades)).toBe(8);
  });

  it("skips text grades", () => {
    const text = { ...numeric(0, 1), kind: "text", value: "V", isSufficient: true } as Grade;
    expect(weightedAverage([numeric(7, 1), text])).toBe(7);
  });
});

describe("roundHalfUp", () => {
  it("rounds .x5 up", () => {
    expect(roundHalfUp(5.45, 1)).toBe(5.5);
    expect(roundHalfUp(7.25, 1)).toBe(7.3);
  });

  it("is not fooled by floating point noise", () => {
    expect(roundHalfUp(6.449999999999999, 1)).toBe(6.5);
    expect(roundHalfUp(1.005, 2)).toBe(1.01);
  });

  it("rounds down below the half", () => {
    expect(roundHalfUp(5.44, 1)).toBe(5.4);
  });
});

describe("formatGrade", () => {
  it("uses a decimal comma and one decimal", () => {
    expect(formatGrade(7.8)).toBe("7,8");
    expect(formatGrade(8)).toBe("8,0");
    expect(formatGrade(6.449999999999999)).toBe("6,5");
  });

  it("supports two decimals", () => {
    expect(formatGrade(6.456, 2)).toBe("6,46");
  });
});

describe("gradeTone", () => {
  it("follows the displayed (rounded) value", () => {
    expect(gradeTone(5.44)).toBe("bad");
    expect(gradeTone(5.46)).toBe("warn");
    expect(gradeTone(6.44)).toBe("warn");
    expect(gradeTone(6.45)).toBe("good");
    expect(gradeTone(9.9)).toBe("good");
  });
});
