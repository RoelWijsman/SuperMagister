import { NextRequest } from "next/server";
import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";
import {
  ACCESS_HEADER,
  createSession,
  dashboardConfigFrom,
  INTERNAL_PREFIX,
  readCookie,
  safeEqual,
  SESSION_COOKIE,
  sessionCookie,
  subPath,
  verifySession,
  type DashboardConfig,
} from "./auth";

const ENV = {
  DEV_DASHBOARD_PATH: "/dev-k3v9x7q2abcd",
  DEV_DASHBOARD_PASSWORD: "een-heel-lang-wachtwoord",
  DEV_DASHBOARD_KEY: "sleutel-voor-de-deur-123",
};
const CONFIG = dashboardConfigFrom(ENV) as DashboardConfig;

beforeEach(() => {
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());

function req(path: string, init: { method?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(`https://supermagister.nl${path}`, init);
}

/** Wat een gewone, niet-bestaande pagina krijgt: geen rewrite, gewoon door naar Next.js. */
async function looksLikeNormalPage(path: string, init?: Parameters<typeof req>[1]) {
  const response = await proxy(req(path, init));
  expect(isRewrite(response)).toBe(false);
  expect(response.headers.get("X-Robots-Tag")).toBeNull();
  return response;
}

describe("configuratie uit de omgeving", () => {
  it("leest pad, wachtwoord en sleutel", () => {
    expect(CONFIG).toEqual({
      path: "/dev-k3v9x7q2abcd",
      password: ENV.DEV_DASHBOARD_PASSWORD,
      key: ENV.DEV_DASHBOARD_KEY,
    });
  });

  it("bestaat niet zonder alle drie, of met te korte waarden", () => {
    expect(dashboardConfigFrom({})).toBeNull();
    expect(dashboardConfigFrom({ ...ENV, DEV_DASHBOARD_KEY: undefined })).toBeNull();
    expect(dashboardConfigFrom({ ...ENV, DEV_DASHBOARD_PASSWORD: "kort" })).toBeNull();
    expect(dashboardConfigFrom({ ...ENV, DEV_DASHBOARD_PATH: "/dev" })).toBeNull();
    expect(dashboardConfigFrom({ ...ENV, DEV_DASHBOARD_PATH: "dev-zonder-slash-123" })).toBeNull();
  });

  it("weigert paden over de API, Next.js of het interne adres heen", () => {
    for (const path of ["/api-geheim-123456", "/_next-geheim-123", `${INTERNAL_PREFIX}-x`])
      expect(dashboardConfigFrom({ ...ENV, DEV_DASHBOARD_PATH: path })).toBeNull();
  });

  it("subPath herkent alleen het pad zelf en wat eronder valt", () => {
    expect(subPath("/dev-k3v9x7q2abcd", CONFIG.path)).toBe("");
    expect(subPath("/dev-k3v9x7q2abcd/export", CONFIG.path)).toBe("/export");
    expect(subPath("/dev-k3v9x7q2abcdX", CONFIG.path)).toBeNull();
    expect(subPath("/vandaag", CONFIG.path)).toBeNull();
  });
});

describe("sessie", () => {
  it("een nieuwe sessie is geldig, 7 dagen lang", async () => {
    const now = Date.UTC(2026, 9, 9, 12);
    const session = await createSession(CONFIG, now);
    expect(await verifySession(CONFIG, session.value, now)).toBe(true);
    expect(await verifySession(CONFIG, session.value, now + 6.9 * 86_400_000)).toBe(true);
    expect(await verifySession(CONFIG, session.value, now + 7 * 86_400_000 + 1)).toBe(false);
  });

  it("een gewijzigde handtekening of verloopdatum is ongeldig", async () => {
    const now = Date.now();
    const { value } = await createSession(CONFIG, now);
    const [v, expires, signature] = value.split(".");
    const tampered = `${v}.${Number(expires) + 86_400_000}.${signature}`;
    expect(await verifySession(CONFIG, tampered, now)).toBe(false);
    expect(await verifySession(CONFIG, `${v}.${expires}.${"A".repeat(43)}`, now)).toBe(false);
    expect(await verifySession(CONFIG, "onzin", now)).toBe(false);
    expect(await verifySession(CONFIG, null, now)).toBe(false);
  });

  it("een nieuw wachtwoord maakt oude sessies ongeldig", async () => {
    const { value } = await createSession(CONFIG);
    expect(await verifySession({ ...CONFIG, password: "een-ander-lang-wachtwoord" }, value)).toBe(
      false,
    );
  });

  it("het cookie is httpOnly, secure, sameSite=strict en alleen voor het geheime pad", async () => {
    const { value, expires } = await createSession(CONFIG);
    const cookie = sessionCookie(CONFIG, value, expires);
    expect(cookie).toContain(`${SESSION_COOKIE}=${value}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain(`Path=${CONFIG.path}`);
    expect(cookie).toMatch(/Max-Age=(60479\d|604800);/);
  });

  it("safeEqual vergelijkt correct, ook bij verschillende lengtes", async () => {
    expect(await safeEqual("abc", "abc")).toBe(true);
    expect(await safeEqual("abc", "abd")).toBe(false);
    expect(await safeEqual("abc", "abcd")).toBe(false);
    expect(await safeEqual("", "")).toBe(true);
  });

  it("readCookie vindt het juiste cookie", () => {
    expect(readCookie("a=1; sm-dev=v1.2.3; b=2", "sm-dev")).toBe("v1.2.3");
    expect(readCookie("a=1", "sm-dev")).toBeNull();
    expect(readCookie(null, "sm-dev")).toBeNull();
  });
});

describe("proxy: zonder sessie een gewone 404", () => {
  it("het geheime adres zonder sessie of sleutel is een gewone (niet-bestaande) pagina", async () => {
    await looksLikeNormalPage(CONFIG.path);
    await looksLikeNormalPage(`${CONFIG.path}/export`);
    await looksLikeNormalPage(`${CONFIG.path}/check`, { method: "POST" });
  });

  it("ook met een verkeerde sleutel of een nep-sessie", async () => {
    await looksLikeNormalPage(`${CONFIG.path}?key=verkeerd`);
    await looksLikeNormalPage(CONFIG.path, { headers: { cookie: `${SESSION_COOKIE}=v1.1.abc` } });
  });

  it("de sleutel opent alleen de inlogpagina, niet het dashboard of de data", async () => {
    await looksLikeNormalPage(`${CONFIG.path}/export?key=${ENV.DEV_DASHBOARD_KEY}`);
    await looksLikeNormalPage(`${CONFIG.path}/check?key=${ENV.DEV_DASHBOARD_KEY}`, {
      method: "POST",
    });
    const login = await proxy(req(`${CONFIG.path}?key=${ENV.DEV_DASHBOARD_KEY}`));
    expect(isRewrite(login)).toBe(true);
    expect(new URL(getRewrittenUrl(login)!).pathname).toBe(`${INTERNAL_PREFIX}/inloggen`);
    expect(login.headers.get("X-Robots-Tag")).toContain("noindex");
  });

  it("het interne adres geeft altijd een 404, ook met sessie", async () => {
    const { value } = await createSession(CONFIG);
    for (const path of [
      INTERNAL_PREFIX,
      `${INTERNAL_PREFIX}/inloggen`,
      `${INTERNAL_PREFIX}/export`,
    ]) {
      const response = await proxy(
        req(path, {
          headers: { cookie: `${SESSION_COOKIE}=${value}`, [ACCESS_HEADER]: "dashboard" },
        }),
      );
      expect(new URL(getRewrittenUrl(response)!).pathname).toBe("/_niet-gevonden");
      // De header van buiten wordt weggegooid.
      expect(response.headers.get(`x-middleware-request-${ACCESS_HEADER}`)).toBeNull();
    }
  });

  it("met een geldige sessie: het dashboard, met noindex", async () => {
    const { value } = await createSession(CONFIG);
    const response = await proxy(
      req(`${CONFIG.path}?dagen=7`, { headers: { cookie: `${SESSION_COOKIE}=${value}` } }),
    );
    const target = new URL(getRewrittenUrl(response)!);
    expect(target.pathname).toBe(INTERNAL_PREFIX);
    expect(target.search).toBe("?dagen=7");
    expect(response.headers.get(`x-middleware-request-${ACCESS_HEADER}`)).toBe("dashboard");
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  });

  it("een meegestuurde toegangsheader van buiten telt nooit", async () => {
    const response = await proxy(req("/vandaag", { headers: { [ACCESS_HEADER]: "dashboard" } }));
    expect(response.headers.get(`x-middleware-request-${ACCESS_HEADER}`)).toBeNull();
  });

  it("zonder configuratie bestaat het dashboard niet", async () => {
    vi.stubEnv("DEV_DASHBOARD_PASSWORD", "");
    await looksLikeNormalPage(`${CONFIG.path}?key=${ENV.DEV_DASHBOARD_KEY}`);
  });
});
