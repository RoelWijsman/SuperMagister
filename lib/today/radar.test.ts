import { describe, expect, it } from "vitest";
import type { Test } from "@/lib/types";
import { radarDots, RADAR_DAYS } from "./radar";

const now = new Date("2026-10-06T10:00:00");
const test = (id: string, date: string): Test => ({
  id,
  lessonId: id,
  subjectId: "wisa",
  kind: "toets",
  date,
  start: `${date}T09:20:00`,
  html: "",
  text: "",
});

describe("radarDots (toets-radar)", () => {
  const tests = [
    test("c", "2026-10-15"),
    test("a", "2026-10-06"),
    test("b", "2026-10-08"),
    test("weg", "2026-10-30"),
    test("voorbij", "2026-10-02"),
  ];
  const dots = radarDots(tests, now);

  it("toont alleen toetsen van vandaag tot over twee weken", () => {
    expect(RADAR_DAYS).toBe(14);
    expect(dots.map((d) => d.test.id)).toEqual(["a", "b", "c"]);
    expect(dots.map((d) => d.days)).toEqual([0, 2, 9]);
  });

  it("zet dichterbij ook dichter bij het midden", () => {
    expect(dots[0]!.radius).toBeLessThan(dots[1]!.radius);
    expect(dots[1]!.radius).toBeLessThan(dots[2]!.radius);
    for (const dot of dots) {
      expect(dot.radius).toBeGreaterThan(0);
      expect(dot.radius).toBeLessThanOrEqual(1);
    }
  });

  it("verspreidt de stipjes rondom, elke keer op dezelfde plek", () => {
    const angles = dots.map((d) => d.angle);
    expect(new Set(angles.map((a) => a.toFixed(3))).size).toBe(angles.length);
    expect(radarDots(tests, now)).toEqual(dots);
  });
});
