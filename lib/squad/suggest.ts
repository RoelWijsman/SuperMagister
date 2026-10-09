import { bestImprovement, candidatePool, CHEMISTRY_WEIGHT, squadScore } from "./build";
import { evaluateSquad, positionFit, type PositionFit, type SquadEvaluation } from "./chemistry";
import { FORMATIONS, slotLine } from "./formations";
import {
  cardAt,
  spotOf,
  toBench,
  tryPlace,
  type FieldConflict,
  type Lineup,
  type Spot,
} from "./lineup";
import type { SquadPlayer } from "./players";

/**
 * Hulp bij het kiezen: wat er gebeurt als je een kaart op een plek zet (en
 * welke kaart daar het best past), waar een kaart landt als je hem zonder plek
 * aantikt, en de beste zet die er nog is (voor de tip).
 */

/** Wat je bovenaan ziet veranderen: squad-rating en teamchemie, zoals ze getoond worden. */
export interface MoveEffect {
  rating: number;
  chemistry: number;
}

export function effectOf(before: SquadEvaluation, after: SquadEvaluation): MoveEffect {
  return { rating: after.rating - before.rating, chemistry: after.chemistry - before.chemistry };
}

export interface Suggestion {
  player: SquadPlayer;
  /** Spelerschemie op die plek na de zet (null op de bank: daar telt chemie niet). */
  chemistry: number | null;
  fit: PositionFit | null;
  /** Wat squad-rating en teamchemie doen. */
  effect: MoveEffect;
  /** Waar de kaart vandaan komt als hij al in je selectie zat. */
  from: Spot | null;
  /** Wie er op de plek stond en waar die heen gaat (null: terug naar je kaarten). */
  displaced: { cardId: string; to: Spot | null } | null;
  /** Gezet als het niet mag: het vak staat al ergens anders op het veld. */
  conflict: FieldConflict | null;
  /** Hoe goed het voor je elftal is (hoger is beter). */
  score: number;
}

/**
 * Kaarten voor één plek, de beste keus voor je elftal bovenaan (rating en
 * chemie samen, net als bij het bouwen), dan de chemie op die plek en de rating.
 * Op de bank telt alleen de rating.
 */
export function rankForSpot(
  lineup: Lineup,
  spot: Spot,
  candidates: readonly SquadPlayer[],
  players: ReadonlyMap<string, SquadPlayer>,
): Suggestion[] {
  const vakOf = (id: string) => players.get(id)?.vak;
  const before = evaluateSquad(lineup, players);
  const occupant = cardAt(lineup, spot);
  const results = candidates.map((player): Suggestion => {
    const { lineup: next, conflict } = tryPlace(lineup, spot, player.id, vakOf);
    const after = conflict ? before : evaluateSquad(next, players);
    const slot = spot.kind === "veld" ? after.slots.find((s) => s.slot.id === spot.slot) : null;
    const displaced =
      occupant && occupant !== player.id && !conflict
        ? { cardId: occupant, to: spotOf(next, occupant) }
        : null;
    return {
      player,
      chemistry: spot.kind === "veld" && !conflict ? (slot?.chemistry ?? 0) : null,
      fit:
        spot.kind === "veld" && slot
          ? conflict
            ? positionFit(player, slot.line)
            : (slot.fit ?? null)
          : null,
      effect: effectOf(before, after),
      from: spotOf(lineup, player.id),
      displaced,
      conflict,
      score: conflict
        ? -Infinity
        : spot.kind === "veld"
          ? squadScore(after)
          : player.rating + squadScore(after),
    };
  });
  return results.sort(
    (a, b) =>
      b.score - a.score ||
      (b.chemistry ?? 0) - (a.chemistry ?? 0) ||
      b.player.rating - a.player.rating ||
      a.player.id.localeCompare(b.player.id),
  );
}

export interface SuggestionGroup {
  vak: string;
  best: Suggestion;
  /** De andere kaarten van dit vak, in dezelfde volgorde. */
  rest: Suggestion[];
}

/** Per vak alleen de beste kaart vooraan; de rest klapt uit. Volgorde blijft die van de lijst. */
export function groupByVak(suggestions: readonly Suggestion[]): SuggestionGroup[] {
  const groups = new Map<string, SuggestionGroup>();
  for (const suggestion of suggestions) {
    const group = groups.get(suggestion.player.vak);
    if (group) group.rest.push(suggestion);
    else
      groups.set(suggestion.player.vak, { vak: suggestion.player.vak, best: suggestion, rest: [] });
  }
  return [...groups.values()];
}

const FIT_ORDER: readonly PositionFit[] = ["natuurlijk", "flexibel", "verkeerd", "onmogelijk"];

/**
 * Waar een kaart heen gaat als je hem aantikt zonder eerst een plek te kiezen:
 * de lege plek op het veld waar hij het best past, anders de eerste lege plek op
 * de bank, anders nergens (null). Staat zijn vak al op het veld, dan de bank.
 */
export function bestEmptySpot(
  lineup: Lineup,
  player: SquadPlayer,
  vakOf?: (cardId: string) => string | undefined,
): Spot | null {
  const vakOnField =
    vakOf !== undefined &&
    Object.values(lineup.slots).some((id) => id && id !== player.id && vakOf(id) === player.vak);
  if (!vakOnField) {
    const open = FORMATIONS[lineup.formation].slots.filter((s) => !lineup.slots[s.id]);
    for (const fit of FIT_ORDER.slice(0, 2)) {
      const slot = open.find((s) => positionFit(player, slotLine(s)) === fit);
      if (slot) return { kind: "veld", slot: slot.id };
    }
  }
  const index = lineup.bench.indexOf(null);
  if (index >= 0) return { kind: "bank", index };
  if (vakOnField) return null;
  const slot = FORMATIONS[lineup.formation].slots.find((s) => !lineup.slots[s.id]);
  return slot ? { kind: "veld", slot: slot.id } : null;
}

export type SquadMove =
  | { kind: "wissel"; a: string; b: string }
  | { kind: "zet"; cardId: string; slot: string; replaces: string | null };

export interface MoveAdvice {
  move: SquadMove;
  effect: MoveEffect;
  next: Lineup;
}

/**
 * De beste zet die er nog is: twee plekken omdraaien of een andere kaart op een
 * plek (ook van de bank), zonder een vak twee keer op het veld. Alleen als hij
 * echt kan en de score echt verbetert, en je dat bovenaan ook ziet (rating of
 * chemie omhoog). Anders null. Na "Bouw beste elftal" is er dus geen tip-zet.
 */
export function bestMove(
  lineup: Lineup,
  players: ReadonlyMap<string, SquadPlayer>,
): MoveAdvice | null {
  const before = evaluateSquad(lineup, players);
  const visible = (after: SquadEvaluation) => {
    const effect = effectOf(before, after);
    return (
      (effect.rating > 0 || effect.chemistry > 0) &&
      effect.rating + CHEMISTRY_WEIGHT * effect.chemistry > 0
    );
  };
  const step = bestImprovement(
    lineup.formation,
    lineup.slots,
    candidatePool(players.values()),
    players,
    lineup.captain,
    (candidate, current) => candidate.score > current.score + 1e-6 && visible(candidate.evaluation),
  );
  if (!step) return null;

  const changed = FORMATIONS[lineup.formation].slots
    .map((s) => s.id)
    .filter((id) => (lineup.slots[id] ?? null) !== (step.slots[id] ?? null));
  let move: SquadMove;
  if (changed.length === 2 && lineup.slots[changed[0]!] === step.slots[changed[1]!])
    move = { kind: "wissel", a: changed[0]!, b: changed[1]! };
  else {
    const slot = changed[0]!;
    move = {
      kind: "zet",
      cardId: step.slots[slot]!,
      slot,
      replaces: lineup.slots[slot] ?? null,
    };
  }
  const vakOf = (id: string) => players.get(id)?.vak;
  const next =
    move.kind === "zet"
      ? tryPlace(lineup, { kind: "veld", slot: move.slot }, move.cardId, vakOf).lineup
      : tryPlace(lineup, { kind: "veld", slot: move.b }, lineup.slots[move.a]!, vakOf).lineup;
  return { move, effect: effectOf(before, evaluateSquad(next, players)), next };
}

/**
 * "Naar bank": de kaart op deze plek gaat naar de bank. Past er een reserve van
 * de bank op deze plek, dan komt de beste erin (een wissel, zoals in FUT);
 * anders gaat de kaart naar een vrije plek op de bank en blijft de plek leeg.
 * Null als dat allebei niet kan (bank vol en geen reserve die mag).
 */
export function substitute(
  lineup: Lineup,
  spot: Spot,
  players: ReadonlyMap<string, SquadPlayer>,
): { lineup: Lineup; incoming: string | null } | null {
  if (spot.kind !== "veld" || !cardAt(lineup, spot)) return null;
  const reserves = lineup.bench.flatMap((id) => (id && players.has(id) ? [players.get(id)!] : []));
  const best = rankForSpot(lineup, spot, reserves, players).find((s) => !s.conflict);
  if (best) {
    const vakOf = (id: string) => players.get(id)?.vak;
    return {
      lineup: tryPlace(lineup, spot, best.player.id, vakOf).lineup,
      incoming: best.player.id,
    };
  }
  const moved = toBench(lineup, spot);
  return moved ? { lineup: moved, incoming: null } : null;
}
