import { requireAccess } from "@/lib/dev-dashboard/guard";
import { runLiveCheck } from "@/lib/dev-dashboard/live-check";

/** "Test nu" op het dashboard: kan de server alles bereiken? (POST, alleen met sessie.) */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireAccess("dashboard");
  const results = await runLiveCheck(new URL(request.url).origin);
  return Response.json(results, { headers: { "Cache-Control": "no-store" } });
}
