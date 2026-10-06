import { diffInCalendarDays, parseISODate } from "@/lib/date";
import type { ISODate } from "@/lib/types";

/**
 * Fase 3a: schoolvakanties. Van de open data van Rijksoverheid
 * (https://opendata.rijksoverheid.nl/v1/infotypes/schoolholidays?output=json,
 * gecontroleerd op 6 oktober 2026). Die stuurt geen CORS-header mee, dus de
 * app haalt hem op via de eigen route /api/schoolvakanties, met hieronder
 * een ingebouwde reserve als de bron niet bereikbaar is.
 */

export type HolidayRegion = "noord" | "midden" | "zuid";

export const HOLIDAY_REGIONS: readonly HolidayRegion[] = ["noord", "midden", "zuid"];

export interface HolidayEntry {
  name: string;
  /** Eerste en laatste vrije dag, per regio. */
  noord: [ISODate, ISODate];
  midden: [ISODate, ISODate];
  zuid: [ISODate, ISODate];
}

export interface SchoolHoliday {
  name: string;
  start: ISODate;
  end: ISODate;
}

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");
/**
 * De bron schrijft lokale data als tijdstempel: begin 00:00Z, einde 21:59Z of
 * 22:59Z (23:59 lokale tijd). Het datumdeel is dus steeds de goede dag.
 */
const day = (value: unknown) => clean(value).slice(0, 10);
const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Maakt van de open data een lijst vakanties met data per regio. */
export function normalizeHolidays(json: unknown): HolidayEntry[] {
  if (!Array.isArray(json)) return [];
  const entries: HolidayEntry[] = [];
  for (const item of json) {
    const contents = (item as { content?: unknown })?.content;
    if (!Array.isArray(contents)) continue;
    for (const content of contents) {
      const vacations = (content as { vacations?: unknown })?.vacations;
      if (!Array.isArray(vacations)) continue;
      for (const vacation of vacations) {
        const name = clean((vacation as { type?: unknown })?.type);
        const regions = (vacation as { regions?: unknown })?.regions;
        if (!name || !Array.isArray(regions)) continue;
        const dates: Partial<Record<HolidayRegion, [ISODate, ISODate]>> = {};
        for (const region of regions) {
          const r = region as { region?: unknown; startdate?: unknown; enddate?: unknown };
          const range: [ISODate, ISODate] = [day(r.startdate), day(r.enddate)];
          if (!isDay(range[0]) || !isDay(range[1])) continue;
          const which = clean(r.region).toLowerCase();
          if (which === "heel nederland") {
            for (const all of HOLIDAY_REGIONS) dates[all] = range;
          } else if ((HOLIDAY_REGIONS as readonly string[]).includes(which)) {
            dates[which as HolidayRegion] = range;
          }
        }
        if (dates.noord && dates.midden && dates.zuid) {
          entries.push({ name, noord: dates.noord, midden: dates.midden, zuid: dates.zuid });
        }
      }
    }
  }
  return entries.sort((a, b) => a.midden[0].localeCompare(b.midden[0]));
}

export function holidaysForRegion(
  entries: readonly HolidayEntry[],
  region: HolidayRegion,
): SchoolHoliday[] {
  return entries
    .map((entry) => ({ name: entry.name, start: entry[region][0], end: entry[region][1] }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

export type NextHoliday = SchoolHoliday & {
  /** "komt": nog niet begonnen; "bezig": je bent nu vrij. */
  state: "komt" | "bezig";
  /** Dagen tot het begin, of (bezig) tot en met de laatste vrije dag. */
  days: number;
};

/** De vakantie waar je nu in zit, of anders de eerstvolgende. */
export function nextHoliday(
  holidays: readonly SchoolHoliday[],
  today: ISODate,
): NextHoliday | null {
  const now = parseISODate(today);
  for (const holiday of holidays) {
    if (holiday.end < today) continue;
    if (holiday.start <= today) {
      return {
        ...holiday,
        state: "bezig",
        days: diffInCalendarDays(parseISODate(holiday.end), now),
      };
    }
    return {
      ...holiday,
      state: "komt",
      days: diffInCalendarDays(parseISODate(holiday.start), now),
    };
  }
  return null;
}

/** Reserve uit dezelfde bron (opgehaald op 6 oktober 2026), voor als die even niet bereikbaar is. */
export const FALLBACK_HOLIDAYS: readonly HolidayEntry[] = [
  {
    name: "Herfstvakantie",
    noord: ["2026-10-10", "2026-10-18"],
    midden: ["2026-10-17", "2026-10-25"],
    zuid: ["2026-10-17", "2026-10-25"],
  },
  {
    name: "Kerstvakantie",
    noord: ["2026-12-19", "2027-01-03"],
    midden: ["2026-12-19", "2027-01-03"],
    zuid: ["2026-12-19", "2027-01-03"],
  },
  {
    name: "Voorjaarsvakantie",
    noord: ["2027-02-20", "2027-02-28"],
    midden: ["2027-02-20", "2027-02-28"],
    zuid: ["2027-02-13", "2027-02-21"],
  },
  {
    name: "Meivakantie",
    noord: ["2027-04-24", "2027-05-02"],
    midden: ["2027-04-24", "2027-05-02"],
    zuid: ["2027-04-24", "2027-05-02"],
  },
  {
    name: "Zomervakantie",
    noord: ["2027-07-10", "2027-08-22"],
    midden: ["2027-07-17", "2027-08-29"],
    zuid: ["2027-07-24", "2027-09-05"],
  },
  {
    name: "Herfstvakantie",
    noord: ["2027-10-16", "2027-10-24"],
    midden: ["2027-10-16", "2027-10-24"],
    zuid: ["2027-10-23", "2027-10-31"],
  },
  {
    name: "Kerstvakantie",
    noord: ["2027-12-25", "2028-01-09"],
    midden: ["2027-12-25", "2028-01-09"],
    zuid: ["2027-12-25", "2028-01-09"],
  },
  {
    name: "Voorjaarsvakantie",
    noord: ["2028-02-19", "2028-02-27"],
    midden: ["2028-02-26", "2028-03-05"],
    zuid: ["2028-02-26", "2028-03-05"],
  },
  {
    name: "Meivakantie",
    noord: ["2028-04-29", "2028-05-07"],
    midden: ["2028-04-29", "2028-05-07"],
    zuid: ["2028-04-29", "2028-05-07"],
  },
  {
    name: "Zomervakantie",
    noord: ["2028-07-15", "2028-08-27"],
    midden: ["2028-07-08", "2028-08-20"],
    zuid: ["2028-07-22", "2028-09-03"],
  },
];
