/**
 * Hoe lang duurt dit huiswerk ongeveer? Een eerlijke gok op basis van de
 * tekst uit Magister: per opdracht, per paragraaf, of leren voor een toets.
 * Fase 3b gebruikt hem voor slimme tussenuren; fase 3c bouwt erop verder.
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
