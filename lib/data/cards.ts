"use client";

import { useMemo } from "react";
import { computeCards, orderPack } from "@/lib/calc/cards";
import { toCardData, type CardData } from "@/lib/cards/model";
import {
  useAccount,
  useCollectionGrades,
  usePeriods,
  useRevealState,
  useSubjectAppearance,
} from "./hooks";

export interface CardCollection {
  /** Alle kaarten, ook die nog in het pack zitten. */
  all: CardData[];
  /** Onthulde kaarten: de collectie. */
  collection: CardData[];
  /** Het pack: nog niet onthuld, beste kaart als laatste. */
  pack: CardData[];
  byId: Map<string, CardData>;
  isLoading: boolean;
}

const EMPTY: CardCollection = {
  all: [],
  collection: [],
  pack: [],
  byId: new Map(),
  isLoading: true,
};

/**
 * Van alle cijfers naar verzamelkaarten, met vakkleuren, iconen en je naam.
 * Bij een koppeling ook je kaarten uit eerdere schooljaren (met het jaar erop).
 */
export function useCards(): CardCollection {
  const grades = useCollectionGrades();
  const periods = usePeriods();
  const account = useAccount();
  const appearance = useSubjectAppearance();
  const { revealed, pack } = useRevealState();

  return useMemo(() => {
    if (!grades || !account.data || !appearance.isReady) return EMPTY;
    const cores = computeCards(grades.all);
    const periodNames = new Map((periods.data ?? []).map((p) => [p.id, p.name]));
    const all: CardData[] = [];
    for (const grade of grades.all) {
      const core = cores.get(grade.id);
      if (!core) continue;
      const pastYear = grades.yearOf.get(grade.id);
      all.push(
        toCardData(core, appearance.get(grade.subjectId), {
          studentName: account.data.fullName,
          periodName: pastYear
            ? pastYear.label
            : grade.periodId
              ? (periodNames.get(grade.periodId) ?? null)
              : null,
        }),
      );
    }
    const byId = new Map(all.map((card) => [card.id, card]));
    const packIds = new Set(pack.map((g) => g.id));
    return {
      all,
      collection: revealed ? all.filter((card) => revealed.has(card.id)) : [],
      pack: orderPack(all.filter((card) => packIds.has(card.id))),
      byId,
      isLoading: !revealed,
    };
  }, [grades, periods.data, account.data, appearance, revealed, pack]);
}
