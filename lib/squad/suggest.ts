import { bestImprovement, candidatePool, CHEMISTRY_WEIGHT } from "./build";
import { evaluateSquad, positionFit, type PositionFit, type SquadEvaluation } from "./chemistry";
import { FORMATIONS, slotLine } from "./formations";
import { applyMove, vakSpot, type Change, type Lineup, type Spot } from "./lineup";
import type { SquadPlayer } from "./players";

/**
 * Hulp bij het opstellen: waar een kaart landt als je hem aantikt zonder plek,
 * en de beste zet die er nog is (voor de tip).
 */

/** Wat je bovenaan ziet veranderen: squad-rating en teamchemie, zoals ze getoond worden. */
export interface MoveEffect {
  rating: number;
  chemistry: number;
}

export function effectOf(before: SquadEvaluation, after: SquadEvaluation): MoveEffect {
  return { rating: after.rating - before.rating, chemistry: after.chemistry - before.chemistry };
}

const FIT_ORDER: readonly PositionFit[] = ["natuurlijk", "flexibel"];

/**
 * Waar een speler die nog niet meedoet heen gaat als je hem aantikt zonder eerst
 * een plek te kiezen: de lege plek op het veld waar hij hoort, anders een vrije
 * plek op de bank, anders een lege plek waar hij niet hoort. Null als zijn vak
 * al meedoet of alles vol is.
 */
export function bestEmptySpot(
  lineup: Lineup,
  player: SquadPlayer,
  vakOf: (cardId: string) => string | undefined,
): Spot | null {
  if (vakSpot(lineup, player.vak, vakOf)) return null;
  const open = FORMATIONS[lineup.formation].slots.filter((s) => !lineup.slots[s.id]);
  for (const fit of FIT_ORDER) {
    const slot = open.find((s) => positionFit(player, slotLine(s)) === fit);
    if (slot) return { kind: "veld", slot: slot.id };
  }
  const index = lineup.bench.indexOf(null);
  if (index >= 0) return { kind: "bank", index };
  return open[0] ? { kind: "veld", slot: open[0].id } : null;
}

export type SquadMove =
  | { kind: "wissel"; a: string; b: string }
  | { kind: "zet"; cardId: string; slot: string; replaces: string | null };

export interface MoveAdvice {
  move: SquadMove;
  effect: MoveEffect;
  next: Lineup;
  changes: Change[];
}

/**
 * De beste zet die er nog is: twee plekken omdraaien, een speler van de bank
 * erin, een speler die nog niet meedoet erin, of een andere versie op dezelfde
 * plek. Alleen zetten die volgens de regels kunnen (elk vak één keer) en de
 * score echt verbeteren, en die je bovenaan ziet (rating of chemie omhoog).
 * Anders null. Na "Bouw beste elftal" is er dus geen tip-zet.
 */
export function bestMove(
  lineup: Lineup,
  players: ReadonlyMap<string, SquadPlayer>,
): MoveAdvice | null {
  const vakOf = (id: string) => players.get(id)?.vak;
  const before = evaluateSquad(lineup, players);
  const visible = (after: SquadEvaluation) => {
    const effect = effectOf(before, after);
    return (
      (effect.rating > 0 || effect.chemistry > 0) &&
      effect.rating + CHEMISTRY_WEIGHT * effect.chemistry > 0
    );
  };
  const benchCards = lineup.bench.flatMap((id) =>
    id && players.has(id) ? [players.get(id)!] : [],
  );
  const pool = [...new Set([...candidatePool(players.values()), ...benchCards])];
  // Een vak op de bank kan alleen met die kaart (de reserve zelf) het veld op.
  const allowed = (player: SquadPlayer) => {
    const at = vakSpot(lineup, player.vak, vakOf);
    return !at || at.spot.kind === "veld" || at.cardId === player.id;
  };
  const step = bestImprovement(
    lineup.formation,
    lineup.slots,
    pool,
    players,
    lineup.captain,
    (candidate, current) => candidate.score > current.score + 1e-6 && visible(candidate.evaluation),
    allowed,
  );
  if (!step) return null;

  const changed = FORMATIONS[lineup.formation].slots
    .map((s) => s.id)
    .filter((id) => (lineup.slots[id] ?? null) !== (step.slots[id] ?? null));
  const swap = changed.length === 2 && lineup.slots[changed[0]!] === step.slots[changed[1]!];
  const move: SquadMove = swap
    ? { kind: "wissel", a: changed[0]!, b: changed[1]! }
    : {
        kind: "zet",
        cardId: step.slots[changed[0]!]!,
        slot: changed[0]!,
        replaces: lineup.slots[changed[0]!] ?? null,
      };
  const result =
    move.kind === "zet"
      ? applyMove(
          lineup,
          { kind: "kaart", cardId: move.cardId },
          { kind: "veld", slot: move.slot },
          vakOf,
        )
      : applyMove(
          lineup,
          { kind: "plek", spot: { kind: "veld", slot: move.a } },
          { kind: "veld", slot: move.b },
          vakOf,
        );
  if (!result) return null;
  return {
    move,
    effect: effectOf(before, evaluateSquad(result.lineup, players)),
    next: result.lineup,
    changes: result.changes,
  };
}
