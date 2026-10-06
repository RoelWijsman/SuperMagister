import { describe, expect, it } from "vitest";
import type { Grade, NumericGrade } from "@/lib/types";
import { gradeTrend } from "./trend";

let n = 0;
const grade = (value: number, date: string): NumericGrade => {
  n++;
  return {
    id: `g${n}`,
    subjectId: "wisa",
    description: "",
    weight: 1,
    date,
    enteredAt: `${date}T16:00:00`,
    periodId: null,
    countsTowardAverage: true,
    isPTA: false,
    kind: "numeric",
    value,
    display: String(value).replace(".", ","),
    isSufficient: value >= 5.5,
  };
};

describe("gradeTrend", () => {
  it("neemt je laatste vijf cijfers, oud naar nieuw", () => {
    const grades = [5, 6, 7, 6.5, 7.5, 8].map((v, i) => grade(v, `2026-09-0${i + 1}`));
    const trend = gradeTrend(grades)!;
    expect(trend.recent.map((g) => g.value)).toEqual([6, 7, 6.5, 7.5, 8]);
  });

  it("ziet of je stijgt, daalt of gelijk blijft", () => {
    const up = [6, 6.4, 6.9, 7.3, 7.8].map((v, i) => grade(v, `2026-09-1${i}`));
    const down = [8, 7.6, 7.1, 6.8, 6.2].map((v, i) => grade(v, `2026-09-1${i}`));
    const flat = [7, 7.2, 6.9, 7.1, 7].map((v, i) => grade(v, `2026-09-1${i}`));
    expect(gradeTrend(up)!.direction).toBe("omhoog");
    expect(gradeTrend(down)!.direction).toBe("omlaag");
    expect(gradeTrend(flat)!.direction).toBe("gelijk");
  });

  it("slaat beoordelingen (V, G, O) over en heeft minstens twee cijfers nodig", () => {
    const text: Grade = {
      ...grade(0, "2026-09-20"),
      kind: "text",
      value: "G",
      display: "G",
      isSufficient: true,
    };
    expect(gradeTrend([grade(7, "2026-09-01"), text])).toBeNull();
    expect(gradeTrend([])).toBeNull();
  });

  it("zet cijfers van dezelfde dag op volgorde van invoeren", () => {
    const first = { ...grade(5, "2026-09-01"), enteredAt: "2026-09-01T10:00:00" };
    const second = { ...grade(8, "2026-09-01"), enteredAt: "2026-09-01T12:00:00" };
    expect(gradeTrend([second, first])!.recent.map((g) => g.value)).toEqual([5, 8]);
  });
});
