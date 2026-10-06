import { toTenths } from "./scale";

/**
 * Hoe ver zat je gok ernaast? Het verschil is altijd echt min gok: +0,6
 * betekent dat het cijfer 0,6 hoger is dan je dacht.
 */
export type GuessOutcomeKind =
  "exact" | "dichtbij" | "netjes" | "ernaast" | "veelHoger" | "veelLager";

export interface GuessOutcome {
  kind: GuessOutcomeKind;
  /** Echt min gok, op één decimaal. */
  diff: number;
  xp: number;
}

/** XP per uitkomst: veel voor precies goed, een paar voor de moeite. */
export const GUESS_XP: Readonly<Record<GuessOutcomeKind, number>> = {
  exact: 50,
  dichtbij: 30,
  netjes: 20,
  ernaast: 10,
  veelHoger: 5,
  veelLager: 5,
};

/** Vanaf hier is het "echt veel" hoger of lager (in tienden). */
const FAR = 15;

export function guessOutcome(guess: number, actual: number): GuessOutcome {
  const diffTenths = toTenths(actual) - toTenths(guess);
  const distance = Math.abs(diffTenths);
  const kind: GuessOutcomeKind =
    distance === 0
      ? "exact"
      : distance <= 3
        ? "dichtbij"
        : distance <= 5
          ? "netjes"
          : diffTenths >= FAR
            ? "veelHoger"
            : diffTenths <= -FAR
              ? "veelLager"
              : "ernaast";
  return { kind, diff: diffTenths / 10, xp: GUESS_XP[kind] };
}

/** Wat we per cijfer bewaren: de gok, het moment en het verschil (plus de verdiende XP). */
export interface GuessRecord {
  gok: number;
  at: string;
  verschil: number;
  xp: number;
}

export function makeGuessRecord(guess: number, actual: number, at: Date): GuessRecord {
  const outcome = guessOutcome(guess, actual);
  return {
    gok: toTenths(guess) / 10,
    at: at.toISOString(),
    verschil: outcome.diff,
    xp: outcome.xp,
  };
}
