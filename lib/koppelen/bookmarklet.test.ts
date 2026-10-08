import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { buildBookmarklet, resolveAppUrl } from "./bookmarklet";
import { parseLinkFragment } from "./fragment";

const NOW = Date.UTC(2026, 9, 7, 12, 0);
const EXP = Math.floor(NOW / 1000) + 3600;
const TOKEN = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXVy";

class FakeStorage {
  constructor(private readonly items: Record<string, string> = {}) {}
  get length() {
    return Object.keys(this.items).length;
  }
  key(index: number) {
    return Object.keys(this.items)[index] ?? null;
  }
  getItem(key: string) {
    return this.items[key] ?? null;
  }
}

/** Draait de bookmarklet zoals een browser dat doet, op een nagebootste Magister-pagina. */
function run(
  bookmarklet: string,
  {
    hostname = "voorbeeld.magister.net",
    session = {},
    local = {},
  }: { hostname?: string; session?: Record<string, string>; local?: Record<string, string> },
) {
  expect(bookmarklet.startsWith("javascript:")).toBe(true);
  const code = decodeURIComponent(bookmarklet.slice("javascript:".length));
  const alerts: string[] = [];
  const location = { hostname, href: `https://${hostname}/magister/#/vandaag` };
  runInNewContext(code, {
    location,
    sessionStorage: new FakeStorage(session),
    localStorage: new FakeStorage(local),
    alert: (text: string) => alerts.push(text),
    Date: { now: () => NOW },
    encodeURIComponent,
    JSON,
    Number,
  });
  return { href: location.href, alerts };
}

const oidc = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ access_token: TOKEN, expires_at: EXP, token_type: "Bearer", ...extra });

describe("buildBookmarklet", () => {
  const bookmarklet = buildBookmarklet("http://localhost:3100");

  it("opent de app met token, school en verloopmoment in het fragment", () => {
    const { href, alerts } = run(bookmarklet, {
      session: {
        "andere-sleutel": "{}",
        "oidc.user:https://accounts.magister.net:M6-voorbeeld.magister.net": oidc(),
      },
    });
    expect(alerts).toEqual([]);
    const url = new URL(href);
    expect(url.origin).toBe("http://localhost:3100");
    expect(url.pathname).toBe("/koppelen");
    expect(url.search).toBe("");
    expect(parseLinkFragment(url.hash, NOW)).toEqual({
      kind: "ok",
      session: { token: TOKEN, schoolHost: "voorbeeld.magister.net", expiresAt: EXP * 1000 },
    });
  });

  it("zoekt anders in alle sleutels van sessionStorage en localStorage", () => {
    const fromSession = run(bookmarklet, { session: { "iets-anders": oidc() } });
    expect(fromSession.href).toContain("/koppelen#");
    const fromLocal = run(bookmarklet, { local: { auth: oidc() } });
    expect(fromLocal.href).toContain("/koppelen#");
  });

  it("geeft de oidc.user-sleutel voorrang", () => {
    const { href } = run(bookmarklet, {
      session: {
        oud: JSON.stringify({
          access_token: "ander.token.dat-niet-gekozen-wordt",
          expires_at: EXP,
        }),
        "oidc.user:https://accounts.magister.net:M6-voorbeeld.magister.net": oidc(),
      },
    });
    expect(parseLinkFragment(new URL(href).hash, NOW)).toMatchObject({ session: { token: TOKEN } });
  });

  it("doet niets buiten een Magister-school", () => {
    for (const hostname of [
      "evil.com",
      "accounts.magister.net",
      "voorbeeld.magister.net.evil.com",
    ]) {
      const { href, alerts } = run(bookmarklet, { hostname, session: { "oidc.user:x": oidc() } });
      expect(href).not.toContain("localhost");
      expect(alerts).toHaveLength(1);
    }
  });

  it("legt het uit als je niet ingelogd bent of je sessie verlopen is", () => {
    expect(run(bookmarklet, {}).alerts).toHaveLength(1);
    const expired = run(bookmarklet, {
      session: { "oidc.user:x": oidc({ expires_at: Math.floor(NOW / 1000) - 5 }) },
    });
    expect(expired.alerts).toHaveLength(1);
    expect(expired.href).not.toContain("localhost");
  });

  it("overleeft kapotte waarden in de opslag", () => {
    const { href } = run(bookmarklet, {
      session: { "oidc.user:kapot": "{niet-json", "oidc.user:goed": oidc() },
    });
    expect(href).toContain("/koppelen#");
  });

  it("weigert een app-adres dat geen http(s) is", () => {
    expect(() => buildBookmarklet("javascript:alert(1)")).toThrow();
    expect(() => buildBookmarklet("geen url")).toThrow();
  });
});

describe("resolveAppUrl", () => {
  it("gebruikt het ingestelde adres, anders het adres waarop de app draait", () => {
    expect(resolveAppUrl("https://supermagister.nl/", "http://localhost:3100")).toBe(
      "https://supermagister.nl",
    );
    expect(resolveAppUrl(undefined, "http://localhost:3100")).toBe("http://localhost:3100");
    expect(resolveAppUrl("ftp://raar", "http://localhost:3100")).toBe("http://localhost:3100");
  });
});
