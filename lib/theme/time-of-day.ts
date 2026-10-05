export type TimeOfDay = "ochtend" | "dag" | "avond" | "nacht";

export const TIMES_OF_DAY: readonly TimeOfDay[] = ["ochtend", "dag", "avond", "nacht"];

/**
 * Grenzen in minuten na middernacht. Ook gebruikt door het inline-script in
 * <head>, zodat de achtergrond al vóór de eerste paint klopt.
 */
export const TIME_OF_DAY_STARTS = {
  ochtend: 5 * 60,
  dag: 10 * 60,
  avond: 17 * 60 + 30,
  nacht: 22 * 60,
} as const;

export function getTimeOfDay(date: Date): TimeOfDay {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= TIME_OF_DAY_STARTS.nacht || minutes < TIME_OF_DAY_STARTS.ochtend) return "nacht";
  if (minutes < TIME_OF_DAY_STARTS.dag) return "ochtend";
  if (minutes < TIME_OF_DAY_STARTS.avond) return "dag";
  return "avond";
}
