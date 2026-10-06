import { describe, expect, it } from "vitest";
import { gradeTone } from "@/lib/calc/average";
import {
  clampGuess,
  formatGuess,
  GUESS_MAX,
  GUESS_MIN,
  guessCommentKey,
  isSixSeven,
  SCALE_ZONES,
  scaleFraction,
  tickFrequency,
} from "./scale";

describe("gokken in tienden", () => {
  it("loopt van 1,0 tot 10,0", () => {
    expect(GUESS_MIN).toBe(10);
    expect(GUESS_MAX).toBe(100);
    expect(clampGuess(3)).toBe(10);
    expect(clampGuess(140)).toBe(100);
    expect(clampGuess(67.4)).toBe(67);
  });

  it("toont een gok met een komma", () => {
    expect(formatGuess(72)).toBe("7,2");
    expect(formatGuess(100)).toBe("10,0");
    expect(formatGuess(10)).toBe("1,0");
  });
});

describe("guessCommentKey", () => {
  it.each([
    [10, "gok.commentaar.een"],
    [11, "gok.commentaar.laag"],
    [29, "gok.commentaar.laag"],
    [30, "gok.commentaar.zwak"],
    [49, "gok.commentaar.zwak"],
    [50, "gok.commentaar.bijna"],
    [54, "gok.commentaar.bijna"],
    [55, "gok.commentaar.precies"],
    [56, "gok.commentaar.krap"],
    [59, "gok.commentaar.krap"],
    [60, "gok.commentaar.realistisch"],
    [66, "gok.commentaar.realistisch"],
    [67, "gok.commentaar.67"],
    [68, "gok.commentaar.realistisch"],
    [69, "gok.commentaar.realistisch"],
    [70, "gok.commentaar.zelfvertrouwen"],
    [79, "gok.commentaar.zelfvertrouwen"],
    [80, "gok.commentaar.aura"],
    [94, "gok.commentaar.aura"],
    [95, "gok.commentaar.genie"],
    [100, "gok.commentaar.genie"],
  ])("%i hoort bij %s", (tenths, key) => {
    expect(guessCommentKey(tenths)).toBe(key);
  });

  it("kent de 6,7 als enige bijzondere gok", () => {
    expect(isSixSeven(67)).toBe(true);
    expect(isSixSeven(76)).toBe(false);
  });
});

describe("geluid", () => {
  it("tikt twee octaven omhoog van 1,0 naar 10,0", () => {
    expect(tickFrequency(100) / tickFrequency(10)).toBeCloseTo(4);
    for (let t = 11; t <= 100; t++) expect(tickFrequency(t)).toBeGreaterThan(tickFrequency(t - 1));
  });
});

describe("de gokschaal naast de kaart", () => {
  it("loopt van 1,0 onderaan tot 10,0 bovenaan", () => {
    expect(scaleFraction(10)).toBe(0);
    expect(scaleFraction(100)).toBe(1);
    expect(scaleFraction(55)).toBe(0.5);
    expect(scaleFraction(3)).toBe(0);
    expect(scaleFraction(120)).toBe(1);
  });

  it("dekt de hele schaal zonder gaten", () => {
    expect(SCALE_ZONES[0]!.from).toBe(0);
    expect(SCALE_ZONES[SCALE_ZONES.length - 1]!.to).toBe(1);
    SCALE_ZONES.slice(1).forEach((zone, i) => expect(zone.from).toBe(SCALE_ZONES[i]!.to));
  });

  it("kleurt rood, oranje en groen, net als de cijfers in de rest van de app", () => {
    expect(SCALE_ZONES.map((zone) => zone.tone)).toEqual(["bad", "warn", "good"]);
    for (let tenths = 10; tenths <= 100; tenths++) {
      const f = scaleFraction(tenths);
      const zone = SCALE_ZONES.find((z) => f >= z.from && (f < z.to || z.to === 1));
      expect(zone?.tone).toBe(gradeTone(tenths / 10));
    }
  });
});
