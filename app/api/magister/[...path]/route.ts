import { proxyToMagister } from "@/lib/magister/proxy";
import { scheduleFlush } from "@/lib/stats/server";

/**
 * Proxy naar Magister: alleen GET, alleen naar {school}.magister.net, logt
 * nooit tokens en slaat niets op. Zie lib/magister/proxy.ts. Na het antwoord
 * gaan de anonieme tellers (aantal, status, snelheid) naar de opslag.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const response = await proxyToMagister(request, path);
  scheduleFlush();
  return response;
}
