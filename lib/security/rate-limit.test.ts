import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("laat per sleutel een vast aantal verzoeken per venster door", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => now });
    expect([1, 2, 3].map(() => limiter.check("1.2.3.4").ok)).toEqual([true, true, true]);
    expect(limiter.check("1.2.3.4")).toEqual({ ok: false, retryAfter: 60 });
    // Een ander adres heeft er geen last van.
    expect(limiter.check("5.6.7.8").ok).toBe(true);
    now = 45_000;
    expect(limiter.check("1.2.3.4")).toEqual({ ok: false, retryAfter: 15 });
    now = 60_000;
    expect(limiter.check("1.2.3.4").ok).toBe(true);
  });

  it("vergeet oude vensters, zodat het geheugen niet volloopt", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now, maxKeys: 2 });
    limiter.check("a");
    limiter.check("b");
    now = 2000;
    limiter.check("c");
    expect(limiter.size()).toBe(1);
  });
});

describe("clientIp", () => {
  it("neemt het eerste adres uit x-forwarded-for, anders x-real-ip", () => {
    const headers = (init: Record<string, string>) => new Headers(init);
    expect(clientIp(headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(headers({}))).toBe("onbekend");
  });
});
