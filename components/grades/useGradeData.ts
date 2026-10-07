"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { weightedAverage } from "@/lib/calc/average";
import { suggestedCombination } from "@/lib/calc/exam";
import { evaluatePromotion, promotionSubjects } from "@/lib/calc/promotion";
import { useDataSource } from "@/lib/data/context";
import {
  useAccount,
  useGrades,
  usePeriods,
  useRevealState,
  useSubjectAppearance,
} from "@/lib/data/hooks";
import type { Grade, Subject } from "@/lib/types";
import { activeNorms, useGradesStore } from "@/stores/grades";

export interface GradeData {
  sourceId: string;
  /** Alleen onthulde cijfers: wat in je pack zit, telt nergens mee. */
  visible: Grade[];
  /** Vakken met cijfers, in de vaste volgorde. */
  subjects: Subject[];
  bySubject: ReadonlyMap<string, Grade[]>;
  /** Aantal nog niet onthulde cijfers per vak. */
  locked: ReadonlyMap<string, number>;
  averages: ReadonlyMap<string, number | null>;
  isExamYear: boolean;
}

/**
 * Fase 4: alles wat de cijferschermen delen, één keer uitgerekend. Null zolang
 * de data (of je pack) nog laadt.
 */
export function useGradeData(): GradeData | null {
  const source = useDataSource();
  const grades = useGrades();
  const account = useAccount();
  const appearance = useSubjectAppearance();
  const { revealed } = useRevealState();

  return useMemo(() => {
    if (!grades.data || !appearance.isReady || !revealed) return null;
    const visible = grades.data.filter((grade) => revealed.has(grade.id));
    const subjects = appearance.subjects.filter((subject) => subject.hasGrades);
    const bySubject = new Map<string, Grade[]>();
    const locked = new Map<string, number>();
    for (const grade of grades.data) {
      if (revealed.has(grade.id))
        bySubject.set(grade.subjectId, [...(bySubject.get(grade.subjectId) ?? []), grade]);
      else locked.set(grade.subjectId, (locked.get(grade.subjectId) ?? 0) + 1);
    }
    const averages = new Map(
      subjects.map((subject) => [subject.id, weightedAverage(bySubject.get(subject.id) ?? [])]),
    );
    return {
      sourceId: source.id,
      visible,
      subjects,
      bySubject,
      locked,
      averages,
      isExamYear: Boolean(account.data?.isExamYear),
    };
  }, [grades.data, appearance.isReady, appearance.subjects, revealed, source.id, account.data]);
}

/** De periodes van het schooljaar. */
export function usePeriodList() {
  return usePeriods().data ?? [];
}

/** De overgangsnormen die nu gelden, en het combinatiecijfer van deze databron. */
export function usePromotionSettings(isExamYear: boolean) {
  const source = useDataSource();
  const presetId = useGradesStore((s) => s.presetId);
  const custom = useGradesStore((s) => s.custom);
  const combination = useGradesStore((s) => s.combination[source.id]);
  return useMemo(
    () => ({
      ...activeNorms({ presetId, custom }, isExamYear),
      /** null = nog niets gekozen: dan geldt het voorstel van de app. */
      combination: combination ?? null,
    }),
    [presetId, custom, combination, isExamYear],
  );
}

/** Breedte van een element, voor grafieken die meeschalen. */
export function useWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** De overgangsmeter voor je cijfers, eventueel met denkbeeldige cijfers erbij (simulator). */
export function usePromotionResult(data: GradeData | null, extra: readonly Grade[] = NO_GRADES) {
  const settings = usePromotionSettings(data?.isExamYear ?? false);
  const exam = settings.presetId === "examen";
  return useMemo(() => {
    if (!data) return null;
    const combination = settings.combination ?? suggestedCombination(data.subjects);
    const subjects = promotionSubjects(data.subjects, [...data.visible, ...extra], {
      exam,
      combination,
    });
    return { result: evaluatePromotion(subjects, settings.norms), exam, settings, combination };
  }, [data, extra, exam, settings]);
}

const NO_GRADES: Grade[] = [];
