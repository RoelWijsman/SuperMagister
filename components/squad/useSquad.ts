"use client";

import { useCallback, useMemo } from "react";
import type { CardData } from "@/lib/cards/model";
import { useCards } from "@/lib/data/cards";
import { useDataSource } from "@/lib/data/context";
import { analyseSquad } from "@/lib/squad/analysis";
import { buildBestSquad, changeFormation, type BuildResult } from "@/lib/squad/build";
import { evaluateSquad } from "@/lib/squad/chemistry";
import type { Club } from "@/lib/squad/club";
import type { FormationId } from "@/lib/squad/formations";
import {
  cleanLineup,
  clearLineup,
  removeAt,
  setCaptain,
  squadCardIds,
  tryPlace,
  trySwap,
  type FieldConflict,
  type Lineup,
  type Spot,
} from "@/lib/squad/lineup";
import { toSquadPlayer, type SquadPlayer } from "@/lib/squad/players";
import { bestMove, substitute } from "@/lib/squad/suggest";
import { useSettings } from "@/stores/settings";
import { activeSquad, defaultSourceSquads, useSquadStore } from "@/stores/squad";

/**
 * Jouw Elftal voor de databron van nu (demo, echt of een eerder jaar): de
 * spelers (alleen onthulde kaarten met een rating), het elftal dat open staat,
 * de chemie, de analyse met de beste zet, en alle bewerkingen. Een zet die niet
 * mag (een vak twee keer op het veld) geeft het conflict terug in plaats van
 * iets te veranderen.
 */
export function useSquad() {
  const cards = useCards();
  const source = useDataSource();
  const overrides = useSettings((s) => s.squadLines);
  const stored = useSquadStore((s) => s.bySource[source.id]);
  const store = useSquadStore.getState;

  const players = useMemo(() => {
    const map = new Map<string, SquadPlayer>();
    for (const card of cards.collection) {
      const player = toSquadPlayer(card, overrides);
      if (player) map.set(player.id, player);
    }
    return map;
  }, [cards.collection, overrides]);

  const entry = stored ?? defaultSourceSquads();
  const squad = activeSquad(entry);
  const vakOf = useCallback((id: string) => players.get(id)?.vak, [players]);
  const clean = useCallback(
    (lineup: Lineup) => cleanLineup(lineup, (id) => players.has(id), vakOf),
    [players, vakOf],
  );

  // Kaarten die er niet meer zijn (of nog in het pack zitten) bestaan voor deze pagina niet.
  const lineup = useMemo(
    () => (cards.isLoading ? squad.lineup : clean(squad.lineup)),
    [squad.lineup, clean, cards.isLoading],
  );
  const evaluation = useMemo(() => evaluateSquad(lineup, players), [lineup, players]);
  const inSquad = useMemo(() => new Set(squadCardIds(lineup)), [lineup]);
  // De beste zet die er nog is (alleen bij een vol veld: anders is de tip "vul de lege plekken").
  const move = useMemo(
    () =>
      evaluation.placed === evaluation.formation.slots.length ? bestMove(lineup, players) : null,
    [lineup, players, evaluation],
  );
  const analysis = useMemo(
    () => analyseSquad(evaluation, move, players.size > inSquad.size),
    [evaluation, move, players.size, inSquad.size],
  );

  const update = useCallback(
    (change: (lineup: Lineup) => Lineup) =>
      store().updateLineup(source.id, (current) => change(clean(current))),
    [store, source.id, clean],
  );

  /** Een zet die kan mislukken: eerst proberen, dan pas bewaren. */
  const attempt = (
    change: (lineup: Lineup) => { lineup: Lineup; conflict: FieldConflict | null },
  ) => {
    const result = change(lineup);
    if (!result.conflict) update((current) => change(current).lineup);
    return result.conflict;
  };

  const cardById = useCallback(
    (id: string | null): CardData | null => (id ? (cards.byId.get(id) ?? null) : null),
    [cards.byId],
  );

  return {
    isLoading: cards.isLoading,
    sourceId: source.id,
    cards: cards.collection,
    cardById,
    players,
    vakOf,
    lineup,
    evaluation,
    analysis,
    move,
    inSquad,
    squads: entry.squads,
    activeId: squad.id,
    club: entry.club,
    /** Geeft het conflict terug als het niet mag (dan verandert er niets). */
    place: (spot: Spot, cardId: string) => attempt((l) => tryPlace(l, spot, cardId, vakOf)),
    swap: (a: Spot, b: Spot) => attempt((l) => trySwap(l, a, b, vakOf)),
    remove: (spot: Spot) => update((l) => removeAt(l, spot)),
    /** Kan deze kaart naar de bank (met een reserve erin, of naar een vrije plek)? */
    canBench: (spot: Spot) => substitute(lineup, spot, players) !== null,
    /** Naar de bank; geeft de reserve terug die erin komt (of null), false als het niet kan. */
    toBench: (spot: Spot): string | null | false => {
      const result = substitute(lineup, spot, players);
      if (!result) return false;
      update((l) => substitute(l, spot, players)?.lineup ?? l);
      return result.incoming;
    },
    toggleCaptain: (cardId: string) => update((l) => setCaptain(l, cardId)),
    setFormation: (formation: FormationId) => update((l) => changeFormation(l, formation, players)),
    clear: () => update((l) => clearLineup(l)),
    apply: (next: Lineup) => update(() => next),
    build: (formation: FormationId = lineup.formation): BuildResult => {
      const result = buildBestSquad([...players.values()], formation);
      update(() => result.lineup);
      return result;
    },
    addSquad: (copy: boolean) => store().addSquad(source.id, copy),
    renameSquad: (id: string, name: string) => store().renameSquad(source.id, id, name),
    removeSquad: (id: string) => store().removeSquad(source.id, id),
    setActive: (id: string) => store().setActive(source.id, id),
    setClub: (club: Partial<Club>) => store().setClub(source.id, club),
  };
}

export type SquadApi = ReturnType<typeof useSquad>;
