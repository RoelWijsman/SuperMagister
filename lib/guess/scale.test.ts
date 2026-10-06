import { describe, expect, it } from "vitest";
import {
  clampGuess,
  formatGuess,
  GUESS_MAX,
  GUESS_MIN,
  guessCommentKey,
  guessHue,
  isSixSeven,
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

describe("kleur en geluid", () => {
  it("kleurt van rood via geel naar groen", () => {
    expect(guessHue(10)).toBe(0);
    expect(guessHue(55)).toBeGreaterThan(40);
    expect(guessHue(55)).toBeLessThan(60);
    expect(guessHue(100)).toBeGreaterThan(120);
    for (let t = 11; t <= 100; t++) expect(guessHue(t)).toBeGreaterThan(guessHue(t - 1));
  });

  it("tikt twee octaven omhoog van 1,0 naar 10,0", () => {
    expect(tickFrequency(100) / tickFrequency(10)).toBeCloseTo(4);
    for (let t = 11; t <= 100; t++) expect(tickFrequency(t)).toBeGreaterThan(tickFrequency(t - 1));
  });
});
