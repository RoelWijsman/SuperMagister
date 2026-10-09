"use client";

import { useCallback, useMemo } from "react";
import type { CardData } from "@/lib/cards/model";
import { useCards } from "@/lib/data/cards";
import { useDataSource } from "@/lib/data/context";
import { analyseSquad } from "@/lib/squad/analysis";
import { buildBestSquad, type BuildResult } from "@/lib/squad/build";
import { evaluateSquad } from "@/lib/squad/chemistry";
import type { Club } from "@/lib/squad/club";
import type { FormationId } from "@/lib/squad/formations";
import {
  changeFormation,
  cleanLineup,
  clearLineup,
  placeCard,
  removeAt,
  setCaptain,
  squadCardIds,
  swapSpots,
  type Lineup,
  type Spot,
} from "@/lib/squad/lineup";
import { toSquadPlayer, type SquadPlayer } from "@/lib/squad/players";
import { useSettings } from "@/stores/settings";
import { activeSquad, defaultSourceSquads, useSquadStore } from "@/stores/squad";

/**
 * Jouw Elftal voor de databron van nu (demo, echt of een eerder jaar): de
 * spelers (alleen onthulde kaarten met een cijfer), het elftal dat open staat,
 * de chemie en de analyse, en alle bewerkingen.
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

  // Kaarten die er niet meer zijn (of nog in het pack zitten) bestaan voor deze pagina niet.
  const lineup = useMemo(
    () =>
      cards.isLoading ? squad.lineup : cleanLineup(squad.lineup, (id) => players.has(id), vakOf),
    [squad.lineup, players, vakOf, cards.isLoading],
  );
  const evaluation = useMemo(() => evaluateSquad(lineup, players), [lineup, players]);
  const analysis = useMemo(() => analyseSquad(evaluation), [evaluation]);
  const inSquad = useMemo(() => new Set(squadCardIds(lineup)), [lineup]);

  const update = useCallback(
    (change: (lineup: Lineup) => Lineup) =>
      store().updateLineup(source.id, (current) =>
        change(cleanLineup(current, (id) => players.has(id), vakOf)),
      ),
    [store, source.id, players, vakOf],
  );

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
    lineup,
    evaluation,
    analysis,
    inSquad,
    squads: entry.squads,
    activeId: squad.id,
    club: entry.club,
    place: (spot: Spot, cardId: string) => update((l) => placeCard(l, spot, cardId, vakOf)),
    swap: (a: Spot, b: Spot) => update((l) => swapSpots(l, a, b)),
    remove: (spot: Spot) => update((l) => removeAt(l, spot)),
    toggleCaptain: (cardId: string) => update((l) => setCaptain(l, cardId)),
    setFormation: (formation: FormationId) => update((l) => changeFormation(l, formation)),
    clear: () => update((l) => clearLineup(l)),
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
