"use client";

import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/stores/settings";
import { FALLBACK_HOLIDAYS, holidaysForRegion, type HolidayEntry } from "./holidays";

async function fetchHolidays(signal?: AbortSignal): Promise<HolidayEntry[]> {
  try {
    const response = await fetch("/api/schoolvakanties", { signal });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const json = (await response.json()) as { vakanties?: HolidayEntry[] };
    return Array.isArray(json.vakanties) && json.vakanties.length > 0
      ? json.vakanties
      : [...FALLBACK_HOLIDAYS];
  } catch (error) {
    if (signal?.aborted) throw error;
    return [...FALLBACK_HOLIDAYS];
  }
}

/** De schoolvakanties in jouw regio (Instellingen). */
export function useHolidays() {
  const region = useSettings((s) => s.holidayRegion);
  const query = useQuery({
    queryKey: ["schoolvakanties"],
    queryFn: ({ signal }) => fetchHolidays(signal),
    staleTime: 12 * 60 * 60_000,
  });
  return {
    region,
    holidays: query.data ? holidaysForRegion(query.data, region) : null,
  };
}
