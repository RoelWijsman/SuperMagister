import { toTenths } from "./scale";
import type { GuessEntry } from "./types";

/**
 * Wat voor gokker ben je? Gebaseerd op het verschil tussen gok en cijfer
 * (gok min echt: negatief = te laag gegokt).
 */
export type GuesserType = "orakel" | "pessimist" | "hoofdpersonage" | "chaos";

export const MIN_GUESSES_FOR_TYPE = 5;

export const GUESSER_TITLES: Readonly<Record<GuesserType, string>> = {
  orakel: "Het Orakel van {klas}",
  pessimist: "De Bescheiden Pessimist",
  hoofdpersonage: "Hoofdpersonage",
  chaos: "Chaosgokker",
};

export interface GuesserProfile {
  type: GuesserType;
  count: number;
  exact: number;
  /** Gemiddeld gok min echt. */
  meanError: number;
  /** Gemiddeld hoe ver ernaast, zonder richting. */
  meanAbsError: number;
}

/** Gemiddeld hooguit zo ver ernaast: dan ben je een orakel. */
const ORACLE = 0.4;
/** Zo ver structureel te laag of te hoog… */
const BIAS = 0.3;
/** …en dan in minstens dit deel van de gokken. */
const SHARE = 0.65;

const diffOf = (entry: GuessEntry) => (toTenths(entry.guess) - toTenths(entry.actual)) / 10;
const mean = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
const round2 = (value: number) => Math.round(value * 100) / 100;

export function guesserProfile(entries: readonly GuessEntry[]): GuesserProfile | null {
  if (entries.length < MIN_GUESSES_FOR_TYPE) return null;
  const diffs = entries.map(diffOf);
  const meanAbsError = mean(diffs.map(Math.abs));
  const meanError = mean(diffs);
  const share = (test: (d: number) => boolean) => diffs.filter(test).length / diffs.length;

  const type: GuesserType =
    meanAbsError <= ORACLE
      ? "orakel"
      : meanError <= -BIAS && share((d) => d < 0) >= SHARE
        ? "pessimist"
        : meanError >= BIAS && share((d) => d > 0) >= SHARE
          ? "hoofdpersonage"
          : "chaos";

  return {
    type,
    count: entries.length,
    exact: diffs.filter((d) => d === 0).length,
    meanError: round2(meanError),
    meanAbsError: round2(meanAbsError),
  };
}

export interface SubjectAccuracy {
  subjectId: string;
  subjectName: string;
  meanAbsError: number;
  count: number;
}

/** Je beste en slechtste vak om te gokken, als het verschil echt iets zegt. */
export function subjectAccuracy(
  entries: readonly GuessEntry[],
  minPerSubject = 2,
): { best: SubjectAccuracy; worst: SubjectAccuracy } | null {
  const groups = new Map<string, { name: string; diffs: number[] }>();
  for (const entry of entries) {
    const group = groups.get(entry.subjectId) ?? { name: entry.subjectName, diffs: [] };
    group.diffs.push(Math.abs(diffOf(entry)));
    groups.set(entry.subjectId, group);
  }
  const eligible: SubjectAccuracy[] = [...groups]
    .filter(([, group]) => group.diffs.length >= minPerSubject)
    .map(([subjectId, group]) => ({
      subjectId,
      subjectName: group.name,
      meanAbsError: round2(mean(group.diffs)),
      count: group.diffs.length,
    }))
    .sort((a, b) => a.meanAbsError - b.meanAbsError);
  if (eligible.length < 2) return null;
  const best = eligible[0]!;
  const worst = eligible[eligible.length - 1]!;
  return worst.meanAbsError - best.meanAbsError >= 0.3 ? { best, worst } : null;
}
