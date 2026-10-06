import { FALLBACK_HOLIDAYS, normalizeHolidays } from "@/lib/school/holidays";

/**
 * Fase 3a: schoolvakanties van Rijksoverheid, via de eigen server (de bron
 * stuurt geen CORS-header mee). Een dag gecachet; lukt het niet, dan de
 * ingebouwde reserve. Er gaat niets van de gebruiker naar de bron.
 */

const SOURCE = "https://opendata.rijksoverheid.nl/v1/infotypes/schoolholidays?output=json";

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
    return Response.json({ bron: "ingebouwd", vakanties: FALLBACK_HOLIDAYS });
  }
}
