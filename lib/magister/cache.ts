import { MagisterError } from "./transport";

/**
 * Fase 5b: de cache om de Magister-bron. De laatst opgehaalde data staat in
 * IndexedDB en is meteen zichtbaar; is hij ouder dan de versheid van dat
 * onderdeel (rooster en cijfers: 15 minuten), dan ververst hij op de
 * achtergrond. Zo blijft er altijd iets te zien, ook als je token verlopen is.
 *
 * Zuinig met Magister:
 * - per onderdeel en week hooguit één verzoek tegelijk (ook als drie schermen
 *   tegelijk vragen);
 * - tabbladen delen de opslag en een slot (navigator.locks): wie het slot
 *   krijgt, kijkt eerst of een ander tabblad net heeft ververst;
 * - na een mislukte verversing even niet opnieuw (bij "te vaak" zo lang als
 *   Magister vraagt).
 */

export interface CacheEntry<T = unknown> {
  data: T;
  /** Moment van ophalen (ms). */
  at: number;
}

export interface CacheBackend {
  get<T>(key: string): Promise<CacheEntry<T> | undefined>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
}

/** Zoals navigator.locks.request: taken met dezelfde naam lopen na elkaar. */
export type LockFn = <T>(name: string, task: () => Promise<T>) => Promise<T>;

const noLock: LockFn = (_name, task) => task();

/** Zo lang wachten we na een mislukte verversing (behalve bij een verlopen sessie). */
const COOLDOWN_MS = 60_000;
/**
 * Speling: de schermen vragen elke 15 minuten, net na het vorige ophalen. Zonder
 * speling is het antwoord dan telkens een paar tellen té vers, en ververst het
 * pas na 30 minuten.
 */
const SLACK_MS = 30_000;

type AnyMethod = (...args: never[]) => Promise<unknown>;
type MethodKeys<S> = { [K in keyof S]: S[K] extends AnyMethod ? K : never }[keyof S];

export interface CacheOptions<S> {
  /** Uniek per bron en schooljaar, zodat niets door elkaar loopt. */
  prefix: string;
  methods: readonly MethodKeys<S>[];
  /** Per onderdeel: zo lang is een antwoord vers (ms). */
  freshness: Partial<Record<MethodKeys<S>, number>>;
  backend: CacheBackend;
  lock?: LockFn;
  now?: () => number;
  /** Er is nieuwe data (zelf opgehaald of door een ander tabblad). */
  onFresh?: (key: string, at: number) => void;
  /** Ophalen mislukte, bijvoorbeeld met een 401. */
  onError?: (error: unknown) => void;
}

export type Cached<S> = S & {
  /** Wanneer de data voor het laatst bij Magister is opgehaald (ms), of null. */
  lastUpdated(): Promise<number | null>;
};

const isAuthError = (error: unknown) =>
  error instanceof MagisterError && (error.code === "verlopen" || error.code === "geen-sessie");

export function withCache<S extends object>(source: S, options: CacheOptions<S>): Cached<S> {
  const { prefix, backend, lock = noLock, now = Date.now, onFresh, onError } = options;
  const inflight = new Map<string, Promise<CacheEntry>>();
  const blocked = new Map<string, { until: number; error: unknown }>();
  const updatedKey = `${prefix}|bijgewerkt`;

  function refresh(key: string, load: () => Promise<unknown>, maxAge: number) {
    const running = inflight.get(key);
    if (running) return running;
    const task = lock(`sm-ververs:${key}`, async (): Promise<CacheEntry> => {
      // Misschien was een ander tabblad ons net voor.
      const latest = await backend.get(key);
      if (latest && now() - latest.at < maxAge) return latest;
      const data = await load();
      const entry = { data, at: now() };
      await backend.set(key, entry);
      await backend.set(updatedKey, { data: entry.at, at: entry.at });
      return entry;
    })
      .then(
        (entry) => {
          blocked.delete(key);
          return entry;
        },
        (error: unknown) => {
          if (!isAuthError(error)) {
            const retryAfter = error instanceof MagisterError ? error.retryAfter : undefined;
            blocked.set(key, {
              until: now() + (retryAfter ? retryAfter * 1000 : COOLDOWN_MS),
              error,
            });
          }
          onError?.(error);
          throw error;
        },
      )
      .finally(() => inflight.delete(key));
    inflight.set(key, task);
    return task;
  }

  async function cached(key: string, load: () => Promise<unknown>, maxAge: number) {
    const entry = await backend.get(key);
    if (entry && now() - entry.at < maxAge) return entry.data;
    const block = blocked.get(key);
    const waiting = block && now() < block.until;
    if (entry) {
      if (!waiting) {
        refresh(key, load, maxAge).then(
          (fresh) => fresh.at > entry.at && onFresh?.(key, fresh.at),
          () => undefined,
        );
      }
      return entry.data;
    }
    if (waiting) throw block.error;
    const fresh = await refresh(key, load, maxAge);
    onFresh?.(key, fresh.at);
    return fresh.data;
  }

  const wrapped = { ...source } as Record<PropertyKey, unknown>;
  for (const method of options.methods) {
    const original = source[method] as unknown as AnyMethod;
    const freshness = options.freshness[method] ?? 15 * 60_000;
    const maxAge = freshness - Math.min(SLACK_MS, freshness / 10);
    wrapped[method as PropertyKey] = (...args: never[]) =>
      cached(
        `${prefix}|${String(method)}|${JSON.stringify(args)}`,
        () => original.apply(source, args),
        maxAge,
      );
  }
  wrapped.lastUpdated = async () => (await backend.get<number>(updatedKey))?.data ?? null;
  return wrapped as Cached<S>;
}
