"use client";

import { useMemo } from "react";
import type { CardData } from "@/lib/cards/model";
import { collectionGoals, unlockedFoils, type FoilId } from "@/lib/collection/goals";
import { cleanShowcase } from "@/lib/collection/showcase";
import { useCards } from "@/lib/data/cards";
import { useDataSource } from "@/lib/data/context";
import { useSubjectAppearance } from "@/lib/data/hooks";
import { matchSubjectInfo } from "@/lib/subjects/catalog";
import { useCollectionStore } from "@/stores/collection";

/** Je collectie: kaarten, verzameldoelen, verdiende folies en je vitrine. */
export function useCollection() {
  const cards = useCards();
  const source = useDataSource();
  const appearance = useSubjectAppearance();
  const storedShowcase = useCollectionStore((s) => s.showcase[source.id]);
  const foilSetting = useCollectionStore((s) => s.foil);

  return useMemo(() => {
    const groupOf = (subjectId: string) => {
      const look = appearance.get(subjectId);
      return matchSubjectInfo(look.code, look.name).group;
    };
    const goals = collectionGoals(cards.collection, groupOf);
    const foils = unlockedFoils(goals);
    const ids = cleanShowcase(
      storedShowcase ?? [],
      new Set(cards.collection.map((card) => card.id)),
    );
    const showcase = ids.flatMap((id) => {
      const card = cards.byId.get(id);
      return card ? [card] : [];
    });
    const foil: FoilId = foils.includes(foilSetting) ? foilSetting : "standaard";
    return {
      ...cards,
      sourceId: source.id,
      goals,
      foils,
      foil,
      showcase,
      isInShowcase: (card: CardData) => ids.includes(card.id),
    };
  }, [cards, source.id, appearance, storedShowcase, foilSetting]);
}
