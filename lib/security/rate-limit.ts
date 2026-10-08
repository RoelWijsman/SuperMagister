/**
 * Een eenvoudige rate limit in het geheugen (vast venster per sleutel), zodat
 * niemand de Magister-proxy als open proxy kan misbruiken. Op Vercel heeft
 * elke serverinstantie zijn eigen teller; dat is genoeg als rem. Er wordt
 * niets opgeslagen of gelogd behalve een teller per IP-adres, en die is na
 * het venster weer weg.
 */

export interface RateLimiter {
  check(key: string): { ok: true } | { ok: false; retryAfter: number };
  size(): number;
}

export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
  maxKeys = 10_000,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
  maxKeys?: number;
}): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();

  function sweep(at: number) {
    for (const [key, window] of windows) if (at - window.start >= windowMs) windows.delete(key);
  }

  return {
    check(key) {
      const at = now();
      if (windows.size >= maxKeys) sweep(at);
      const window = windows.get(key);
      if (!window || at - window.start >= windowMs) {
        windows.set(key, { start: at, count: 1 });
        return { ok: true };
      }
      if (window.count < limit) {
        window.count++;
        return { ok: true };
      }
      return { ok: false, retryAfter: Math.ceil((window.start + windowMs - at) / 1000) };
    },
    size: () => windows.size,
  };
}

/** Het IP-adres van de bezoeker, zoals Vercel het doorgeeft. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "onbekend";
}
