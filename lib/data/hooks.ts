"use client";

import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { addDays, startOfWeek, toISODate } from "@/lib/date";
import { useIsClient } from "@/lib/hooks";
import { unrevealedGrades, withHistoryRevealed } from "@/lib/reveal";
import { homeworkFromLessons, testsFromLessons } from "@/lib/school/derive";
import { assignSubjectColors, SUBJECT_PALETTE } from "@/lib/subjects/palette";
import { matchSubjectInfo } from "@/lib/subjects/catalog";
import type { SubjectIconName } from "@/lib/subjects/icons";
import type { DateRange, Grade, PastYear, Subject } from "@/lib/types";
import { useReveal } from "@/stores/reveal";
import { useSettings } from "@/stores/settings";
import { useDataSource } from "./context";

/** Elke 15 minuten verversen zolang de app open is. */
const REFRESH_MS = 15 * 60_000;

/**
 * Schooldata komt alleen in de browser binnen, dus de server tekent altijd
 * "nog geen data". Tijdens de hydratie doen we daarom ook alsof er nog niets
 * is, ook als een ander component de data al heeft opgehaald (bijvoorbeeld
 * terwijl een Suspense-deel nog moest hydrateren). Zo tekenen server en
 * browser de eerste keer precies hetzelfde.
 */
function useHydrated<TData>(query: UseQueryResult<TData>): UseQueryResult<TData> {
  const isClient = useIsClient();
  if (isClient) return query;
  return {
    ...query,
    data: undefined,
    status: "pending",
    isPending: true,
    isSuccess: false,
  } as unknown as UseQueryResult<TData>;
}

export function useAccount() {
  const source = useDataSource();
  return useHydrated(
    useQuery({
      queryKey: [source.id, "account"],
      queryFn: () => source.getAccount(),
      staleTime: Infinity,
    }),
  );
}

export function useSubjects() {
  const source = useDataSource();
  return useHydrated(
    useQuery({
      queryKey: [source.id, "subjects"],
      queryFn: () => source.getSubjects(),
      staleTime: 60 * 60_000,
    }),
  );
}

export function usePeriods() {
  const source = useDataSource();
  return useHydrated(
    useQuery({
      queryKey: [source.id, "periods"],
      queryFn: () => source.getPeriods(),
      staleTime: 60 * 60_000,
    }),
  );
}

export function useGrades() {
  const source = useDataSource();
  return useHydrated(
    useQuery({
      queryKey: [source.id, "grades"],
      queryFn: () => source.getGrades(),
      refetchInterval: REFRESH_MS,
    }),
  );
}

/** Eerdere schooljaren (alleen bij een echte koppeling; de demo heeft er geen). */
export function useHistory() {
  const source = useDataSource();
  return useHydrated(
    useQuery({
      queryKey: [source.id, "history"],
      queryFn: () => source.getHistory(),
      staleTime: 6 * 60 * 60_000,
      retry: false,
    }),
  );
}

export interface CollectionGrades {
  /** Dit schooljaar en eerdere jaren samen: alles wat een kaart kan worden. */
  all: Grade[];
  past: PastYear[];
  /** Bij welk eerder schooljaar een cijfer hoort (cijfers van nu staan er niet in). */
  yearOf: ReadonlyMap<string, PastYear>;
  historyIds: string[];
}

/**
 * Alle cijfers voor de collectie en het pack. Null zolang het huidige jaar laadt,
 * of de eerdere jaren nog niet binnen (of mislukt) zijn: anders zou een laat
 * binnenkomend schooljaar ineens een pack van honderd kaarten worden.
 */
export function useCollectionGrades(): CollectionGrades | null {
  const grades = useGrades();
  const history = useHistory();
  const settled = history.isSuccess || history.isError;
  return useMemo(() => {
    if (!grades.data || !settled) return null;
    const past = history.data ?? [];
    const current = new Set(grades.data.map((g) => g.id));
    const yearOf = new Map<string, PastYear>();
    for (const year of past)
      for (const grade of year.grades) if (!current.has(grade.id)) yearOf.set(grade.id, year);
    const historyIds = [...yearOf.keys()];
    const all = [
      ...grades.data,
      ...past.flatMap((year) => year.grades.filter((g) => yearOf.get(g.id) === year)),
    ];
    return { all, past, yearOf, historyIds };
  }, [grades.data, history.data, settled]);
}

/** Onze gemiddelden naast die van Magister. Leeg bij de demo. */
export function useAverageChecks() {
  const source = useDataSource();
  return useHydrated(
    useQuery({
      queryKey: [source.id, "average-checks"],
      queryFn: () => source.getAverageChecks?.() ?? Promise.resolve([]),
      refetchInterval: REFRESH_MS,
    }),
  );
}

/** Wanneer de getoonde data voor het laatst bij Magister is opgehaald. Null bij de demo. */
export function useLastUpdated() {
  const source = useDataSource();
  return useHydrated(
    useQuery({
      queryKey: [source.id, "last-updated"],
      queryFn: async () => (await source.lastUpdated?.()) ?? null,
    }),
  );
}

/** Alle schooljaren (alleen bij een echte koppeling). */
export function useEnrollments() {
  const source = useDataSource();
  return useHydrated(
    useQuery({
      queryKey: [source.id, "enrollments"],
      queryFn: async () => (await source.getEnrollments?.()) ?? [],
      staleTime: 60 * 60_000,
    }),
  );
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
  return useHydrated(useQuery(lessonsQuery(source, range)));
}

export function useHomework(range: DateRange) {
  const source = useDataSource();
  return useHydrated(useQuery({ ...lessonsQuery(source, range), select: homeworkFromLessons }));
}

export function useTests(range: DateRange) {
  const source = useDataSource();
  return useHydrated(useQuery({ ...lessonsQuery(source, range), select: testsFromLessons }));
}

export function useAbsences(range: DateRange) {
  const source = useDataSource();
  return useHydrated(
    useQuery({
      queryKey: [source.id, "absences", range.from, range.to],
      queryFn: () => source.getAbsences(range),
    }),
  );
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
 *
 * De eerste keer (bij de demo, of net gekoppeld) is alles al onthuld behalve
 * het startpack: bij een koppeling het welkomstpack met de laatste vijf
 * cijfers. Cijfers uit eerdere schooljaren worden daarna nooit meer een pack.
 */
export function useRevealState() {
  const source = useDataSource();
  const collection = useCollectionGrades();
  const packIds = useQuery({
    queryKey: [source.id, "initial-pack"],
    queryFn: () => source.getInitialPackIds(),
    staleTime: Infinity,
  });
  const stored = useReveal((s) => (s.sourceId === source.id ? s.revealed : null));
  const load = useReveal((s) => s.load);
  const allIds = useMemo(() => collection?.all.map((g) => g.id) ?? null, [collection]);

  useEffect(() => {
    if (!allIds || !packIds.data) return;
    void load(source.id, allIds, packIds.data);
  }, [allIds, packIds.data, load, source.id]);

  const revealed = useMemo(
    () => withHistoryRevealed(stored, collection?.historyIds ?? [], packIds.data ?? []),
    [stored, collection, packIds.data],
  );
  const pack = useMemo(
    () => unrevealedGrades(collection?.all ?? [], revealed),
    [collection, revealed],
  );
  const resetStore = useReveal((s) => s.reset);
  /** Plakt het startpack weer dicht. Geeft false als de data er nog niet is. */
  const resetPack = useCallback(() => {
    if (!allIds || !packIds.data) return false;
    resetStore(source.id, allIds, packIds.data);
    return true;
  }, [allIds, packIds.data, resetStore, source.id]);
  return { revealed, pack, isLoading: !revealed, resetPack };
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

/**
 * Kleur en icoon per vak, inclusief eigen keuzes uit de instellingen. Vakken
 * die je alleen in een eerder schooljaar had (voor oude kaarten) krijgen ook
 * een kleur, zonder dat de kleuren van je huidige vakken verschuiven.
 */
export function useSubjectAppearance() {
  const { data: subjects } = useSubjects();
  const { data: history } = useHistory();
  const colorOverrides = useSettings((s) => s.subjectColors);
  const iconOverrides = useSettings((s) => s.subjectIcons);

  return useMemo(() => {
    const list: Subject[] = subjects ?? [];
    const known = new Set(list.map((s) => s.id));
    const pastOnly: Subject[] = [];
    for (const year of history ?? [])
      for (const subject of year.subjects)
        if (!known.has(subject.id)) {
          known.add(subject.id);
          pastOnly.push(subject);
        }
    const assigned = {
      ...assignSubjectColors([...list, ...pastOnly].map((s) => s.code)),
      ...assignSubjectColors(list.map((s) => s.code)),
    };
    const map = new Map<string, SubjectAppearance>();
    for (const subject of [...list, ...pastOnly]) {
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
  }, [subjects, history, colorOverrides, iconOverrides]);
}
