import type { ISODate } from "@/lib/types";

/**
 * Kleine datumhelpers in lokale tijd. Bewust zonder library: we hebben maar
 * een handvol functies nodig en Nederlandse namen willen we zelf in de hand
 * houden (ook tijdens server-rendering).
 */

export const DAY_NAMES = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
] as const;
export const DAY_NAMES_SHORT = ["zo", "ma", "di", "wo", "do", "vr", "za"] as const;
export const MONTH_NAMES = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
] as const;
export const MONTH_NAMES_SHORT = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Accepteert een Date of een `YYYY-MM-DD`-string. */
export function toDate(value: Date | ISODate): Date {
  return typeof value === "string" ? parseISODate(value) : value;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Telt dagen op met behoud van de kloktijd, ook over zomer-/wintertijd heen. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Maandag 00:00 van de week waarin `date` valt. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

const DAY_MS = 86_400_000;

/** Aantal kalenderdagen van `b` naar `a` (positief als `a` later is). */
export function diffInCalendarDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / DAY_MS);
}

export function isSameDay(a: Date, b: Date): boolean {
  return diffInCalendarDays(a, b) === 0;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** De eerstvolgende werkdag na `date` (slaat het weekend over). */
export function nextWeekday(date: Date): Date {
  let next = addDays(startOfDay(date), 1);
  while (isWeekend(next)) next = addDays(next, 1);
  return next;
}

/** Lokale datum-tijd uit een datum en `HH:MM`. */
export function atTime(date: Date | ISODate, time: string): Date {
  const base = toDate(date);
  const [h, m] = time.split(":").map(Number);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h ?? 0, m ?? 0);
}

export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function minutesBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 60_000);
}

/** ISO 8601-weeknummer (week begint op maandag, week 1 bevat de eerste donderdag). */
export function isoWeek(date: Date): { year: number; week: number } {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3); // donderdag van deze week
  const year = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
  return { year, week };
}

export function formatLongDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]}`;
}

/** "vandaag", "morgen", "vrijdag", of "do 15 okt" voor verder weg. */
export function formatRelativeDay(date: Date, now: Date): string {
  const diff = diffInCalendarDays(date, now);
  if (diff === 0) return "vandaag";
  if (diff === 1) return "morgen";
  if (diff === 2) return "overmorgen";
  if (diff === -1) return "gisteren";
  if (diff > 2 && diff < 7) return DAY_NAMES[date.getDay()] ?? "";
  return `${DAY_NAMES_SHORT[date.getDay()]} ${formatShortDate(date)}`;
}

/** "2u 14m", "45 min", "1u". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}u` : `${h}u ${m}m`;
}
