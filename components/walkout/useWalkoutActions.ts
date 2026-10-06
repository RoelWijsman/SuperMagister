"use client";

import { useCallback } from "react";
import { unlockAudio } from "@/lib/audio/engine";
import { bestTier } from "@/lib/calc/tiers";
import type { CardData } from "@/lib/cards/model";
import { useCards } from "@/lib/data/cards";
import { useAccount, useGrades } from "@/lib/data/hooks";
import { notify } from "@/lib/notify";
import { practiceDeck } from "@/lib/walkout/practice";
import { useWalkout } from "@/stores/walkout";

/** Alles om een walkout te starten: je pack, de oefenmodus, of een kaart opnieuw. */
export function useWalkoutActions() {
  const cards = useCards();
  const grades = useGrades();
  const account = useAccount();
  const start = useWalkout((s) => s.start);

  const subjectGrades = useCallback(
    (card: CardData) => (grades.data ?? []).filter((g) => g.subjectId === card.subjectId),
    [grades.data],
  );

  const openPack = useCallback(() => {
    unlockAudio();
    if (cards.pack.length === 0) {
      notify("toast.geenPack", {}, { emoji: "📭" });
      return;
    }
    start({
      mode: "pack",
      entries: cards.pack.map((card) => ({ card, grades: subjectGrades(card) })),
    });
  }, [cards.pack, start, subjectGrades]);

  const startPractice = useCallback(
    (ids?: readonly string[]) => {
      unlockAudio();
      const deck = practiceDeck(account.data?.fullName ?? "Jij");
      const chosen = ids ? deck.filter((entry) => ids.includes(entry.id)) : deck;
      start({ mode: "oefen", entries: chosen.map(({ card, grades: g }) => ({ card, grades: g })) });
    },
    [account.data, start],
  );

  const replay = useCallback(
    (card: CardData) => {
      unlockAudio();
      start({ mode: "opnieuw", entries: [{ card, grades: subjectGrades(card) }] });
    },
    [start, subjectGrades],
  );

  const values = cards.pack.flatMap((card) =>
    card.grade.kind === "numeric" ? [card.grade.value] : [],
  );
  return {
    openPack,
    startPractice,
    replay,
    packCount: cards.pack.length,
    packTier: bestTier(values),
    isLoading: cards.isLoading,
  };
}
