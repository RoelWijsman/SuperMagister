import { addDays, toISODate } from "@/lib/date";
import { normalizeText } from "@/lib/search/fuzzy";
import { findSubjectInText } from "@/lib/subjects/catalog";
import type { ISODate } from "@/lib/types";

/**
 * Herkent een paar natuurlijke zinnen in de command palette, zoals
 * "wat moet ik halen voor wiskunde" of "rooster morgen".
 */
export type Intent =
  | { type: "what-to-get"; subjectId: string }
  | { type: "schedule-day"; date: ISODate }
  | { type: "homework-day"; date: ISODate };

interface NamedSubject {
  id: string;
  code: string;
  name: string;
}

const WEEKDAYS: Record<string, number> = {
  zondag: 0,
  zo: 0,
  maandag: 1,
  ma: 1,
  dinsdag: 2,
  di: 2,
  woensdag: 3,
  wo: 3,
  donderdag: 4,
  do: 4,
  vrijdag: 5,
  vr: 5,
  zaterdag: 6,
  za: 6,
};

/** "morgen", "vrijdag", … naar een datum. Een weekdag is altijd de eerstvolgende. */
export function parseDayWord(word: string, now: Date): ISODate | null {
  const w = normalizeText(word).trim();
  const relative: Record<string, number> = { vandaag: 0, morgen: 1, overmorgen: 2, gisteren: -1 };
  if (w in relative) return toISODate(addDays(now, relative[w] ?? 0));
  const weekday = WEEKDAYS[w];
  if (weekday === undefined) return null;
  const diff = (weekday - now.getDay() + 7) % 7;
  return toISODate(addDays(now, diff));
}

export function parseIntent(
  query: string,
  subjects: readonly NamedSubject[],
  now: Date,
): Intent | null {
  const q = normalizeText(query).trim().replace(/\s+/g, " ");
  if (!q) return null;

  if (/\b(halen|nodig)\b/.test(q)) {
    const subjectId = findSubjectInText(q, subjects);
    return subjectId ? { type: "what-to-get", subjectId } : null;
  }

  const day = q.match(/^(rooster|huiswerk)(?: voor)? (.+)$/);
  if (day) {
    const date = parseDayWord(day[2] ?? "", now);
    if (!date) return null;
    return day[1] === "rooster" ? { type: "schedule-day", date } : { type: "homework-day", date };
  }
  return null;
}
