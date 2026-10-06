import { toISODate } from "@/lib/date";
import { buildDemoDataset, type DemoDataset } from "@/lib/demo";
import type { DateRange } from "@/lib/types";
import type { SchoolDataSource } from "./source";

/** Korte nep-laadtijd bij de eerste keer, zodat skeletons en laadteksten te zien zijn. */
const WARMUP_MS = 450;

const inRange = (date: string, range: DateRange) => date >= range.from && date <= range.to;

export function createDemoSource(now: () => Date = () => new Date()): SchoolDataSource {
  let cache: { day: string; data: DemoDataset } | null = null;
  let warmup: Promise<void> | null = null;

  const dataset = async () => {
    warmup ??= new Promise((resolve) => setTimeout(resolve, WARMUP_MS));
    await warmup;
    const current = now();
    const day = toISODate(current);
    if (cache?.day !== day) cache = { day, data: buildDemoDataset(current) };
    return cache.data;
  };

  return {
    id: "demo",
    kind: "demo",
    label: "DEMO",
    getAccount: async () => (await dataset()).account,
    getSubjects: async () => (await dataset()).subjects,
    getPeriods: async () => (await dataset()).periods,
    getGrades: async () => (await dataset()).grades,
    getLessons: async (range) => (await dataset()).lessons.filter((l) => inRange(l.date, range)),
    getAbsences: async (range) => (await dataset()).absences.filter((a) => inRange(a.date, range)),
    getInitialPackIds: async () => (await dataset()).packGradeIds,
    getInitialGuesses: async () => (await dataset()).guesses,
  };
}
