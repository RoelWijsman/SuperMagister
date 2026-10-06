import { describe, expect, it } from "vitest";
import { GUESS_XP, guessOutcome, makeGuessRecord } from "./outcome";

describe("guessOutcome", () => {
  it.each([
    [7.2, 7.2, "exact", 0],
    [7.2, 7.5, "dichtbij", 0.3],
    [7.5, 7.2, "dichtbij", -0.3],
    [7.0, 7.5, "netjes", 0.5],
    [7.5, 7.0, "netjes", -0.5],
    [7.0, 7.6, "ernaast", 0.6],
    [7.0, 8.4, "ernaast", 1.4],
    [8.4, 7.0, "ernaast", -1.4],
    [7.0, 8.5, "veelHoger", 1.5],
    [5.8, 7.4, "veelHoger", 1.6],
    [8.5, 7.0, "veelLager", -1.5],
    [9.0, 4.1, "veelLager", -4.9],
  ] as const)("gok %s, cijfer %s: %s", (guess, actual, kind, diff) => {
    const outcome = guessOutcome(guess, actual);
    expect(outcome.kind).toBe(kind);
    expect(outcome.diff).toBeCloseTo(diff, 10);
    expect(outcome.xp).toBe(GUESS_XP[kind]);
  });

  it("geeft de meeste XP voor precies goed, en altijd een paar voor de moeite", () => {
    expect(GUESS_XP.exact).toBeGreaterThan(GUESS_XP.dichtbij);
    expect(GUESS_XP.dichtbij).toBeGreaterThan(GUESS_XP.netjes);
    expect(GUESS_XP.netjes).toBeGreaterThan(GUESS_XP.ernaast);
    expect(GUESS_XP.ernaast).toBeGreaterThanOrEqual(GUESS_XP.veelHoger);
    expect(GUESS_XP.veelHoger).toBeGreaterThan(0);
    expect(GUESS_XP.veelLager).toBeGreaterThan(0);
  });

  it("rekent zonder afrondingsfouten van zwevende komma's", () => {
    expect(guessOutcome(6.7, 6.7).kind).toBe("exact");
    expect(guessOutcome(0.1 + 0.2 + 6.4, 6.7).kind).toBe("exact");
  });
});

describe("makeGuessRecord", () => {
  it("bewaart de gok, het moment, het verschil en de XP", () => {
    const at = new Date("2026-10-06T10:15:00.000Z");
    expect(makeGuessRecord(7.2, 7.8, at)).toEqual({
      gok: 7.2,
      at: "2026-10-06T10:15:00.000Z",
      verschil: 0.6,
      xp: GUESS_XP.ernaast,
    });
  });
});
