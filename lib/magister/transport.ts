/**
 * Hoe SuperMagister bij Magister komt. De rest van de app praat via de client
 * (lib/magister/client.ts), die alleen een transport kent. Welke transport
 * gebruikt wordt, kies je op één plek: lib/magister/config.ts.
 *
 * - "proxy": via de eigen route /api/magister/... (fase 5). Die stuurt alleen
 *   GET-verzoeken door naar https://{school}.magister.net/api/..., logt nooit
 *   tokens en slaat niets op.
 * - "extensie": later via een browserextensie. Nog niet gebouwd.
 *
 * Nooit wachtwoorden: alleen een token dat de bookmarklet (fase 5) via het
 * URL-fragment doorgeeft en dat in sessionStorage blijft.
 */

export type TransportKind = "proxy" | "extensie";

export interface MagisterSession {
  /** Bijv. `noorderlicht.magister.net`. */
  schoolHost: string;
  token: string;
  /** Verloopt op dit moment (ms sinds 1970), of null als onbekend. */
  expiresAt: number | null;
}

export type QueryValue = string | number | boolean;
export type Query = Readonly<Record<string, QueryValue>>;

export interface MagisterTransport {
  kind: TransportKind;
  /** GET op een pad onder /api van Magister, bijv. "personen/42/afspraken". */
  get<T = unknown>(path: string, query?: Query): Promise<T>;
}

export type MagisterErrorCode =
  | "geen-sessie"
  | "verlopen"
  | "geen-toegang"
  | "niet-gevonden"
  | "te-vaak"
  | "server"
  | "netwerk"
  | "ongeldige-school"
  | "ongeldig-pad"
  | "ongeldig-antwoord"
  | "geen-extensie";

/** Een fout bij het ophalen. De melding bevat nooit het token. */
export class MagisterError extends Error {
  constructor(
    readonly code: MagisterErrorCode,
    message: string,
    readonly status?: number,
    /** Bij "te-vaak": zoveel seconden wachten. */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "MagisterError";
  }
}

/** De foutcodes van onze eigen proxy (lib/magister/proxy.ts), vertaald. */
const PROXY_CODES: Readonly<Record<string, MagisterErrorCode>> = {
  "geen-token": "geen-sessie",
  verlopen: "verlopen",
  "geen-toegang": "geen-toegang",
  "niet-gevonden": "niet-gevonden",
  "te-vaak": "te-vaak",
  "magister-plat": "server",
  timeout: "netwerk",
  netwerk: "netwerk",
  "ongeldige-school": "ongeldige-school",
  "ongeldig-pad": "ongeldig-pad",
};

/** Alleen echte Magister-scholen: `{school}.magister.net`. */
export const SCHOOL_HOST = /^[a-z0-9-]+\.magister\.net$/;
/** Paden onder /api: alleen letters, cijfers, - en _, gescheiden door /. */
const SAFE_PATH = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;

const STATUS_CODES: readonly [number, MagisterErrorCode, string][] = [
  [401, "verlopen", "Je sessie bij Magister is verlopen."],
  [403, "geen-toegang", "Magister geeft geen toegang tot deze gegevens."],
  [404, "niet-gevonden", "Magister kent deze gegevens niet (meer)."],
  [429, "te-vaak", "Even te veel verzoeken. Probeer het zo nog eens."],
];

function checkSession(session: MagisterSession | null): MagisterSession {
  if (!session || !session.token) throw new MagisterError("geen-sessie", "Je bent niet gekoppeld.");
  if (session.expiresAt !== null && session.expiresAt <= Date.now())
    throw new MagisterError("verlopen", "Je sessie bij Magister is verlopen.");
  if (!SCHOOL_HOST.test(session.schoolHost))
    throw new MagisterError("ongeldige-school", "Dat is geen Magister-school.");
  return session;
}

function checkPath(path: string): string {
  if (!SAFE_PATH.test(path)) throw new MagisterError("ongeldig-pad", "Ongeldig pad.");
  return path;
}

function queryString(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) params.set(key, String(value));
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** Via de eigen proxy-route (fase 5). */
export function createProxyTransport({
  session,
  fetch: doFetch = (...args) => globalThis.fetch(...args),
  base = "/api/magister",
}: {
  session: () => MagisterSession | null;
  fetch?: typeof fetch;
  base?: string;
}): MagisterTransport {
  return {
    kind: "proxy",
    async get<T>(path: string, query?: Query): Promise<T> {
      const safePath = checkPath(path);
      const current = checkSession(session());
      let response: Response;
      try {
        response = await doFetch(`${base}/${safePath}${queryString(query)}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${current.token}`,
            "X-Magister-School": current.schoolHost,
          },
        });
      } catch {
        throw new MagisterError("netwerk", "Geen verbinding met Magister.");
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          fout?: string;
          melding?: string;
          opnieuwNa?: number;
        } | null;
        const retry = Number(body?.opnieuwNa ?? response.headers?.get("retry-after"));
        const retryAfter = Number.isFinite(retry) && retry > 0 ? retry : undefined;
        const fromProxy = body?.fout ? PROXY_CODES[body.fout] : undefined;
        const known = STATUS_CODES.find(([status]) => status === response.status);
        if (fromProxy)
          throw new MagisterError(
            fromProxy,
            known?.[2] ?? "Magister doet even moeilijk.",
            response.status,
            retryAfter,
          );
        if (known) throw new MagisterError(known[1], known[2], response.status, retryAfter);
        throw new MagisterError("server", "Magister doet even moeilijk.", response.status);
      }
      try {
        return (await response.json()) as T;
      } catch {
        throw new MagisterError("ongeldig-antwoord", "Magister gaf een onleesbaar antwoord.");
      }
    },
  };
}

/** Later: via een browserextensie. Zolang die er niet is, zegt hij dat eerlijk. */
export function createExtensionTransport(): MagisterTransport {
  return {
    kind: "extensie",
    async get<T>(): Promise<T> {
      throw new MagisterError("geen-extensie", "De browserextensie is er nog niet.");
    },
  };
}
