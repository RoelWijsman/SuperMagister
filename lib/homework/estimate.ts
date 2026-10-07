/**
 * Hoe lang duurt dit huiswerk ongeveer? Een eerlijke gok op basis van de
 * tekst uit Magister: per opdracht, per paragraaf, of leren voor een toets.
 * Fase 3b gebruikt hem voor slimme tussenuren, fase 3c voor de tijd per item
 * en de drukte per dag (met je eigen tijden erbovenop, zie homeworkMinutes).
 */

const PER_TASK = 4;
const PER_PARAGRAPH = 15;
const CHAPTER = 30;
const TEST = 45;
const FALLBACK = 20;
const MIN = 5;
const MAX = 90;

const RANGE = /(\d+)\s*(?:t\/m|tm|tot en met|-|–)\s*(\d+)/i;

/** Afronden op vijf minuten (naar boven), tussen MIN en MAX. */
const round = (minutes: number) => Math.min(MAX, Math.max(MIN, Math.ceil(minutes / 5) * 5));

export function estimateMinutes(homework: { text: string; isTest: boolean }): number {
  const text = homework.text;
  if (homework.isTest) return TEST;

  if (/\b(lees|lezen)\b/i.test(text)) {
    if (/hoofdstuk/i.test(text)) return CHAPTER;
    const paragraphs = text.match(/§\s*\d+(?:\.\d+)?/g) ?? [];
    return round(Math.max(1, paragraphs.length) * PER_PARAGRAPH);
  }

  if (/\b(opdracht|opdrachten|opgave|opgaven|som|sommen)\b/i.test(text)) {
    const range = RANGE.exec(text);
    if (range) {
      const count = Number(range[2]) - Number(range[1]) + 1;
      if (count > 0 && count <= 100) return round(count * PER_TASK);
    }
    const after = text.split(/\b(?:opdracht|opdrachten|opgave|opgaven|som|sommen)\b/i)[1] ?? "";
    const numbers = after.match(/\b\d+[a-z]?\b/gi) ?? [];
    if (numbers.length > 0) return round(numbers.length * PER_TASK);
  }

  return FALLBACK;
}

/** Grenzen voor een tijd die je zelf instelt. */
export const OWN_MIN = 5;
export const OWN_MAX = 240;

export interface MinutesPrefs {
  /** Je eigen tijd per huiswerkitem. */
  items: Readonly<Record<string, number>>;
  /** Je standaardtijd per vak (voor huiswerk, niet voor toetsen). */
  subjects: Readonly<Record<string, number>>;
}

export type MinutesSource = "eigen" | "vak" | "schatting";

const own = (minutes: number) => Math.min(OWN_MAX, Math.max(OWN_MIN, Math.round(minutes / 5) * 5));

/**
 * De tijd voor één item: je eigen tijd wint, dan je standaard voor het vak
 * (niet bij leren voor een toets), en anders de schatting uit de tekst.
 */
export function homeworkMinutes(
  homework: { id: string; subjectId: string | null; text: string; isTest: boolean },
  prefs: MinutesPrefs,
): { minutes: number; source: MinutesSource } {
  const mine = prefs.items[homework.id];
  if (mine !== undefined) return { minutes: own(mine), source: "eigen" };
  const subject = homework.subjectId ? prefs.subjects[homework.subjectId] : undefined;
  if (subject !== undefined && !homework.isTest) return { minutes: own(subject), source: "vak" };
  return { minutes: estimateMinutes(homework), source: "schatting" };
}
