import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { createCounterBuffer } from "@/lib/stats/store";
import { dashboardConfigFrom, SESSION_COOKIE, type DashboardConfig } from "./auth";
import { handleLogin, handleLogout, LOGIN_LIMIT, LOGIN_WINDOW_MS } from "./login";

const CONFIG = dashboardConfigFrom({
  DEV_DASHBOARD_PATH: "/dev-k3v9x7q2abcd",
  DEV_DASHBOARD_PASSWORD: "een-heel-lang-wachtwoord",
  DEV_DASHBOARD_KEY: "sleutel-voor-de-deur-123",
}) as DashboardConfig;

function attempt(password: string, ip = "203.0.113.7") {
  const body = new FormData();
  body.set("wachtwoord", password);
  return new Request(`https://supermagister.nl${CONFIG.path}/sessie?key=${CONFIG.key}`, {
    method: "POST",
    body,
    headers: { "x-forwarded-for": ip },
  });
}

describe("inloggen", () => {
  let now = 0;
  const limiter = () =>
    createRateLimiter({ limit: LOGIN_LIMIT, windowMs: LOGIN_WINDOW_MS, now: () => now });
  const buffer = createCounterBuffer({ config: () => null });

  beforeEach(() => {
    now = Date.UTC(2026, 9, 9, 12);
  });
  afterEach(() => vi.restoreAllMocks());

  it("goed wachtwoord: sessiecookie en door naar het dashboard", async () => {
    const response = await handleLogin(attempt(CONFIG.password), CONFIG, {
      limiter: limiter(),
      buffer,
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(CONFIG.path);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(new RegExp(`^${SESSION_COOKIE}=v1\\.`));
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
  });

  it("fout wachtwoord: terug naar het formulier, zonder cookie", async () => {
    const response = await handleLogin(attempt("fout"), CONFIG, { limiter: limiter(), buffer });
    expect(response.headers.get("location")).toBe(`${CONFIG.path}?key=${CONFIG.key}&fout=fout`);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("hooguit 5 pogingen per 15 minuten per IP-adres, ook met het goede wachtwoord", async () => {
    const shared = limiter();
    for (let i = 0; i < LOGIN_LIMIT; i++) {
      const response = await handleLogin(attempt("fout"), CONFIG, { limiter: shared, buffer });
      expect(response.headers.get("location")).toContain("fout=fout");
    }
    const blocked = await handleLogin(attempt(CONFIG.password), CONFIG, {
      limiter: shared,
      buffer,
    });
    expect(blocked.headers.get("location")).toContain("fout=te-vaak");
    expect(blocked.headers.get("set-cookie")).toBeNull();

    // Een ander IP-adres mag gewoon.
    const other = await handleLogin(attempt(CONFIG.password, "198.51.100.1"), CONFIG, {
      limiter: shared,
      buffer,
    });
    expect(other.headers.get("set-cookie")).toContain(SESSION_COOKIE);

    // Na 15 minuten weer.
    now += LOGIN_WINDOW_MS;
    const later = await handleLogin(attempt(CONFIG.password), CONFIG, { limiter: shared, buffer });
    expect(later.headers.get("set-cookie")).toContain(SESSION_COOKIE);
  });

  it("telt een blokkade anoniem, zonder IP-adres", async () => {
    const counting = createCounterBuffer({ config: () => null });
    const shared = limiter();
    for (let i = 0; i <= LOGIN_LIMIT; i++)
      await handleLogin(attempt("fout"), CONFIG, { limiter: shared, buffer: counting });
    const fields = [...counting.pending().values()].flatMap((m) => [...m.keys()]);
    expect(fields).toEqual(["r:inloggen"]);
  });

  it("uitloggen wist het cookie", () => {
    const response = handleLogout(CONFIG);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(response.headers.get("location")).toBe("/");
  });
});
