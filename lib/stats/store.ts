import { amsterdamParts, expiresAt } from "./day";

/**
 * De opslag voor de anonieme tellers: Upstash Redis (via de Vercel
 * Marketplace), aangesproken met de REST-API, zonder extra dependency.
 *
 * Per dag is er één hash, `sm:dag:<JJJJ-MM-DD>`, met alleen tellers als velden
 * (bijv. `e:walkout-gestart` → 12). Er staat nooit een IP-adres, id, user-agent,
 * school, naam, vak of cijfer in. Elke dag verdwijnt na 400 dagen vanzelf
 * (EXPIREAT), ruim 13 maanden.
 *
 * Tellen gaat via een buffer in het geheugen: een verzoek telt op, en hooguit
 * eens per FLUSH_MS gaan alle tellers in één pipeline naar Redis. Dat scheelt
 * veel commando's (en dus geld). Gaat een serverinstantie uit voordat de buffer
 * is weggeschreven, dan missen we die paar tellen; voor statistiek is dat goed.
 * Zonder opslag (lokaal, of nog niet gekoppeld) wordt er niets bewaard.
 */

export interface RedisConfig {
  url: string;
  token: string;
}

/** Vercel Marketplace (Upstash) zet de KV_-namen; los van Vercel heten ze UPSTASH_REDIS_REST_*. */
export function redisConfigFrom(env: Record<string, string | undefined>): RedisConfig | null {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  // Altijd https, behalve een lokale testopslag op je eigen computer.
  if (!url || !token || !/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(url))
    return null;
  return { url: url.replace(/\/+$/, ""), token };
}

export function redisConfig(): RedisConfig | null {
  return redisConfigFrom(process.env);
}

export type Command = (string | number)[];

const TIMEOUT_MS = 4000;

/** Voert commando's in één keer uit. Geeft per commando het resultaat (of null bij een fout). */
export async function pipeline(
  config: RedisConfig,
  commands: Command[],
  doFetch: typeof fetch = fetch,
): Promise<unknown[]> {
  if (commands.length === 0) return [];
  const response = await doFetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // Bewust zonder de foutmelding van Upstash door te geven: die zou commando's kunnen bevatten.
  if (!response.ok) throw new Error(`Opslag gaf status ${response.status}`);
  const results = (await response.json()) as { result?: unknown; error?: string }[];
  return results.map((r) => (r && "result" in r && !r.error ? r.result : null));
}

export const DAY_PREFIX = "sm:dag:";
export const dayHash = (date: string) => `${DAY_PREFIX}${date}`;

/** Een veld mag alleen deze tekens hebben: zo kan er nooit vrije tekst in een teller komen. */
export const FIELD = /^[a-z0-9:-]{1,80}$/;

/** De buffer: per dag, per veld, hoeveel erbij moet. */
export interface CounterBuffer {
  add(field: string, by?: number, at?: Date): void;
  /** Alles wegschrijven, als het tijd is (of meteen met force). */
  flush(force?: boolean): Promise<void>;
  pending(): Map<string, Map<string, number>>;
}

export const FLUSH_MS = 5000;

export function createCounterBuffer({
  config = redisConfig,
  doFetch = (input, init) => fetch(input, init),
  now = Date.now,
}: {
  config?: () => RedisConfig | null;
  doFetch?: typeof fetch;
  now?: () => number;
} = {}): CounterBuffer {
  let buffer = new Map<string, Map<string, number>>();
  let lastFlush = 0;
  let busy: Promise<void> | null = null;

  return {
    add(field, by = 1, at = new Date(now())) {
      if (!FIELD.test(field) || !Number.isFinite(by) || by === 0) return;
      const { date } = amsterdamParts(at);
      const fields = buffer.get(date) ?? new Map<string, number>();
      fields.set(field, (fields.get(field) ?? 0) + Math.round(by));
      buffer.set(date, fields);
    },
    async flush(force = false) {
      if (busy) return busy;
      if (buffer.size === 0) return;
      const target = config();
      if (!target) {
        // Geen opslag: niets bewaren, en de buffer niet laten groeien.
        buffer = new Map();
        return;
      }
      if (!force && now() - lastFlush < FLUSH_MS) return;
      lastFlush = now();
      const batch = buffer;
      buffer = new Map();
      const commands: Command[] = [];
      for (const [date, fields] of batch) {
        for (const [field, by] of fields) commands.push(["HINCRBY", dayHash(date), field, by]);
        commands.push(["EXPIREAT", dayHash(date), expiresAt(date)]);
      }
      busy = pipeline(target, commands, doFetch)
        .then(() => undefined)
        // Mislukt? Dan zijn deze tellen weg. Niets loggen: geen ruis, geen gegevens.
        .catch(() => undefined)
        .finally(() => {
          busy = null;
        });
      return busy;
    },
    pending: () => buffer,
  };
}

/** De gedeelde buffer van deze serverinstantie. */
export const counters = createCounterBuffer();

/** Leest de tellers van een rij dagen (één HGETALL per dag, in één verzoek). */
export async function readDays(
  dates: readonly string[],
  config: RedisConfig,
  doFetch: typeof fetch = fetch,
): Promise<Record<string, number>[]> {
  const results = await pipeline(
    config,
    dates.map((date) => ["HGETALL", dayHash(date)]),
    doFetch,
  );
  return results.map((result) => {
    const fields: Record<string, number> = {};
    if (Array.isArray(result)) {
      for (let i = 0; i + 1 < result.length; i += 2) {
        const value = Number(result[i + 1]);
        if (typeof result[i] === "string" && Number.isFinite(value))
          fields[result[i] as string] = value;
      }
    } else if (result && typeof result === "object") {
      for (const [field, raw] of Object.entries(result)) {
        const value = Number(raw);
        if (Number.isFinite(value)) fields[field] = value;
      }
    }
    return fields;
  });
}
