import { toISODate } from "@/lib/date";
import type { ISODate, TextGradeValue } from "@/lib/types";

/**
 * Defensief lezen van Magister-responses. Magister gebruikt meestal
 * PascalCase, soms camelCase; velden kunnen ontbreken of null zijn; getallen
 * komen soms als tekst met een decimale komma. Deze hulpjes gaan daar allemaal
 * mee om, zodat de parsers zelf kort en leesbaar blijven.
 */

type Bag = Record<string, unknown>;

const isBag = (value: unknown): value is Bag =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function lookup(source: unknown, name: string): unknown {
  if (!isBag(source)) return undefined;
  if (name in source) return source[name];
  const lower = name.toLowerCase();
  const key = Object.keys(source).find((k) => k.toLowerCase() === lower);
  return key === undefined ? undefined : source[key];
}

/** Het eerste veld dat bestaat (niet undefined). Een naam mag een pad zijn: "Persoon.Id". */
export function field(source: unknown, ...names: string[]): unknown {
  for (const name of names) {
    let current: unknown = source;
    for (const part of name.split(".")) current = lookup(current, part);
    if (current !== undefined) return current;
  }
  return undefined;
}

/** Een getal, ook uit "7,8" of "7.8". Leeg of onleesbaar: null. */
export function num(source: unknown, ...names: string[]): number | null {
  const value = field(source, ...names);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Een heel getal (bijv. een id). */
export function int(source: unknown, ...names: string[]): number | null {
  const value = num(source, ...names);
  return value !== null && Number.isInteger(value) ? value : null;
}

/** Tekst zonder witruimte eromheen; leeg is null. Getallen worden tekst. */
export function str(source: unknown, ...names: string[]): string | null {
  const value = field(source, ...names);
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function bool(source: unknown, ...names: string[]): boolean | null {
  const value = field(source, ...names);
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "True") return true;
  if (value === "false" || value === "False") return false;
  return null;
}

/** Altijd een lijst: uit een veld, of de bron zelf als die al een lijst is. */
export function arr(source: unknown, ...names: string[]): unknown[] {
  if (Array.isArray(source)) return source;
  const value = field(source, ...names);
  return Array.isArray(value) ? value : [];
}

/** Een genest object, of null. */
export function obj(source: unknown, ...names: string[]): Record<string, unknown> | null {
  const value = field(source, ...names);
  return isBag(value) ? value : null;
}

const TEXT_GRADES: ReadonlySet<string> = new Set<TextGradeValue>([
  "V",
  "G",
  "O",
  "RV",
  "ZG",
  "ZS",
  "R",
  "M",
  "NB",
  "VR",
  "INH",
]);
const NUMERIC_GRADE = /^\d{1,2}(?:[.,]\d+)?$/;

/** "7,8" wordt 7,8; "V", "G", "O" en andere beoordelingen blijven tekst; onzin is null. */
export function parseGradeValue(
  raw: unknown,
): { kind: "numeric"; value: number } | { kind: "text"; value: TextGradeValue } | null {
  if (typeof raw === "number")
    return raw >= 1 && raw <= 10 ? { kind: "numeric", value: raw } : null;
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (NUMERIC_GRADE.test(text)) {
    const value = Number(text.replace(",", "."));
    return value >= 1 && value <= 10 ? { kind: "numeric", value } : null;
  }
  const upper = text.toUpperCase();
  return TEXT_GRADES.has(upper) ? { kind: "text", value: upper as TextGradeValue } : null;
}

/**
 * De lokale kalenderdag van een Magister-tijdstip ("2026-10-07T06:30:00.0000000Z").
 * Magister geeft tot zeven decimalen bij de seconden; die korten we in.
 */
export function toLocalDate(value: unknown): ISODate | null {
  if (typeof value !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value.replace(/(\.\d{3})\d+/, "$1"));
  return Number.isNaN(+date) ? null : toISODate(date);
}

/** Een tijdstip als nette ISO-string (UTC), of null. */
export function toIsoDateTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value.replace(/(\.\d{3})\d+/, "$1"));
  return Number.isNaN(+date) ? null : date.toISOString();
}

/**
 * De laatste dag van een periode. Magister geeft als einde de middernacht ná
 * de laatste dag ("2027-07-30T22:00:00Z" is 31 juli 00:00 in Nederland), dus
 * een seconde terug.
 */
export function toLocalEndDate(value: unknown): ISODate | null {
  if (typeof value !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value.replace(/(\.\d{3})\d+/, "$1"));
  if (Number.isNaN(+date)) return null;
  return toISODate(new Date(+date - 1000));
}
