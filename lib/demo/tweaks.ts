import { addDays, startOfDay, toISODate } from "@/lib/date";
import type { Lesson } from "@/lib/types";
import { SPARE_ROOMS } from "./school";

/**
 * Fase 3b, alleen in de demo: een roosterwijziging simuleren (Instellingen >
 * Ontwikkelaar), zodat je de wijzigingen-detector aan het werk ziet. De
 * wijzigingen staan lokaal en de demobron past ze toe bij het ophalen.
 */

export interface DemoTweak {
  lessonId: string;
  kind: "uitval" | "lokaal";
  location?: string;
}

const KEY = "sm-demo-rooster";

export function readTweaks(): DemoTweak[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? (value as DemoTweak[]) : [];
  } catch {
    return [];
  }
}

export function addTweak(tweak: DemoTweak) {
  try {
    const others = readTweaks().filter((t) => t.lessonId !== tweak.lessonId);
    localStorage.setItem(KEY, JSON.stringify([...others, tweak]));
  } catch {
    // Geen opslag: dan maar niet.
  }
}

export function clearTweaks() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // idem
  }
}

/** Past de gesimuleerde wijzigingen toe (nieuwe objecten; het origineel blijft heel). */
export function applyTweaks(lessons: readonly Lesson[], tweaks: readonly DemoTweak[]): Lesson[] {
  if (tweaks.length === 0) return [...lessons];
  const byId = new Map(tweaks.map((tweak) => [tweak.lessonId, tweak]));
  return lessons.map((lesson) => {
    const tweak = byId.get(lesson.id);
    if (!tweak) return lesson;
    if (tweak.kind === "uitval") return { ...lesson, status: "uitval" as const };
    return {
      ...lesson,
      status: "wijziging" as const,
      previousLocation: lesson.previousLocation ?? lesson.location,
      location: tweak.location ?? lesson.location,
    };
  });
}

/** Kies een gewone les in de komende week en verzin een wijziging. */
export function pickTweak(
  lessons: readonly Lesson[],
  now: Date,
  random: () => number = Math.random,
): DemoTweak | null {
  const from = toISODate(addDays(startOfDay(now), 1));
  const to = toISODate(addDays(startOfDay(now), 7));
  const candidates = lessons.filter(
    (lesson) => lesson.date >= from && lesson.date <= to && lesson.status === "normaal",
  );
  if (candidates.length === 0) return null;
  const lesson = candidates[Math.floor(random() * candidates.length)]!;
  if (random() < 0.5) return { lessonId: lesson.id, kind: "uitval" };
  const rooms = SPARE_ROOMS.filter((room) => room !== lesson.location);
  return {
    lessonId: lesson.id,
    kind: "lokaal",
    location: rooms[Math.floor(random() * rooms.length)] ?? "Aula",
  };
}
