"use client";

import { useMemo } from "react";
import { useDataSource } from "@/lib/data/context";
import { DAY_NAMES, diffInCalendarDays, nextWeekday, toISODate } from "@/lib/date";
import { notify } from "@/lib/notify";
import type { Homework } from "@/lib/types";
import { useCelebration } from "@/stores/celebration";
import { EMPTY_PREFS, useHomeworkStore, type SourcePrefs } from "@/stores/homework";
import { allDoneFor, resolveHomework, type HomeworkItem, type HomeworkStatus } from "./overview";

/** Wat je zelf met je huiswerk deed, voor de databron die nu actief is. */
export function useHomeworkPrefs(): SourcePrefs {
  const source = useDataSource();
  return useHomeworkStore((s) => s.bySource[source.id] ?? EMPTY_PREFS);
}

/** Huiswerk met jouw status en tijden erbovenop. */
export function useResolvedHomework(homework: readonly Homework[] | undefined) {
  const prefs = useHomeworkPrefs();
  return useMemo(
    () => (homework ? resolveHomework(homework, prefs) : undefined),
    [homework, prefs],
  );
}

/**
 * Afvinken, bezig, eigen tijden en mini-stapjes. Is alles voor de volgende
 * schooldag af, dan regent het confetti (één keer per dag).
 */
export function useHomeworkActions() {
  const source = useDataSource();
  return useMemo(() => {
    const store = () => useHomeworkStore.getState();

    const celebrateIfAllDone = (item: HomeworkItem, items: readonly HomeworkItem[]) => {
      const now = new Date();
      const next = nextWeekday(now);
      const nextIso = toISODate(next);
      if (item.dueDate !== nextIso) return;
      const updated = items.map((other) =>
        other.id === item.id ? { ...other, isDone: true, status: "klaar" as const } : other,
      );
      if (!allDoneFor(updated, nextIso)) return;
      if (!store().celebrate(`${source.id}:${nextIso}`)) return;
      useCelebration.getState().fire();
      const dag = diffInCalendarDays(next, now) === 1 ? "morgen" : (DAY_NAMES[next.getDay()] ?? "");
      notify("huiswerk.allesAf", { dag }, { emoji: "🎉", tone: "success" });
    };

    return {
      setStatus(item: HomeworkItem, status: HomeworkStatus, items: readonly HomeworkItem[] = []) {
        if (item.status === status) return;
        store().setStatus(source.id, item.id, status);
        if (status === "klaar") celebrateIfAllDone(item, items);
      },
      setMinutes: (id: string, minutes: number | null) =>
        store().setMinutes(source.id, id, minutes),
      setSubjectMinutes: (subjectId: string, minutes: number | null) =>
        store().setSubjectMinutes(source.id, subjectId, minutes),
      toggleStep: (id: string, index: number) => store().toggleStep(source.id, id, index),
    };
  }, [source.id]);
}
