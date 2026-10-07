import { describe, expect, it } from "vitest";
import { lesson } from "@/lib/test-utils/lesson";
import { applyTweaks, pickTweak } from "./tweaks";

const D = "2026-10-08";

describe("applyTweaks (gesimuleerde roosterwijzigingen in de demo)", () => {
  const lessons = [
    lesson(D, "08:30", "09:20", { id: "a", location: "A12" }),
    lesson(D, "09:20", "10:10", { id: "b", location: "B21" }),
  ];

  it("laat een les uitvallen of verhuizen, zonder het origineel aan te passen", () => {
    const result = applyTweaks(lessons, [
      { lessonId: "a", kind: "uitval" },
      { lessonId: "b", kind: "lokaal", location: "C07" },
    ]);
    expect(result[0]).toMatchObject({ status: "uitval" });
    expect(result[1]).toMatchObject({
      status: "wijziging",
      location: "C07",
      previousLocation: "B21",
    });
    expect(lessons[0]!.status).toBe("normaal");
  });

  it("laat lessen zonder wijziging met rust", () => {
    expect(applyTweaks(lessons, [])).toEqual(lessons);
  });
});

describe("pickTweak", () => {
  const now = new Date("2026-10-06T10:00:00");
  const lessons = [
    lesson("2026-10-06", "08:30", "09:20", { id: "vandaag" }),
    lesson(D, "08:30", "09:20", { id: "kandidaat", location: "A12" }),
    lesson(D, "09:20", "10:10", { id: "al-weg", status: "uitval" }),
    lesson("2026-10-30", "08:30", "09:20", { id: "te-ver" }),
  ];

  it("kiest een gewone les in de komende week", () => {
    const tweak = pickTweak(lessons, now, () => 0);
    expect(tweak?.lessonId).toBe("kandidaat");
  });

  it("verzint dan uitval of een ander lokaal", () => {
    expect(pickTweak(lessons, now, () => 0)?.kind).toBe("uitval");
    const moved = pickTweak(lessons, now, () => 0.9);
    expect(moved?.kind).toBe("lokaal");
    expect(moved?.location).not.toBe("A12");
  });

  it("geeft null als er niets te wijzigen valt", () => {
    expect(pickTweak([], now, () => 0)).toBeNull();
  });
});
