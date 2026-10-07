import { SCHOOL_HOST } from "./transport";

/**
 * De proxy naar Magister (route /api/magister/[...path]). Bestaat omdat de
 * browser Magister niet rechtstreeks mag aanroepen (CORS).
 *
 * - Alleen GET.
 * - Alleen naar https://{school}.magister.net/api/..., met de school strikt
 *   gecontroleerd en paden van alleen letters, cijfers, - en _.
 * - Geeft alleen het token (Authorization) en Accept door: geen cookies,
 *   geen andere headers, en volgt geen doorverwijzingen.
 * - Logt nooit iets en slaat niets op.
 */

export const PROXY_TIMEOUT_MS = 15_000;
const SEGMENT = /^[A-Za-z0-9_-]+$/;
const BEARER = /^Bearer [A-Za-z0-9._~+/=-]+$/;
const DEFAULT_RETRY_AFTER = 60;

export type ProxyErrorCode =
  | "alleen-get"
  | "ongeldige-school"
  | "ongeldig-pad"
  | "geen-token"
  | "verlopen"
  | "geen-toegang"
  | "niet-gevonden"
  | "te-vaak"
  | "magister-plat"
  | "timeout"
  | "netwerk"
  | "onbekend";

const MESSAGES: Record<ProxyErrorCode, string> = {
  "alleen-get": "Deze proxy doet alleen GET.",
  "ongeldige-school": "Dat is geen Magister-school.",
  "ongeldig-pad": "Ongeldig pad.",
  "geen-token": "Er is geen geldig token meegestuurd.",
  verlopen: "Je sessie bij Magister is verlopen.",
  "geen-toegang": "Magister geeft geen toegang tot deze gegevens.",
  "niet-gevonden": "Magister kent deze gegevens niet.",
  "te-vaak": "Te veel verzoeken. Wacht even en probeer het dan opnieuw.",
  "magister-plat": "Magister doet het even niet.",
  timeout: "Magister antwoordt niet op tijd.",
  netwerk: "Geen verbinding met Magister.",
  onbekend: "Magister gaf een onverwacht antwoord.",
};

const NO_STORE = { "Cache-Control": "no-store" } as const;

function fail(
  status: number,
  fout: ProxyErrorCode,
  extra: { headers?: Record<string, string>; body?: Record<string, unknown> } = {},
): Response {
  return Response.json(
    { fout, melding: MESSAGES[fout], ...extra.body },
    { status, headers: { ...NO_STORE, ...extra.headers } },
  );
}

/** Seconden uit een Retry-After-header (alleen getallen; anders een minuut). */
function retryAfter(value: string | null): number {
  const seconds = Number(value);
  return Number.isInteger(seconds) && seconds > 0 && seconds <= 3600
    ? seconds
    : DEFAULT_RETRY_AFTER;
}

export async function proxyToMagister(
  request: Request,
  segments: readonly string[],
  doFetch: (input: string, init: RequestInit) => Promise<Response> = fetch,
): Promise<Response> {
  if (request.method !== "GET") return fail(405, "alleen-get", { headers: { Allow: "GET" } });

  const school = request.headers.get("x-magister-school") ?? "";
  if (!SCHOOL_HOST.test(school)) return fail(400, "ongeldige-school");
  if (segments.length === 0 || !segments.every((s) => SEGMENT.test(s)))
    return fail(400, "ongeldig-pad");
  const authorization = request.headers.get("authorization") ?? "";
  if (!BEARER.test(authorization)) return fail(401, "geen-token");

  const query = new URL(request.url).searchParams.toString();
  const target = `https://${school}/api/${segments.join("/")}${query ? `?${query}` : ""}`;

  let upstream: Response;
  try {
    upstream = await doFetch(target, {
      method: "GET",
      headers: { Authorization: authorization, Accept: "application/json" },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return timedOut ? fail(504, "timeout") : fail(502, "netwerk");
  }

  if (upstream.ok) {
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...NO_STORE,
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  }
  // Een doorverwijzing gaat (bijna) altijd naar het inlogscherm: de sessie is weg.
  if ((upstream.status >= 300 && upstream.status < 400) || upstream.type === "opaqueredirect")
    return fail(401, "verlopen");
  if (upstream.status === 401) return fail(401, "verlopen");
  if (upstream.status === 403) return fail(403, "geen-toegang");
  if (upstream.status === 404) return fail(404, "niet-gevonden");
  if (upstream.status === 429) {
    const seconds = retryAfter(upstream.headers.get("retry-after"));
    return fail(429, "te-vaak", {
      headers: { "Retry-After": String(seconds) },
      body: { opnieuwNa: seconds },
    });
  }
  if (upstream.status >= 500)
    return fail(502, "magister-plat", { body: { status: upstream.status } });
  return fail(502, "onbekend", { body: { status: upstream.status } });
}
