import { clientIp, createRateLimiter, type RateLimiter } from "@/lib/security/rate-limit";
import { isStatEvent } from "./events";
import { eventField, FIELDS } from "./fields";
import { counters, type CounterBuffer } from "./store";

/**
 * Het event-endpoint (POST /api/telling). De browser stuurt alleen
 * `{"e": "<eventnaam>"}`; al het andere in het verzoek wordt genegeerd en
 * nergens bewaard. Alleen namen uit de whitelist (lib/stats/events.ts) tellen,
 * als dagteller. Het IP-adres wordt alleen gebruikt voor een rem in het
 * geheugen (een minuut, niet opgeslagen, niet gelogd), zodat niemand de tellers
 * kan volspammen. Do Not Track of Global Privacy Control: dan tellen we niets.
 */

/** Ruim voor een gewone sessie (een pack van vijf kaarten is ±15 events), krap voor spam. */
const LIMITER = createRateLimiter({ limit: 60, windowMs: 60_000 });

const MAX_BODY = 256;

const NO_STORE = { "Cache-Control": "no-store" } as const;
const empty = (status: number, headers: Record<string, string> = {}) =>
  new Response(null, { status, headers: { ...NO_STORE, ...headers } });

/** De browser vraagt om niet gevolgd te worden. */
export function optedOut(headers: Headers): boolean {
  return headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";
}

/** Komt het verzoek van een andere site? (Zonder Origin-header, zoals bij curl, kunnen we dat niet zien.) */
function crossSite(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== headers.get("host");
  } catch {
    return true;
  }
}

export async function handleTelling(
  request: Request,
  { buffer = counters, limiter = LIMITER }: { buffer?: CounterBuffer; limiter?: RateLimiter } = {},
): Promise<Response> {
  if (request.method !== "POST") return empty(405, { Allow: "POST" });
  if (crossSite(request.headers)) return empty(403);
  if (optedOut(request.headers)) return empty(204);

  const allowed = limiter.check(clientIp(request.headers));
  if (!allowed.ok) {
    buffer.add(FIELDS.rateLimited("telling"));
    return empty(429, { "Retry-After": String(allowed.retryAfter) });
  }

  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY) return empty(413);
  let event: unknown;
  try {
    event = (JSON.parse(text) as { e?: unknown } | null)?.e;
  } catch {
    return empty(400);
  }
  if (!isStatEvent(event)) return empty(400);

  buffer.add(eventField(event));
  return empty(204);
}
