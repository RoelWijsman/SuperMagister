import { evaluateSquad, positionFit, type PositionFit } from "./chemistry";
import { FORMATIONS, slotLine } from "./formations";
import { placeCard, type Lineup, type Spot } from "./lineup";
import type { SquadPlayer } from "./players";

/**
 * Hulp bij het kiezen: welke kaart past het best op een plek, en waar landt een
 * kaart als je hem zonder plek aantikt.
 */

export interface Suggestion {
  player: SquadPlayer;
  /** Spelerschemie op die plek (null op de bank: daar telt chemie niet). */
  chemistry: number | null;
  fit: PositionFit | null;
}

/** Kaarten voor één plek: beste chemie eerst, dan de hoogste rating. */
export function rankForSpot(
  lineup: Lineup,
  spot: Spot,
  candidates: readonly SquadPlayer[],
  players: ReadonlyMap<string, SquadPlayer>,
): Suggestion[] {
  const vakOf = (id: string) => players.get(id)?.vak;
  const results = candidates.map((player): Suggestion => {
    if (spot.kind === "bank") return { player, chemistry: null, fit: null };
    const placed = placeCard(lineup, spot, player.id, vakOf);
    const slot = evaluateSquad(placed, players).slots.find((s) => s.slot.id === spot.slot);
    return { player, chemistry: slot?.chemistry ?? 0, fit: slot?.fit ?? null };
  });
  return results.sort(
    (a, b) =>
      (b.chemistry ?? 0) - (a.chemistry ?? 0) ||
      b.player.rating - a.player.rating ||
      a.player.id.localeCompare(b.player.id),
  );
}

const FIT_ORDER: readonly PositionFit[] = ["natuurlijk", "flexibel", "verkeerd", "onmogelijk"];

/**
 * Waar een kaart heen gaat als je hem aantikt zonder eerst een plek te kiezen:
 * de lege plek op het veld waar hij het best past, anders de eerste lege plek op
 * de bank, anders nergens (null).
 */
export function bestEmptySpot(lineup: Lineup, player: SquadPlayer): Spot | null {
  const open = FORMATIONS[lineup.formation].slots.filter((s) => !lineup.slots[s.id]);
  for (const fit of FIT_ORDER.slice(0, 3)) {
    const slot = open.find((s) => positionFit(player, slotLine(s)) === fit);
    if (slot) return { kind: "veld", slot: slot.id };
  }
  const index = lineup.bench.indexOf(null);
  return index >= 0 ? { kind: "bank", index } : null;
}
