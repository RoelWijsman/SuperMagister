"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { addDays, startOfWeek, toISODate } from "@/lib/date";
import { unrevealedGrades } from "@/lib/reveal";
import { homeworkFromLessons, testsFromLessons } from "@/lib/school/derive";
import { assignSubjectColors, SUBJECT_PALETTE } from "@/lib/subjects/palette";
import { matchSubjectInfo } from "@/lib/subjects/catalog";
import type { SubjectIconName } from "@/lib/subjects/icons";
import type { DateRange, Subject } from "@/lib/types";
import { useReveal } from "@/stores/reveal";
import { useSettings } from "@/stores/settings";
import { useDataSource } from "./context";

/** Elke 15 minuten verversen zolang de app open is. */
const REFRESH_MS = 15 * 60_000;

export function useAccount() {
  const source = useDataSource();
  return useQuery({
    queryKey: [source.id, "account"],
    queryFn: () => source.getAccount(),
    staleTime: Infinity,
  });
}

export function useSubjects() {
  const source = useDataSource();
  return useQuery({
    queryKey: [source.id, "subjects"],
    queryFn: () => source.getSubjects(),
    staleTime: 60 * 60_000,
  });
}

export function usePeriods() {
  const source = useDataSource();
  return useQuery({
    queryKey: [source.id, "periods"],
    queryFn: () => source.getPeriods(),
    staleTime: 60 * 60_000,
  });
}

export function useGrades() {
  const source = useDataSource();
  return useQuery({
    queryKey: [source.id, "grades"],
    queryFn: () => source.getGrades(),
    refetchInterval: REFRESH_MS,
  });
}

function lessonsQuery(source: ReturnType<typeof useDataSource>, range: DateRange) {
  return {
    queryKey: [source.id, "lessons", range.from, range.to],
    queryFn: () => source.getLessons(range),
    refetchInterval: REFRESH_MS,
    placeholderData: keepPreviousData,
  };
}

export function useLessons(range: DateRange) {
  const source = useDataSource();
  return useQuery(lessonsQuery(source, range));
}

export function useHomework(range: DateRange) {
  const source = useDataSource();
  return useQuery({ ...lessonsQuery(source, range), select: homeworkFromLessons });
}

export function useTests(range: DateRange) {
  const source = useDataSource();
  return useQuery({ ...lessonsQuery(source, range), select: testsFromLessons });
}

export function useAbsences(range: DateRange) {
  const source = useDataSource();
  return useQuery({
    queryKey: [source.id, "absences", range.from, range.to],
    queryFn: () => source.getAbsences(range),
  });
}

/** Maandag t/m zondag van de week waarin `date` valt. */
export function weekRange(date: Date): DateRange {
  const monday = startOfWeek(date);
  return { from: toISODate(monday), to: toISODate(addDays(monday, 6)) };
}

export function daysRange(from: Date, days: number): DateRange {
  return { from: toISODate(from), to: toISODate(addDays(from, days)) };
}

/**
 * Laadt welke cijfers al onthuld zijn en geeft de nieuwe (het pack) terug.
 * `revealed` is null zolang IndexedDB nog laadt.
 */
export function useRevealState() {
  const source = useDataSource();
  const grades = useGrades();
  const packIds = useQuery({
    queryKey: [source.id, "initial-pack"],
    queryFn: () => source.getInitialPackIds(),
    staleTime: Infinity,
  });
  const revealed = useReveal((s) => (s.sourceId === source.id ? s.revealed : null));
  const load = useReveal((s) => s.load);

  useEffect(() => {
    if (!grades.data || !packIds.data) return;
    void load(
      source.id,
      grades.data.map((g) => g.id),
      packIds.data,
    );
  }, [grades.data, packIds.data, load, source.id]);

  const pack = useMemo(
    () => unrevealedGrades(grades.data ?? [], revealed),
    [grades.data, revealed],
  );
  return { revealed, pack, isLoading: !revealed };
}

export interface SubjectAppearance {
  id: string;
  name: string;
  code: string;
  color: string;
  paletteIndex: number;
  icon: SubjectIconName;
}

const NEUTRAL: Omit<SubjectAppearance, "id"> = {
  name: "Overig",
  code: "",
  color: "#a3a6c8",
  paletteIndex: -1,
  icon: "BookText",
};

/** Kleur en icoon per vak, inclusief eigen keuzes uit de instellingen. */
export function useSubjectAppearance() {
  const { data: subjects } = useSubjects();
  const colorOverrides = useSettings((s) => s.subjectColors);
  const iconOverrides = useSettings((s) => s.subjectIcons);

  return useMemo(() => {
    const list: Subject[] = subjects ?? [];
    const assigned = assignSubjectColors(list.map((s) => s.code));
    const map = new Map<string, SubjectAppearance>();
    for (const subject of list) {
      const paletteIndex = colorOverrides[subject.id] ?? assigned[subject.code.toLowerCase()] ?? 0;
      map.set(subject.id, {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        paletteIndex,
        color: SUBJECT_PALETTE[paletteIndex]?.hex ?? NEUTRAL.color,
        icon: iconOverrides[subject.id] ?? matchSubjectInfo(subject.code, subject.name).icon,
      });
    }
    const get = (id: string | null | undefined): SubjectAppearance =>
      (id ? map.get(id) : undefined) ?? { id: id ?? "onbekend", ...NEUTRAL };
    return { subjects: list, get, isReady: Boolean(subjects) };
  }, [subjects, colorOverrides, iconOverrides]);
}
