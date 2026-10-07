import { describe, expect, it } from "vitest";
import { lesson } from "@/lib/test-utils/lesson";
import type { Homework } from "@/lib/types";
import { freePeriods, suggestForGap } from "./gaps";

const D = "2026-10-06";

describe("freePeriods (tussenuren)", () => {
  it("vindt gaten van minstens 40 minuten, ook als ze door uitval komen", () => {
    const day = [
      lesson(D, "08:30", "09:20"),
      lesson(D, "09:20", "10:10", { status: "uitval" }),
      lesson(D, "10:30", "11:20"),
      lesson(D, "12:10", "13:00"),
    ];
    const gaps = freePeriods(day);
    expect(gaps.map((g) => g.minutes)).toEqual([70, 50]);
    expect(gaps[0]!.start).toEqual(new Date(`${D}T09:20:00`));
    expect(gaps[0]!.cancelled).toBe(true);
    expect(gaps[1]!.cancelled).toBe(false);
  });

  it("telt een pauze niet als tussenuur", () => {
    expect(freePeriods([lesson(D, "08:30", "10:10"), lesson(D, "10:30", "11:20")])).toEqual([]);
  });

  it("telt uitval aan het begin of eind niet: dan ben je gewoon niet op school", () => {
    const day = [lesson(D, "08:30", "09:20", { status: "uitval" }), lesson(D, "09:20", "10:10")];
    expect(freePeriods(day)).toEqual([]);
  });
});

const homework = (id: string, dueDate: string, text: string, isDone = false): Homework => ({
  id,
  lessonId: id,
  subjectId: "en",
  dueDate,
  dueAt: `${dueDate}T09:20:00`,
  html: text,
  text,
  isDone,
  isTest: false,
});

describe("suggestForGap (slimme tussenuren)", () => {
  const list = [
    homework("later", "2026-10-09", "Maak opdracht 1 t/m 4"),
    homework("snel", "2026-10-07", "Lees §2.3"),
    homework("af", "2026-10-07", "Lees §2.4", true),
    homework("lang", "2026-10-07", "Maak opdracht 1 t/m 20"),
  ];

  it("kiest het huiswerk dat het eerst af moet en in het gat past", () => {
    const pick = suggestForGap(45, list, "2026-10-06");
    expect(pick?.homework.id).toBe("snel");
    expect(pick?.minutes).toBeLessThanOrEqual(45);
  });

  it("slaat afgevinkt huiswerk en huiswerk voor vandaag of eerder over", () => {
    expect(suggestForGap(45, list, "2026-10-09")).toBeNull();
  });

  it("geeft niets als er niets past", () => {
    expect(suggestForGap(5, list, "2026-10-06")).toBeNull();
  });
});
