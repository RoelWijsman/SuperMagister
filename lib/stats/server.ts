import { after } from "next/server";
import { amsterdamParts } from "./day";
import {
  FIELDS,
  latencyBucket,
  statusGroup,
  type RateLimitSource,
  type StatusGroup,
} from "./fields";
import { counters, type CounterBuffer } from "./store";

/**
 * Tellen op de server, zonder dat de browser iets hoeft te sturen: de proxy,
 * de rate limits en de vakantie-API. Alleen tellers; niets over wie.
 */

/** Na het antwoord wegschrijven (als het tijd is), zodat niemand op de opslag wacht. */
export function scheduleFlush(buffer: CounterBuffer = counters) {
  try {
    after(() => buffer.flush());
  } catch {
    // Buiten een verzoek (tests, scripts): gewoon meteen proberen.
    void buffer.flush();
  }
}

export interface ProxyObserver {
  /** Magister antwoordde (met deze status, na zoveel ms), of gaf geen antwoord (null). */
  upstream(status: number | null, ms: number): void;
  /** De proxy weigerde zelf (geen token, foute school of pad, geen GET). */
  rejected(): void;
  /** De rem per IP-adres greep in. */
  rateLimited(): void;
}

export function proxyObserver(
  buffer: CounterBuffer = counters,
  now: () => Date = () => new Date(),
): ProxyObserver {
  return {
    upstream(status, ms) {
      const at = now();
      const group: StatusGroup = status === null ? "5xx" : statusGroup(status);
      buffer.add(FIELDS.proxyRequests, 1, at);
      buffer.add(FIELDS.proxyStatus(group), 1, at);
      if (status === null) return;
      const { hour } = amsterdamParts(at);
      const rounded = Math.max(0, Math.round(ms));
      buffer.add(FIELDS.latencyCount(hour), 1, at);
      buffer.add(FIELDS.latencySum(hour), rounded, at);
      buffer.add(FIELDS.latencyBucket(hour, latencyBucket(rounded)), 1, at);
    },
    rejected() {
      buffer.add(FIELDS.proxyRejected, 1, now());
    },
    rateLimited() {
      buffer.add(FIELDS.rateLimited("proxy"), 1, now());
    },
  };
}

export function countRateLimited(source: RateLimitSource, buffer: CounterBuffer = counters) {
  buffer.add(FIELDS.rateLimited(source));
}

export function countHolidaysFailed(buffer: CounterBuffer = counters) {
  buffer.add(FIELDS.holidaysFailed);
}
