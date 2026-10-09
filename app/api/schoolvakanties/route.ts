import { FALLBACK_HOLIDAYS, HOLIDAYS_SOURCE, normalizeHolidays } from "@/lib/school/holidays";
import { countHolidaysFailed, scheduleFlush } from "@/lib/stats/server";

/**
 * Fase 3a: schoolvakanties van Rijksoverheid, via de eigen server (de bron
 * stuurt geen CORS-header mee). Een dag gecachet; lukt het niet, dan de
 * ingebouwde reserve. Er gaat niets van de gebruiker naar de bron. Mislukt
 * het ophalen, dan telt dat als fout van de vakantie-API (anoniem, per dag).
 */

const SOURCE = HOLIDAYS_SOURCE;

export const revalidate = 86400;

export async function GET() {
  try {
    const response = await fetch(SOURCE, {
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const entries = normalizeHolidays(await response.json());
    if (entries.length === 0) throw new Error("Lege lijst");
    return Response.json({ bron: "rijksoverheid", vakanties: entries });
  } catch {
    // Niet tijdens het bouwen tellen: dan is er nog geen bezoeker geweest.
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      countHolidaysFailed();
      scheduleFlush();
    }
    return Response.json({ bron: "ingebouwd", vakanties: FALLBACK_HOLIDAYS });
  }
}
