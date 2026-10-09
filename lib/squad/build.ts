import { evaluateSquad, positionFit, type SquadEvaluation } from "./chemistry";
import { BENCH_SIZE, FORMATION_IDS, FORMATIONS, slotLine, type FormationId } from "./formations";
import { emptyLineup, type Lineup } from "./lineup";
import type { SquadPlayer } from "./players";

/**
 * "Bouw beste elftal": zoekt de opstelling met de hoogste combinatie van rating
 * en chemie. De score is de gemiddelde rating (een lege plek telt als 0) plus een
 * kwart van de teamchemie. Eén ratingpunt is dus evenveel waard als vier punten
 * chemie: een 9 op een verkeerde plek mag, maar niet als hij het hele team
 * rood kleurt.
 *
 * Werkwijze: per vak de beste kaart, een eerste opstelling op natuurlijke
 * linie en rating, en dan net zo lang wisselen (twee plekken omdraaien, of
 * iemand van de bank erin) tot het niet meer beter wordt. Daarna de aanvoerder
 * en de bank. Altijd dezelfde uitkomst bij dezelfde kaarten.
 */

export const CHEMISTRY_WEIGHT = 0.25;

export function squadScore(evaluation: SquadEvaluation): number {
  return (
    evaluation.ratingSum / evaluation.formation.slots.length +
    CHEMISTRY_WEIGHT * evaluation.chemistry
  );
}

/** Per vak de beste kaart (hoogste rating; bij gelijkspel een ICON, dan het id). */
export function bestPerVak(players: readonly SquadPlayer[]): SquadPlayer[] {
  const best = new Map<string, SquadPlayer>();
  for (const player of players) {
    const current = best.get(player.vak);
    if (
      !current ||
      player.rating > current.rating ||
      (player.rating === current.rating && player.isIcon && !current.isIcon) ||
      (player.rating === current.rating &&
        player.isIcon === current.isIcon &&
        player.id < current.id)
    )
      best.set(player.vak, player);
  }
  return [...best.values()].sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
}

function evaluate(
  formation: FormationId,
  slots: Record<string, string | null>,
  players: ReadonlyMap<string, SquadPlayer>,
): SquadEvaluation {
  return evaluateSquad({ formation, slots, captain: null }, players);
}

/** Eerste opstelling: keeper eerst, dan elke plek de beste speler die er van nature hoort. */
function greedy(
  formation: FormationId,
  pool: readonly SquadPlayer[],
): Record<string, string | null> {
  const slots: Record<string, string | null> = {};
  const used = new Set<string>();
  const order = [...FORMATIONS[formation].slots].sort(
    (a, b) => Number(slotLine(b) === "keeper") - Number(slotLine(a) === "keeper"),
  );
  for (const fit of ["natuurlijk", "flexibel", "verkeerd"] as const) {
    for (const slot of order) {
      if (slots[slot.id]) continue;
      const player = pool.find((p) => !used.has(p.id) && positionFit(p, slotLine(slot)) === fit);
      if (player) {
        slots[slot.id] = player.id;
        used.add(player.id);
      }
    }
  }
  // Wat nog leeg is (bijv. op doel zonder LO-kaart): de hoogste rating die over is.
  for (const slot of order) {
    if (slots[slot.id]) continue;
    const player = pool.find((p) => !used.has(p.id));
    slots[slot.id] = player?.id ?? null;
    if (player) used.add(player.id);
  }
  return slots;
}

/** Net zo lang de beste wissel doen tot er geen betere meer is. */
function improve(
  formation: FormationId,
  start: Record<string, string | null>,
  pool: readonly SquadPlayer[],
  players: ReadonlyMap<string, SquadPlayer>,
): Record<string, string | null> {
  const ids = FORMATIONS[formation].slots.map((s) => s.id);
  let slots = { ...start };
  let best = squadScore(evaluate(formation, slots, players));
  for (let pass = 0; pass < 60; pass++) {
    let bestMove: Record<string, string | null> | null = null;
    const used = new Set(Object.values(slots).filter(Boolean));
    const consider = (candidate: Record<string, string | null>) => {
      const score = squadScore(evaluate(formation, candidate, players));
      if (score > best + 1e-9) {
        best = score;
        bestMove = candidate;
      }
    };
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]!;
        const b = ids[j]!;
        if (slots[a] === slots[b]) continue;
        consider({ ...slots, [a]: slots[b] ?? null, [b]: slots[a] ?? null });
      }
      for (const player of pool) {
        if (used.has(player.id)) continue;
        consider({ ...slots, [ids[i]!]: player.id });
      }
    }
    if (!bestMove) break;
    slots = bestMove;
  }
  return slots;
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
  players: ReadonlyMap<string, SquadPlayer>,
): Lineup {
  const slots = improve(formation, greedy(formation, pool), pool, players);
  const onField = new Set(Object.values(slots).filter(Boolean));
  // Aanvoerder: de hoogste rating die nog chemie kan winnen (anders gewoon de hoogste).
  const evaluation = evaluate(formation, slots, players);
  const candidates = evaluation.slots
    .filter((s) => s.player && s.fit !== "onmogelijk")
    .sort(
      (a, b) =>
        Number(a.chemistry >= 10) - Number(b.chemistry >= 10) ||
        b.player!.rating - a.player!.rating,
    );
  const bench = pool
    .filter((p) => !onField.has(p.id))
    .slice(0, BENCH_SIZE)
    .map((p) => p.id);
  return {
    formation,
    slots,
    bench: Array.from({ length: BENCH_SIZE }, (_, i) => bench[i] ?? null),
    captain: candidates[0]?.player?.id ?? null,
  };
}

/** Bouwt het beste elftal in deze formatie, en kijkt of een andere formatie beter zou zijn. */
export function buildBestSquad(
  allPlayers: readonly SquadPlayer[],
  formation: FormationId,
): BuildResult {
  const pool = bestPerVak(allPlayers);
  const players = new Map(pool.map((p) => [p.id, p]));
  if (pool.length === 0) {
    const lineup = emptyLineup(formation);
    const evaluation = evaluateSquad(lineup, players);
    return { lineup, evaluation, ratingOnly: { rating: 0, chemistry: 0 }, betterFormation: null };
  }

  const lineup = buildFor(formation, pool, players);
  const evaluation = evaluateSquad(lineup, players);

  // Ter vergelijking: de elf hoogste ratings, alleen op natuurlijke linie verdeeld.
  const topEleven = pool.slice(0, FORMATIONS[formation].slots.length);
  const plain = evaluate(formation, greedy(formation, topEleven), players);

  let betterFormation: BuildResult["betterFormation"] = null;
  // Pas een andere formatie noemen als het echt uitmaakt (minstens 2 scorepunten).
  let bar = squadScore(evaluation) + 2;
  for (const other of FORMATION_IDS) {
    if (other === formation) continue;
    const otherEval = evaluateSquad(buildFor(other, pool, players), players);
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
