import { MATCH_OPPONENTS } from "@/content/copy";
import { createRandom } from "@/lib/random";
import type { SquadEvaluation } from "./chemistry";

/**
 * Bonus: een oefenwedstrijd tegen een verzonnen tegenstander. De uitslag hangt
 * af van rating en chemie (chemie telt voor een kwart), met wat toeval. Wie er
 * scoort, is vaker iemand uit de aanval. Eén seed = altijd dezelfde wedstrijd.
 */

export type MatchEventKind = "goal-ons" | "goal-zij" | "kans-ons" | "kans-zij" | "rust" | "einde";

export interface MatchEvent {
  minute: number;
  kind: MatchEventKind;
  /** Het vak van wie scoorde of de kans had (bij ons). */
  subject: string | null;
  /** De stand na dit moment. */
  score: [number, number];
}

export interface MatchResult {
  opponent: string;
  /** 0–100, hoe sterk de tegenstander is. */
  opponentStrength: number;
  strength: number;
  score: [number, number];
  events: MatchEvent[];
  outcome: "winst" | "gelijk" | "verlies";
}

/** Sterkte van jouw elftal: rating (75%) en chemie (25%). Een niet-volledig elftal is zwakker. */
export function teamStrength(evaluation: SquadEvaluation): number {
  const filled = evaluation.placed / evaluation.formation.slots.length;
  return (evaluation.rating * 0.75 + evaluation.chemistry * 0.25) * filled;
}

/** Een getal uit een Poisson-verdeling (Knuth), met onze eigen toevalsgenerator. */
function poisson(mean: number, next: () => number): number {
  const limit = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= next();
  } while (p > limit && k < 12);
  return k - 1;
}

export function simulateMatch(evaluation: SquadEvaluation, seed: number): MatchResult {
  const random = createRandom(seed);
  const opponent = random.pick(MATCH_OPPONENTS);
  const opponentStrength = random.int(55, 86);
  const strength = Math.max(1, teamStrength(evaluation));
  const ratio = strength / opponentStrength;
  const ours = poisson(Math.min(5, 1.35 * ratio ** 2), random.next);
  const theirs = poisson(Math.min(5, 1.35 / ratio ** 2), random.next);

  // Wie scoort: aanval drie keer zo vaak als het middenveld, verdediging af en toe, de keeper nooit.
  const weights = { aanval: 6, middenveld: 3, verdediging: 1, keeper: 0 } as const;
  const shooters = evaluation.slots.flatMap((s) =>
    s.player ? Array.from({ length: weights[s.line] }, () => s.player!.subjectName) : [],
  );
  const shooter = () => (shooters.length ? random.pick(shooters) : null);

  const moments: { minute: number; kind: MatchEventKind }[] = [
    ...Array.from({ length: ours }, () => ({
      minute: random.int(3, 89),
      kind: "goal-ons" as const,
    })),
    ...Array.from({ length: theirs }, () => ({
      minute: random.int(3, 89),
      kind: "goal-zij" as const,
    })),
    { minute: random.int(5, 40), kind: "kans-ons" },
    { minute: random.int(50, 85), kind: random.chance(0.5) ? "kans-ons" : "kans-zij" },
    { minute: 45, kind: "rust" },
    { minute: 90, kind: "einde" },
  ];
  moments.sort(
    (a, b) => a.minute - b.minute || (a.kind === "einde" ? 1 : b.kind === "einde" ? -1 : 0),
  );

  const score: [number, number] = [0, 0];
  const events = moments.map(({ minute, kind }) => {
    if (kind === "goal-ons") score[0]++;
    if (kind === "goal-zij") score[1]++;
    return {
      minute,
      kind,
      subject: kind === "goal-ons" || kind === "kans-ons" ? shooter() : null,
      score: [score[0], score[1]] as [number, number],
    };
  });

  return {
    opponent,
    opponentStrength,
    strength: Math.round(strength),
    score: [ours, theirs],
    events,
    outcome: ours > theirs ? "winst" : ours === theirs ? "gelijk" : "verlies",
  };
}
