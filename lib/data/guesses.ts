"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import type { GuessEntry } from "@/lib/guess/types";
import { useGuessStore } from "@/stores/guesses";
import { useDataSource } from "./context";
import { useGrades, useRevealState, useSubjectAppearance } from "./hooks";

/** Laadt je gokken voor de huidige databron. `guesses` is null zolang IndexedDB laadt. */
export function useGuesses() {
  const source = useDataSource();
  const initial = useQuery({
    queryKey: [source.id, "initial-guesses"],
    queryFn: () => source.getInitialGuesses(),
    staleTime: Infinity,
  });
  const guesses = useGuessStore((s) => (s.sourceId === source.id ? s.guesses : null));
  const load = useGuessStore((s) => s.load);

  useEffect(() => {
    if (initial.data) void load(source.id, initial.data);
  }, [initial.data, load, source.id]);

  /** Demo: terug naar de gokken van vóór het eerste pack. */
  const resetGuesses = useCallback(() => {
    if (!initial.data) return false;
    useGuessStore.getState().reset(source.id, initial.data);
    return true;
  }, [initial.data, source.id]);

  return { guesses, isLoading: !guesses, resetGuesses };
}

/**
 * Gokken bij onthulde cijfers, op volgorde van gokken. Een gok op een cijfer
 * dat je nog niet hebt gezien, telt nergens mee: anders verraadt de
 * statistiek je pack.
 */
export function useGuessEntries() {
  const { guesses } = useGuesses();
  const grades = useGrades();
  const appearance = useSubjectAppearance();
  const { revealed } = useRevealState();

  return useMemo(() => {
    if (!guesses || !grades.data || !revealed) return { entries: null, xp: 0, isLoading: true };
    const entries: GuessEntry[] = grades.data
      .flatMap((grade) => {
        const record = guesses[grade.id];
        if (!record || grade.kind !== "numeric" || !revealed.has(grade.id)) return [];
        return [
          {
            gradeId: grade.id,
            subjectId: grade.subjectId,
            subjectName: appearance.get(grade.subjectId).name,
            guess: record.gok,
            actual: grade.value,
            at: record.at,
            date: grade.date,
          },
        ];
      })
      .sort((a, b) => a.at.localeCompare(b.at));
    const xp = entries.reduce((sum, entry) => sum + (guesses[entry.gradeId]?.xp ?? 0), 0);
    return { entries, xp, isLoading: false };
  }, [guesses, grades.data, revealed, appearance]);
}
