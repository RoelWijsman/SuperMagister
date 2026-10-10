import { evaluateSquad, positionFit, type PositionFit, type SquadEvaluation } from "./chemistry";
import {
  BENCH_SIZE,
  FORMATION_IDS,
  FORMATIONS,
  slotLine,
  type FormationId,
  type Line,
  type Slot,
} from "./formations";
import { emptyLineup, type Lineup } from "./lineup";
import type { SquadPlayer } from "./players";

/**
 * "Bouw beste elftal": zoekt de opstelling met de hoogste combinatie van rating
 * en chemie. De score is de gemiddelde rating (een lege plek telt als 0) plus de
 * helft van de teamchemie: één ratingpunt is evenveel waard als twee punten
 * chemie. Omdat een speler uit positie 0 chemie heeft en zijn lijnen rood
 * kleurt, staat een vak alleen buiten zijn linie als er echt niets beters is.
 *
 * Werkwijze: een eerste opstelling op natuurlijke linie en rating, dan net zo
 * lang de beste zet doen (twee plekken omdraaien, of een andere kaart erin) tot
 * het niet meer beter wordt. Daarna de aanvoerder (en nog een ronde zetten) en
 * de bank. Altijd dezelfde uitkomst bij dezelfde kaarten.
 */

export const CHEMISTRY_WEIGHT = 0.5;

/**
 * Moet iemand uit positie, dan liefst in de linie ernaast: exact op het
 * middenveld is minder raar dan exact in de verdediging. Zo klein dat het
 * alleen beslist als de chemie gelijk is.
 */
const DISTANCE_WEIGHT = 1;
const LINE_INDEX: Readonly<Record<Line, number>> = {
  aanval: 0,
  middenveld: 1,
  verdediging: 2,
  keeper: 4,
};

function outOfPositionDistance(evaluation: SquadEvaluation): number {
  let total = 0;
  for (const slot of evaluation.slots) {
    const natural = slot.player?.natural;
    if (!natural || natural === "flexibel" || slot.fit === "natuurlijk") continue;
    total += Math.abs(LINE_INDEX[natural] - LINE_INDEX[slot.line]);
  }
  return total;
}

export function squadScore(evaluation: SquadEvaluation): number {
  return (
    evaluation.ratingSum / evaluation.formation.slots.length +
    CHEMISTRY_WEIGHT * evaluation.chemistryExact -
    DISTANCE_WEIGHT * outOfPositionDistance(evaluation)
  );
}

const better = (a: SquadPlayer, b: SquadPlayer) =>
  a.rating > b.rating ||
  (a.rating === b.rating && a.isIcon && !b.isIcon) ||
  (a.rating === b.rating && a.isIcon === b.isIcon && a.id < b.id);

const byRating = (a: SquadPlayer, b: SquadPlayer) =>
  b.rating - a.rating || a.id.localeCompare(b.id);

/** Per vak de beste kaart (hoogste rating; bij gelijkspel een ICON, dan het id). */
export function bestPerVak(players: readonly SquadPlayer[]): SquadPlayer[] {
  const best = new Map<string, SquadPlayer>();
  for (const player of players) {
    const current = best.get(player.vak);
    if (!current || better(player, current)) best.set(player.vak, player);
  }
  return [...best.values()].sort(byRating);
}

/**
 * De kaarten die het bouwen hoeft te proberen: per vak en per soort kaart
 * (periode, toetssoort, ICON) de hoogste rating. Een andere kaart van dezelfde
 * soort geeft precies dezelfde chemie met een lagere rating, dus die wint nooit.
 */
export function candidatePool(players: Iterable<SquadPlayer>): SquadPlayer[] {
  const best = new Map<string, SquadPlayer>();
  for (const player of players) {
    const key = `${player.vak}|${player.period ?? ""}|${player.testKind ?? ""}|${player.isIcon}`;
    const current = best.get(key);
    if (!current || better(player, current)) best.set(key, player);
  }
  return [...best.values()].sort(byRating);
}

type Slots = Record<string, string | null>;

function evaluate(
  formation: FormationId,
  slots: Slots,
  players: ReadonlyMap<string, SquadPlayer>,
  captain: string | null = null,
): SquadEvaluation {
  return evaluateSquad({ formation, slots, captain }, players);
}

const keeperFirst = (formation: FormationId) =>
  [...FORMATIONS[formation].slots].sort(
    (a, b) => Number(slotLine(b) === "keeper") - Number(slotLine(a) === "keeper"),
  );

const FITS: readonly PositionFit[] = ["natuurlijk", "flexibel", "verkeerd", "onmogelijk"];

/** Eerste opstelling: keeper eerst, dan elke plek de beste speler die er van nature hoort. */
function greedy(formation: FormationId, pool: readonly SquadPlayer[]): Slots {
  const slots: Slots = Object.fromEntries(FORMATIONS[formation].slots.map((s) => [s.id, null]));
  const usedVakken = new Set<string>();
  for (const fit of FITS) {
    for (const slot of keeperFirst(formation)) {
      if (slots[slot.id]) continue;
      const player = pool.find(
        (p) => !usedVakken.has(p.vak) && positionFit(p, slotLine(slot)) === fit,
      );
      if (player) {
        slots[slot.id] = player.id;
        usedVakken.add(player.vak);
      }
    }
  }
  return slots;
}

export interface Improvement {
  slots: Slots;
  evaluation: SquadEvaluation;
  score: number;
}

/**
 * Alle zetten vanuit een opstelling: twee plekken omdraaien, of een kaart uit
 * `pool` op een plek zetten (zonder een vak twee keer op het veld). Geeft de
 * beste zet die de score verhoogt, of null.
 */
export function bestImprovement(
  formation: FormationId,
  slots: Slots,
  pool: readonly SquadPlayer[],
  players: ReadonlyMap<string, SquadPlayer>,
  captain: string | null,
  accept: (candidate: Improvement, current: Improvement) => boolean = (c, cur) =>
    c.score > cur.score + 1e-9,
  /** Mag deze kaart op deze plek (bijv. niet als zijn vak al op de bank zit met een andere versie)? */
  allowed: (player: SquadPlayer, slotId: string) => boolean = () => true,
): Improvement | null {
  const ids = FORMATIONS[formation].slots.map((s) => s.id);
  const startEval = evaluate(formation, slots, players, captain);
  const current: Improvement = { slots, evaluation: startEval, score: squadScore(startEval) };
  let best: Improvement | null = null;
  const consider = (candidate: Slots) => {
    const onField = new Set(Object.values(candidate));
    const evaluation = evaluate(
      formation,
      candidate,
      players,
      captain && onField.has(captain) ? captain : null,
    );
    const option: Improvement = { slots: candidate, evaluation, score: squadScore(evaluation) };
    if (accept(option, current) && (!best || option.score > best.score + 1e-9)) best = option;
  };
  const vakAt = new Map<string, string>();
  for (const id of ids) {
    const player = slots[id] ? players.get(slots[id]!) : undefined;
    if (player) vakAt.set(player.vak, id);
  }
  const onField = new Set(Object.values(slots).filter(Boolean));
  for (let i = 0; i < ids.length; i++) {
    const a = ids[i]!;
    for (let j = i + 1; j < ids.length; j++) {
      const b = ids[j]!;
      if ((slots[a] ?? null) === (slots[b] ?? null)) continue;
      consider({ ...slots, [a]: slots[b] ?? null, [b]: slots[a] ?? null });
    }
    for (const player of pool) {
      if (onField.has(player.id)) continue;
      const taken = vakAt.get(player.vak);
      if (taken !== undefined && taken !== a) continue;
      if (!allowed(player, a)) continue;
      consider({ ...slots, [a]: player.id });
    }
  }
  return best;
}

/** Net zo lang de beste zet doen tot er geen betere meer is. */
function improve(
  formation: FormationId,
  start: Slots,
  pool: readonly SquadPlayer[],
  players: ReadonlyMap<string, SquadPlayer>,
  captain: string | null,
): Slots {
  let slots = start;
  for (let pass = 0; pass < 80; pass++) {
    const step = bestImprovement(formation, slots, pool, players, captain);
    if (!step) break;
    slots = step.slots;
  }
  return slots;
}

/** Aanvoerder: de hoogste rating die er nog chemie bij kan krijgen (anders gewoon de hoogste). */
function pickCaptain(evaluation: SquadEvaluation): string | null {
  const candidates = evaluation.slots
    .filter((s) => s.player && (s.fit === "natuurlijk" || s.fit === "flexibel"))
    .sort(
      (a, b) =>
        Number(a.chemistry >= 10) - Number(b.chemistry >= 10) ||
        b.player!.rating - a.player!.rating,
    );
  return candidates[0]?.player?.id ?? null;
}

const BENCH_LINES: readonly Line[] = ["keeper", "verdediging", "middenveld", "aanval"];

/**
 * De bank: de spelers (vakken) die niet op het veld staan, elk met zijn beste
 * versie. Eerst per linie één reserve (keeper, verdediging, middenveld, aanval),
 * dan de beste die over zijn. Elk vak is één speler, dus een vak dat op het veld
 * staat, kan niet ook op de bank: met twaalf vakken is er één reserve.
 */
export function fillBench(slots: Slots, allPlayers: Iterable<SquadPlayer>): (string | null)[] {
  const players = [...allPlayers].sort(byRating);
  const byId = new Map(players.map((p) => [p.id, p]));
  const taken = new Set(
    Object.values(slots).flatMap((id) => (id && byId.has(id) ? [byId.get(id)!.vak] : [])),
  );
  const reserves = bestPerVak(players.filter((p) => !taken.has(p.vak)));
  const bench: SquadPlayer[] = [];
  for (const line of BENCH_LINES) {
    const reserve =
      reserves.find((p) => !bench.includes(p) && p.natural === line) ??
      (line === "keeper"
        ? undefined
        : reserves.find((p) => !bench.includes(p) && p.natural === "flexibel"));
    if (reserve && bench.length < BENCH_SIZE) bench.push(reserve);
  }
  for (const reserve of reserves)
    if (bench.length < BENCH_SIZE && !bench.includes(reserve)) bench.push(reserve);
  return Array.from({ length: BENCH_SIZE }, (_, i) => bench[i]?.id ?? null);
}

export interface BuildResult {
  lineup: Lineup;
  evaluation: SquadEvaluation;
  /** Ter vergelijking: alleen de hoogste ratings, zonder op chemie te letten. */
  ratingOnly: { rating: number; chemistry: number };
  /** Een andere formatie die nog beter uitkomt, als die er is. */
  betterFormation: { formation: FormationId; rating: number; chemistry: number } | null;
}

function buildFor(
  formation: FormationId,
  pool: readonly SquadPlayer[],
  all: readonly SquadPlayer[],
  players: ReadonlyMap<string, SquadPlayer>,
): Lineup {
  let slots = improve(formation, greedy(formation, pool), pool, players, null);
  let captain = pickCaptain(evaluate(formation, slots, players));
  // Met de band erbij kan een andere zet net beter zijn; de band gaat mee met de kaart.
  for (let round = 0; round < 3 && captain; round++) {
    slots = improve(formation, slots, pool, players, captain);
    if (Object.values(slots).includes(captain)) break;
    captain = pickCaptain(evaluate(formation, slots, players));
  }
  return { formation, slots, bench: fillBench(slots, all), captain };
}

/** Bouwt het beste elftal in deze formatie, en kijkt of een andere formatie beter zou zijn. */
export function buildBestSquad(
  allPlayers: readonly SquadPlayer[],
  formation: FormationId,
): BuildResult {
  const players = new Map(allPlayers.map((p) => [p.id, p]));
  const pool = candidatePool(allPlayers);
  if (pool.length === 0) {
    const lineup = emptyLineup(formation);
    const evaluation = evaluateSquad(lineup, players);
    return { lineup, evaluation, ratingOnly: { rating: 0, chemistry: 0 }, betterFormation: null };
  }

  const lineup = buildFor(formation, pool, allPlayers, players);
  const evaluation = evaluateSquad(lineup, players);

  // Ter vergelijking: de elf hoogste ratings (één per vak), alleen op natuurlijke linie verdeeld.
  const topEleven = bestPerVak(allPlayers).slice(0, FORMATIONS[formation].slots.length);
  const plain = evaluate(formation, greedy(formation, topEleven), players);

  let betterFormation: BuildResult["betterFormation"] = null;
  // Pas een andere formatie noemen als het echt uitmaakt (minstens 2 scorepunten).
  let bar = squadScore(evaluation) + 2;
  for (const other of FORMATION_IDS) {
    if (other === formation) continue;
    const otherEval = evaluateSquad(buildFor(other, pool, allPlayers, players), players);
    const score = squadScore(otherEval);
    if (score > bar) {
      bar = score;
      betterFormation = {
        formation: other,
        rating: otherEval.rating,
        chemistry: otherEval.chemistry,
      };
    }
  }

  return {
    lineup,
    evaluation,
    ratingOnly: { rating: plain.rating, chemistry: plain.chemistry },
    betterFormation,
  };
}

/** Hoe dicht een nieuwe plek bij de oude ligt: dezelfde plek, positie of linie. */
function closeness(old: Slot, next: Slot): number {
  if (old.id === next.id) return 3;
  if (old.position === next.position) return 2;
  return slotLine(old) === slotLine(next) ? 1 : 0;
}

/**
 * Andere formatie: dezelfde elf kaarten, opnieuw verdeeld op hun natuurlijke
 * linie. Eerst krijgt elke plek iemand die er van nature hoort (bij gelijke
 * keus wie het dichtst bij zijn oude plek stond), dan flexibel, dan de rest.
 * Daarna wisselen we nog plekken om zolang de chemie stijgt. De bank en de
 * aanvoerder blijven.
 */
export function changeFormation(
  lineup: Lineup,
  to: FormationId,
  players: ReadonlyMap<string, SquadPlayer>,
): Lineup {
  if (lineup.formation === to) return lineup;
  const from = FORMATIONS[lineup.formation];
  const waiting = from.slots.flatMap((slot) => {
    const id = lineup.slots[slot.id];
    return id ? [{ id, slot }] : [];
  });
  const slots: Slots = Object.fromEntries(FORMATIONS[to].slots.map((s) => [s.id, null]));
  const fitOf = (id: string, slot: Slot): PositionFit => {
    const player = players.get(id);
    return player ? positionFit(player, slotLine(slot)) : "flexibel";
  };
  for (const fit of FITS) {
    for (const slot of keeperFirst(to)) {
      if (slots[slot.id]) continue;
      const options = waiting.filter((w) => fitOf(w.id, slot) === fit);
      if (options.length === 0) continue;
      options.sort(
        (a, b) =>
          closeness(b.slot, slot) - closeness(a.slot, slot) ||
          (players.get(b.id)?.rating ?? 0) - (players.get(a.id)?.rating ?? 0),
      );
      const choice = options[0]!;
      slots[slot.id] = choice.id;
      waiting.splice(waiting.indexOf(choice), 1);
    }
  }
  const arranged = improve(to, slots, [], players, lineup.captain);
  return { formation: to, slots: arranged, bench: [...lineup.bench], captain: lineup.captain };
}
