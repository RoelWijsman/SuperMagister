import { COPY, MATCH_OPPONENTS, type CopyKey } from "@/content/copy";
import { fillCopy } from "@/lib/copy";
import { createRandom } from "@/lib/random";
import type { SubjectGroup } from "@/lib/types";
import type { SquadEvaluation } from "./chemistry";

/**
 * Bonus: een oefenwedstrijd tegen een verzonnen tegenstander. De uitslag hangt
 * af van rating en chemie (chemie telt voor een kwart), met wat toeval, en blijft
 * realistisch: meestal 0 tot 4 doelpunten per team, nooit meer dan 6. Wie er
 * scoort, is vaker iemand uit de aanval. Eén seed = altijd dezelfde wedstrijd.
 */

export type MatchEventKind = "goal-ons" | "goal-zij" | "kans-ons" | "kans-zij" | "rust" | "einde";

export interface MatchEvent {
  minute: number;
  kind: MatchEventKind;
  /** Het vak van wie scoorde of de kans had (bij ons). */
  subject: string | null;
  /** De vakgroep daarvan, voor commentaar dat bij het vak past. */
  group: SubjectGroup | null;
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
  /** Man van de wedstrijd: wie het meest scoorde, bij de nul de keeper, anders de hoogste rating. */
  manOfTheMatch: { subject: string; goals: number; reason: "goals" | "nul" | "rating" } | null;
  /** De sterkste chemie-lijn op het veld (twee vakken), als die er is. */
  bestLink: [string, string] | null;
}

/** Nooit meer doelpunten dan dit per team. */
export const MAX_GOALS = 6;

/** Sterkte van jouw elftal: rating (75%) en chemie (25%). Een niet-volledig elftal is zwakker. */
export function teamStrength(evaluation: SquadEvaluation): number {
  // Rating en chemie tellen een lege plek al als 0: een gat maakt je vanzelf zwakker.
  return evaluation.rating * 0.75 + evaluation.chemistry * 0.25;
}

/** Verwacht aantal doelpunten bij een verschil in sterkte: rond 1,35, tussen 0,25 en 3. */
export function expectedGoals(difference: number): number {
  return Math.min(3, Math.max(0.25, 1.35 * Math.exp(difference / 22)));
}

/** Een getal uit een Poisson-verdeling (Knuth), met onze eigen toevalsgenerator. */
function poisson(mean: number, next: () => number): number {
  const limit = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= next();
  } while (p > limit && k <= MAX_GOALS);
  return Math.min(MAX_GOALS, k - 1);
}

export function simulateMatch(evaluation: SquadEvaluation, seed: number): MatchResult {
  const random = createRandom(seed);
  const opponent = random.pick(MATCH_OPPONENTS);
  const opponentStrength = random.int(55, 86);
  const strength = Math.max(1, teamStrength(evaluation));
  const ours = poisson(expectedGoals(strength - opponentStrength), random.next);
  const theirs = poisson(expectedGoals(opponentStrength - strength), random.next);

  // Wie scoort: aanval twee keer zo vaak als het middenveld, verdediging af en toe, de keeper nooit.
  const weights = { aanval: 6, middenveld: 3, verdediging: 1, keeper: 0 } as const;
  const shooters = evaluation.slots.flatMap((s) =>
    s.player ? Array.from({ length: weights[s.line] }, () => s.player!) : [],
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
  const goals = new Map<string, number>();
  const events = moments.map(({ minute, kind }): MatchEvent => {
    if (kind === "goal-ons") score[0]++;
    if (kind === "goal-zij") score[1]++;
    const player = kind === "goal-ons" || kind === "kans-ons" ? shooter() : null;
    if (player && kind === "goal-ons")
      goals.set(player.subjectName, (goals.get(player.subjectName) ?? 0) + 1);
    return {
      minute,
      kind,
      subject: player?.subjectName ?? null,
      group: player?.group ?? null,
      score: [score[0], score[1]],
    };
  });

  return {
    opponent,
    opponentStrength,
    strength: Math.round(strength),
    score: [ours, theirs],
    events,
    outcome: ours > theirs ? "winst" : ours === theirs ? "gelijk" : "verlies",
    manOfTheMatch: manOfTheMatch(evaluation, goals, theirs),
    bestLink: bestLink(evaluation),
  };
}

function manOfTheMatch(
  evaluation: SquadEvaluation,
  goals: ReadonlyMap<string, number>,
  conceded: number,
): MatchResult["manOfTheMatch"] {
  const field = evaluation.slots.filter((s) => s.player);
  const rating = (subject: string) =>
    field.find((s) => s.player!.subjectName === subject)?.player?.rating ?? 0;
  const scorers = [...goals].sort((a, b) => b[1] - a[1] || rating(b[0]) - rating(a[0]));
  if (scorers[0]) return { subject: scorers[0][0], goals: scorers[0][1], reason: "goals" };
  const keeper = field.find((s) => s.line === "keeper");
  if (conceded === 0 && keeper)
    return { subject: keeper.player!.subjectName, goals: 0, reason: "nul" };
  const best = [...field].sort((a, b) => b.player!.rating - a.player!.rating)[0];
  return best ? { subject: best.player!.subjectName, goals: 0, reason: "rating" } : null;
}

function bestLink(evaluation: SquadEvaluation): [string, string] | null {
  const bySlot = new Map(evaluation.slots.map((s) => [s.slot.id, s]));
  const rank = { groen: 2, oranje: 1, rood: 0 } as const;
  const options = evaluation.links.flatMap((link) => {
    const a = bySlot.get(link.a);
    const b = bySlot.get(link.b);
    if (!link.strength || link.strength === "rood" || !a?.player || !b?.player) return [];
    return [{ link, a, b, value: rank[link.strength] * 100 + a.chemistry + b.chemistry }];
  });
  options.sort((x, y) => y.value - x.value);
  const top = options[0];
  return top ? [top.a.player!.subjectName, top.b.player!.subjectName] : null;
}

// ——— Commentaar ——————————————————————————————————————————————————————————————

const GENERAL: Readonly<Record<Exclude<MatchEventKind, "einde">, CopyKey>> = {
  "goal-ons": "wedstrijd.goalOns",
  "goal-zij": "wedstrijd.goalZij",
  "kans-ons": "wedstrijd.kansOns",
  "kans-zij": "wedstrijd.kansZij",
  rust: "wedstrijd.rust",
};

/** Doelpunten met een grap die bij de vakgroep past. Andere groepen krijgen alleen algemene. */
export const GOAL_BY_GROUP: Readonly<Partial<Record<SubjectGroup, CopyKey>>> = {
  exact: "wedstrijd.goalOns.exact",
  talen: "wedstrijd.goalOns.talen",
  "mens-maatschappij": "wedstrijd.goalOns.mensMaatschappij",
  "kunst-cultuur": "wedstrijd.goalOns.kunst",
};

/**
 * Het commentaar bij een wedstrijd: één zin per moment. Binnen één wedstrijd
 * komt geen zin twee keer voor, en een vak-grap alleen bij een vak uit die groep.
 */
export function commentary(result: MatchResult, seed: number): string[] {
  const random = createRandom(seed ^ 0x5eed);
  const used = new Set<string>();
  const take = (key: CopyKey): string | null => {
    const fresh = COPY[key].filter((text) => !used.has(text));
    if (fresh.length === 0) return null;
    const text = random.pick(fresh);
    used.add(text);
    return text;
  };
  return result.events.map((event) => {
    let template: string | null = null;
    if (event.kind === "einde") template = take(`wedstrijd.${result.outcome}`);
    else {
      const special = event.kind === "goal-ons" && event.group ? GOAL_BY_GROUP[event.group] : null;
      if (special && random.chance(0.6)) template = take(special);
      template ??= take(GENERAL[event.kind]) ?? (special ? take(special) : null);
      template ??= random.pick(COPY[GENERAL[event.kind]]);
    }
    return fillCopy(template ?? "", {
      vak: event.subject ?? "Iemand",
      tegenstander: result.opponent,
    });
  });
}
