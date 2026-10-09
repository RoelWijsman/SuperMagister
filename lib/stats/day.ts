/**
 * Datums voor de tellers: altijd in Nederlandse tijd (Europe/Amsterdam), zodat
 * "vandaag" om middernacht begint en niet om 01:00 of 02:00 (UTC).
 */

const PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

/** Datum (JJJJ-MM-DD) en uur (00–23) in Nederlandse tijd. */
export function amsterdamParts(at: Date): { date: string; hour: string } {
  const parts = Object.fromEntries(PARTS.formatToParts(at).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: parts.hour ?? "00" };
}

export function dayKey(at: Date): string {
  return amsterdamParts(at).date;
}

/** Een kalenderdag verschuiven (rekent in UTC op de datum zelf, dus zonder zomertijdgedoe). */
export function shiftDay(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** De laatste `count` dagen tot en met `last`, oudste eerst. */
export function daysUntil(last: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftDay(last, i - count + 1));
}

/** Tellers blijven 13 maanden bewaard (ruim gerekend: 400 dagen na de dag zelf). */
export const RETENTION_DAYS = 400;

/** Unix-tijd (seconden) waarop de teller van een dag vanzelf verdwijnt. */
export function expiresAt(date: string): number {
  return Math.floor(new Date(`${shiftDay(date, RETENTION_DAYS)}T00:00:00Z`).getTime() / 1000);
}
