import { loadDays } from "@/lib/dev-dashboard/data";
import { requireAccess } from "@/lib/dev-dashboard/guard";
import { RETENTION_DAYS } from "@/lib/stats/day";
import { toCsv } from "@/lib/stats/summary";

/** Alle tellers als CSV (datum, teller, waarde). Standaard alles wat er nog is. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAccess("dashboard");
  const asked = Number(new URL(request.url).searchParams.get("dagen"));
  const count =
    Number.isInteger(asked) && asked > 0 ? Math.min(asked, RETENTION_DAYS) : RETENTION_DAYS;
  const data = await loadDays(count);
  if (data.status !== "ok")
    return new Response("Geen opslag bereikbaar.\n", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  const nonEmpty = data.days.filter((day) => Object.keys(day.fields).length > 0);
  return new Response(toCsv(nonEmpty), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="supermagister-tellers-${data.today}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
