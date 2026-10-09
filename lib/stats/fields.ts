import type { StatEvent } from "./events";

/**
 * De namen van de velden in de dag-hash. Op één plek, zodat tellen en lezen
 * (het dashboard) het altijd eens zijn.
 *
 *   e:<event>              een event uit de whitelist
 *   p:n                    proxy-verzoeken die Magister bereikten
 *   p:s:<groep>            antwoorden per statusgroep
 *   p:afgewezen            verzoeken die de proxy zelf weigerde (geen token, foute school…)
 *   p:t:<uu>:n|ms|b<i>     responstijd van Magister per uur: aantal, som en histogram
 *   r:<bron>               rate-limit-blokkades (proxy, telling, inloggen)
 *   x:vakanties:fout       de vakantie-API van Rijksoverheid faalde
 */

export const eventField = (event: StatEvent) => `e:${event}`;

export const STATUS_GROUPS = ["2xx", "401", "403", "404", "429", "5xx", "overig"] as const;
export type StatusGroup = (typeof STATUS_GROUPS)[number];

/** In welke groep een antwoord van Magister valt. Een doorverwijzing = sessie weg = 401. */
export function statusGroup(status: number): StatusGroup {
  if (status >= 200 && status < 300) return "2xx";
  if (status >= 300 && status < 400) return "401";
  if (status === 401 || status === 403 || status === 404 || status === 429)
    return String(status) as StatusGroup;
  if (status >= 500) return "5xx";
  return "overig";
}

/** Bovengrenzen (ms) van de emmertjes voor de responstijd; de laatste is "langer". */
export const LATENCY_BOUNDS = [
  100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 8000,
] as const;

export function latencyBucket(ms: number): number {
  const index = LATENCY_BOUNDS.findIndex((bound) => ms <= bound);
  return index === -1 ? LATENCY_BOUNDS.length : index;
}

export const RATE_LIMIT_SOURCES = ["proxy", "telling", "inloggen"] as const;
export type RateLimitSource = (typeof RATE_LIMIT_SOURCES)[number];

export const FIELDS = {
  proxyRequests: "p:n",
  proxyStatus: (group: StatusGroup) => `p:s:${group}`,
  proxyRejected: "p:afgewezen",
  latencyCount: (hour: string) => `p:t:${hour}:n`,
  latencySum: (hour: string) => `p:t:${hour}:ms`,
  latencyBucket: (hour: string, bucket: number) => `p:t:${hour}:b${bucket}`,
  rateLimited: (source: RateLimitSource) => `r:${source}`,
  holidaysFailed: "x:vakanties:fout",
} as const;
