import { squadScore } from "./build";
import { evaluateSquad } from "./chemistry";
import {
  applyMove,
  cardAt,
  planMove,
  spotOf,
  squadCardIds,
  vakSpot,
  type Change,
  type Lineup,
  type MoveKind,
  type Source,
  type Spot,
} from "./lineup";
import type { SquadPlayer } from "./players";
import { effectOf, type MoveEffect } from "./suggest";

/**
 * De kiezer bij een plek, in drie delen, met per vak hooguit één regel:
 * - wat er nu staat, met de andere versies van dat vak (de positie blijft gelijk);
 * - "Beschikbaar": vakken die nog niet in je selectie staan, met de beste versie
 *   voor deze plek vooraan en de andere versies om uit te klappen;
 * - "Al in je selectie": wie op het veld of de bank staat, met precies wat er
 *   gebeurt ("Wissel met …").
 * Elke keuze is een zet die mag; wat niet mag (een vak twee keer), staat er niet in.
 */

export interface PickOption {
  player: SquadPlayer;
  kind: MoveKind;
  source: Source;
  changes: Change[];
  /** Spelerschemie op deze plek na de zet (null op de bank). */
  chemistry: number | null;
  /** Wat squad-rating en teamchemie doen. */
  effect: MoveEffect;
  /** Waar hij nu staat (alleen bij "Al in je selectie"). */
  at: Spot | null;
  /** Hoe goed het voor je elftal is (hoger is beter). */
  score: number;
}

export interface AvailableGroup {
  vak: string;
  best: PickOption;
  /** De andere versies van dit vak, beste eerst. */
  others: PickOption[];
}

export interface PickerOptions {
  /** Wat er nu op de plek staat, met de andere versies van dat vak. */
  current: { player: SquadPlayer; versions: PickOption[] } | null;
  available: AvailableGroup[];
  selected: PickOption[];
}

const byScore = (a: PickOption, b: PickOption) =>
  b.score - a.score ||
  (b.chemistry ?? 0) - (a.chemistry ?? 0) ||
  b.player.rating - a.player.rating ||
  a.player.id.localeCompare(b.player.id);

export function pickerOptions(
  lineup: Lineup,
  target: Spot,
  players: ReadonlyMap<string, SquadPlayer>,
): PickerOptions {
  const vakOf = (id: string) => players.get(id)?.vak;
  const before = evaluateSquad(lineup, players);

  const option = (player: SquadPlayer, source: Source): PickOption | null => {
    const plan = planMove(lineup, source, target, vakOf);
    if (!plan.ok) return null;
    const result = applyMove(lineup, source, target, vakOf)!;
    const after = evaluateSquad(result.lineup, players);
    const slot =
      target.kind === "veld" ? after.slots.find((s) => s.slot.id === target.slot) : undefined;
    return {
      player,
      kind: plan.kind,
      source,
      changes: result.changes,
      chemistry: slot ? slot.chemistry : null,
      effect: effectOf(before, after),
      at: source.kind === "plek" ? source.spot : null,
      // Op de bank telt alleen de rating.
      score: target.kind === "veld" ? squadScore(after) : player.rating,
    };
  };

  const occupantId = cardAt(lineup, target);
  const occupant = occupantId ? (players.get(occupantId) ?? null) : null;
  const inSelection = new Set(
    squadCardIds(lineup).flatMap((id) => (players.has(id) ? [players.get(id)!.vak] : [])),
  );

  const current = occupant
    ? {
        player: occupant,
        versions: [...players.values()]
          .filter((p) => p.vak === occupant.vak && p.id !== occupant.id)
          .flatMap((p) => option(p, { kind: "kaart", cardId: p.id }) ?? [])
          .sort(byScore),
      }
    : null;

  const byVak = new Map<string, PickOption[]>();
  for (const player of players.values()) {
    if (inSelection.has(player.vak)) continue;
    const choice = option(player, { kind: "kaart", cardId: player.id });
    if (choice) byVak.set(player.vak, [...(byVak.get(player.vak) ?? []), choice]);
  }
  const available = [...byVak].map(([vak, options]) => {
    const sorted = options.sort(byScore);
    return { vak, best: sorted[0]!, others: sorted.slice(1) };
  });
  available.sort((a, b) => byScore(a.best, b.best));

  const selected = squadCardIds(lineup)
    .filter((id) => id !== occupantId && players.has(id))
    .flatMap((id) => option(players.get(id)!, { kind: "plek", spot: spotOf(lineup, id)! }) ?? [])
    .sort(byScore);

  return { current, available, selected };
}

/** Staat het vak van deze kaart al in je selectie, en waar? (Voor de lijst zonder plek.) */
export function whereIs(
  lineup: Lineup,
  player: SquadPlayer,
  players: ReadonlyMap<string, SquadPlayer>,
): { spot: Spot; cardId: string } | null {
  return vakSpot(lineup, player.vak, (id) => players.get(id)?.vak);
}
