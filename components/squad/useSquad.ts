"use client";

import { useCallback, useMemo } from "react";
import type { CardData } from "@/lib/cards/model";
import { copyText } from "@/lib/copy";
import { useCards } from "@/lib/data/cards";
import { useDataSource } from "@/lib/data/context";
import { analyseSquad } from "@/lib/squad/analysis";
import { buildBestSquad, changeFormation, type BuildResult } from "@/lib/squad/build";
import { evaluateSquad } from "@/lib/squad/chemistry";
import type { Club } from "@/lib/squad/club";
import { FORMATIONS, type FormationId } from "@/lib/squad/formations";
import {
  applyMove,
  cleanLineup,
  clearLineup,
  describeChanges,
  planMove,
  removeFromSquad,
  returnToCollection,
  sendToBench,
  setCaptain,
  squadCardIds,
  type Change,
  type Lineup,
  type MovePlan,
  type Source,
  type Spot,
} from "@/lib/squad/lineup";
import { toSquadPlayer, type SquadPlayer } from "@/lib/squad/players";
import { bestMove, type MoveAdvice } from "@/lib/squad/suggest";
import { useSettings } from "@/stores/settings";
import { activeSquad, defaultSourceSquads, useSquadStore } from "@/stores/squad";
import { useSquadHistory } from "@/stores/squad-history";
import { toast } from "@/stores/toast";

/** Eén melding voor de laatste stap: een nieuwe stap vervangt de vorige. */
export const STEP_TOAST = "elftal-stap";

/**
 * Jouw Elftal voor de databron van nu (demo, echt of een eerder jaar): de
 * spelers (alleen onthulde kaarten met een rating), het elftal dat open staat,
 * de chemie, de analyse met de beste zet, en alle bewerkingen.
 *
 * Elke bewerking gaat via `commit`: de vorige stand komt in de geschiedenis
 * (twintig stappen, voor "Ongedaan maken" en Ctrl+Z) en onderaan verschijnt
 * wat er gebeurde. Een zet die niet mag, verandert niets en geeft de reden terug.
 */
export function useSquad() {
  const cards = useCards();
  const source = useDataSource();
  const overrides = useSettings((s) => s.squadLines);
  const stored = useSquadStore((s) => s.bySource[source.id]);
  const introSeen = useSquadStore((s) => s.introSeen);
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
  const vakkenInSquad = useMemo(
    () => new Set([...inSquad].flatMap((id) => (players.has(id) ? [players.get(id)!.vak] : []))),
    [inSquad, players],
  );
  const vakCount = useMemo(() => new Set([...players.values()].map((p) => p.vak)).size, [players]);
  // De beste zet die er nog is (alleen bij een vol veld: anders is de tip "vul de lege plekken").
  const advice = useMemo(
    () => (evaluation.complete ? bestMove(lineup, players) : null),
    [lineup, players, evaluation],
  );
  const analysis = useMemo(
    () => analyseSquad(evaluation, advice, vakkenInSquad.size < vakCount),
    [evaluation, advice, vakkenInSquad.size, vakCount],
  );

  const historyKey = `${source.id}:${squad.id}`;
  const canUndo = useSquadHistory((s) => (s.past[historyKey]?.length ?? 0) > 0);

  const cardById = useCallback(
    (id: string | null): CardData | null => (id ? (cards.byId.get(id) ?? null) : null),
    [cards.byId],
  );

  /** "Engels 79": vak en rating, zodat je ziet welke versie het is. */
  const nameOf = (cardId: string | null) => {
    const player = cardId ? players.get(cardId) : undefined;
    return player ? `${player.subjectName} ${player.rating}` : "Lege plek";
  };
  const positionOf = (spot: Spot) =>
    spot.kind === "bank"
      ? "de bank"
      : (FORMATIONS[lineup.formation].slots.find((s) => s.id === spot.slot)?.position ??
        "het veld");
  const describe = (changes: readonly Change[]) => describeChanges(changes, nameOf, positionOf);

  const undoKey = (key: string, sourceId: string, squadId: string) => {
    const previous = useSquadHistory.getState().undo(key);
    if (!previous) return false;
    store().updateLineup(sourceId, () => previous, squadId);
    toast({ id: STEP_TOAST, title: "Teruggezet.", emoji: "↩️", duration: 2600 });
    return true;
  };
  const undo = () => undoKey(historyKey, source.id, squad.id);

  /** Bewaart de nieuwe stand, onthoudt de oude en zegt wat er gebeurde (met "Ongedaan maken"). */
  const commit = (next: Lineup, message: string) => {
    const key = historyKey;
    const sourceId = source.id;
    const squadId = squad.id;
    useSquadHistory.getState().record(key, lineup);
    store().updateLineup(sourceId, () => next, squadId);
    toast({
      id: STEP_TOAST,
      title: message,
      duration: 6500,
      action: { label: "Ongedaan maken", onClick: () => void undoKey(key, sourceId, squadId) },
    });
  };

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
    inSquad,
    vakkenInSquad,
    vakCount,
    squads: entry.squads,
    activeId: squad.id,
    club: entry.club,
    introSeen,
    markIntroSeen: () => store().markIntroSeen(),
    nameOf,
    positionOf,
    describe,
    canUndo,
    undo,
    /** Wat er zou gebeuren (of waarom het niet kan), zonder iets te veranderen. */
    plan: (from: Source, target: Spot): MovePlan => planMove(lineup, from, target, vakOf),
    /** Doet de zet; geeft het plan terug, met `ok: false` als het niet mocht. */
    move: (from: Source, target: Spot): MovePlan => {
      const plan = planMove(lineup, from, target, vakOf);
      const result = plan.ok ? applyMove(lineup, from, target, vakOf) : null;
      if (result) commit(result.lineup, describe(result.changes));
      return plan;
    },
    /** Naar de bank; false als de bank vol is. */
    toBench: (spot: Spot) => {
      const result = sendToBench(lineup, spot);
      if (result) commit(result.lineup, describe(result.changes));
      return result !== null;
    },
    /** Haal weg: naar de bank als daar plek is, anders terug naar je collectie. */
    remove: (spot: Spot) => {
      const result = removeFromSquad(lineup, spot);
      if (result) commit(result.lineup, describe(result.changes));
    },
    /** Terug naar je collectie (een kaart terugslepen naar de lijst). */
    toCollection: (spot: Spot) => {
      const result = returnToCollection(lineup, spot);
      if (result) commit(result.lineup, describe(result.changes));
    },
    toggleCaptain: (cardId: string) => {
      const next = setCaptain(lineup, cardId);
      commit(
        next,
        next.captain
          ? `${nameOf(cardId)} is aanvoerder.`
          : `${nameOf(cardId)} is geen aanvoerder meer.`,
      );
    },
    setFormation: (formation: FormationId) =>
      commit(changeFormation(lineup, formation, players), `Formatie ${formation}.`),
    clear: () => commit(clearLineup(lineup), "Elftal leeggemaakt."),
    applyAdvice: (advice: MoveAdvice) => commit(advice.next, describe(advice.changes)),
    build: (formation: FormationId = lineup.formation): BuildResult => {
      const result = buildBestSquad([...players.values()], formation);
      commit(
        result.lineup,
        copyText("elftal.gebouwd", {
          cijfer: String(result.evaluation.rating),
          aantal: String(result.evaluation.chemistry),
        }),
      );
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
