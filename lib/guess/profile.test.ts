import { describe, expect, it } from "vitest";
import { guesserProfile, MIN_GUESSES_FOR_TYPE, subjectAccuracy } from "./profile";
import type { GuessEntry } from "./types";

let n = 0;
function entry(
  guess: number,
  actual: number,
  subjectId = "wi",
  subjectName = "Wiskunde",
): GuessEntry {
  n += 1;
  const day = String((n % 28) + 1).padStart(2, "0");
  return {
    gradeId: `g${n}`,
    subjectId,
    subjectName,
    guess,
    actual,
    at: `2026-09-${day}T12:00:00.000Z`,
    date: `2026-09-${day}`,
  };
}

const many = (count: number, make: (i: number) => GuessEntry) =>
  Array.from({ length: count }, (_, i) => make(i));

describe("guesserProfile", () => {
  it("wacht tot er genoeg gokken zijn", () => {
    expect(guesserProfile(many(MIN_GUESSES_FOR_TYPE - 1, () => entry(7, 7.1)))).toBeNull();
    expect(guesserProfile(many(MIN_GUESSES_FOR_TYPE, () => entry(7, 7.1)))).not.toBeNull();
  });

  it("noemt iemand die steeds dichtbij zit een orakel", () => {
    const profile = guesserProfile(many(8, (i) => entry(7, i % 2 ? 7.2 : 6.8)));
    expect(profile?.type).toBe("orakel");
    expect(profile?.meanAbsError).toBeCloseTo(0.2);
  });

  it("herkent de bescheiden pessimist: structureel te laag", () => {
    const profile = guesserProfile(many(8, (i) => entry(6 + (i % 3) * 0.1, 7 + (i % 2) * 0.3)));
    expect(profile?.type).toBe("pessimist");
    expect(profile?.meanError).toBeLessThan(0);
  });

  it("herkent het hoofdpersonage: structureel te hoog", () => {
    const profile = guesserProfile(many(8, () => entry(8, 6.8)));
    expect(profile?.type).toBe("hoofdpersonage");
    expect(profile?.meanError).toBeCloseTo(1.2);
  });

  it("noemt alles zonder patroon chaos", () => {
    const profile = guesserProfile(many(8, (i) => entry(i % 2 ? 8.4 : 5.6, 7)));
    expect(profile?.type).toBe("chaos");
  });

  it("telt precies goede gokken", () => {
    const profile = guesserProfile([...many(4, () => entry(7, 7)), entry(6, 7.5)]);
    expect(profile?.exact).toBe(4);
    expect(profile?.count).toBe(5);
  });
});

describe("subjectAccuracy", () => {
  it("vindt je beste en slechtste vak om te gokken", () => {
    const entries = [
      entry(7.1, 7.2, "wi", "Wiskunde"),
      entry(6.9, 7.0, "wi", "Wiskunde"),
      entry(4.5, 6.4, "du", "Duits"),
      entry(7.2, 5.1, "du", "Duits"),
      entry(6.0, 6.6, "en", "Engels"),
      entry(6.3, 6.8, "en", "Engels"),
    ];
    const result = subjectAccuracy(entries);
    expect(result?.best.subjectName).toBe("Wiskunde");
    expect(result?.worst.subjectName).toBe("Duits");
  });

  it("zegt niks als er te weinig vakken zijn of geen duidelijk verschil", () => {
    expect(subjectAccuracy([entry(7, 7.1), entry(7, 7.2)])).toBeNull();
    expect(
      subjectAccuracy([
        entry(7, 7.3, "wi"),
        entry(7, 7.3, "wi"),
        entry(7, 7.4, "en", "Engels"),
        entry(7, 7.4, "en", "Engels"),
      ]),
    ).toBeNull();
  });
});
