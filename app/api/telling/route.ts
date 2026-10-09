import { handleTelling } from "@/lib/stats/endpoint";
import { scheduleFlush } from "@/lib/stats/server";

/**
 * Anonieme statistieken: één dagteller per event uit de whitelist. Alleen POST.
 * Zie lib/stats/endpoint.ts voor wat er wel en niet gebeurt.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = await handleTelling(request);
  scheduleFlush();
  return response;
}
