import { describe, expect, it, vi } from "vitest";
import laatste from "@/lib/magister/__fixtures__/cijfers-laatste.json";
import { loadExtensionScripts, SHARED } from "./load";

/* eslint-disable @typescript-eslint/no-explicit-any */
const SM = loadExtensionScripts<any>(SHARED);

const NOW = Date.UTC(2026, 9, 8, 12, 0);
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

const oidc = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ access_token: TOKEN, expires_at: EXP, ...extra });

describe("protocol", () => {
  const message = { source: "supermagister-app", version: 1, id: "a1", type: "status" };

  it("accepteert alleen berichten van de app in het vaste formaat", () => {
    expect(SM.isAppMessage(message)).toBe(true);
    expect(SM.isAppMessage({ ...message, version: 2 })).toBe(false);
    expect(SM.isAppMessage({ ...message, source: "iemand-anders" })).toBe(false);
    expect(SM.isAppMessage({ ...message, type: "geef-me-het-token" })).toBe(false);
    expect(SM.isAppMessage({ ...message, id: "" })).toBe(false);
    expect(SM.isAppMessage("status")).toBe(false);
    expect(SM.isAppMessage(null)).toBe(false);
  });
});

describe("findMagisterSession (content script op Magister)", () => {
  const env = (session: Record<string, string> = {}, local: Record<string, string> = {}) => ({
    hostname: "voorbeeld.magister.net",
    sessionStorage: new FakeStorage(session),
    localStorage: new FakeStorage(local),
    now: NOW,
  });

  it("vindt het token onder oidc.user:, net als de bookmarklet", () => {
    expect(
      SM.findMagisterSession(
        env({ "oidc.user:https://accounts.magister.net:M6-voorbeeld.magister.net": oidc() }),
      ),
    ).toEqual({
      sessie: { token: TOKEN, expiresAt: EXP * 1000, schoolHost: "voorbeeld.magister.net" },
    });
  });

  it("zoekt anders in alle sleutels van sessionStorage en localStorage", () => {
    expect(SM.findMagisterSession(env({ iets: oidc() })).sessie.token).toBe(TOKEN);
    expect(SM.findMagisterSession(env({}, { auth: oidc() })).sessie.token).toBe(TOKEN);
  });

  it("doet niets op de inlogpagina of buiten Magister", () => {
    for (const hostname of ["accounts.magister.net", "evil.com", "a.magister.net.evil.com"]) {
      expect(SM.findMagisterSession({ ...env({ "oidc.user:x": oidc() }), hostname })).toEqual({
        fout: "geen-school",
      });
    }
  });

  it("meldt geen sessie, een kapot token of een verlopen token", () => {
    expect(SM.findMagisterSession(env())).toEqual({ fout: "geen-sessie" });
    expect(SM.findMagisterSession(env({ "oidc.user:x": oidc({ access_token: "kort" }) }))).toEqual({
      fout: "ongeldig",
    });
    expect(
      SM.findMagisterSession(env({ "oidc.user:x": oidc({ expires_at: EXP - 7200 }) })),
    ).toEqual({ fout: "verlopen" });
  });
});

describe("magisterGet (verzoeken via de background)", () => {
  const session = { token: TOKEN, schoolHost: "voorbeeld.magister.net" };
  const respond = (status: number, body: unknown = {}, headers: Record<string, string> = {}) =>
    vi.fn(async () => new Response(JSON.stringify(body), { status, headers }));

  it("vraagt alleen GET op /api van de eigen school, met alleen het token", async () => {
    const fetch = respond(200, { Persoon: { Id: 1 } });
    const answer = await SM.magisterGet({
      fetch,
      session,
      path: "personen/1/afspraken",
      query: { van: "2026-10-05", tot: "2026-10-11" },
    });
    expect(answer).toEqual({ ok: true, data: { Persoon: { Id: 1 } } });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "https://voorbeeld.magister.net/api/personen/1/afspraken?van=2026-10-05&tot=2026-10-11",
    );
    expect(init).toMatchObject({ method: "GET", credentials: "omit", redirect: "manual" });
    expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}`, Accept: "application/json" });
  });

  it("weigert vreemde paden, queries en scholen zonder iets te vragen", async () => {
    const fetch = respond(200);
    for (const path of ["../../evil", "account?x=1", "https://evil.com/api", "", 42]) {
      expect(await SM.magisterGet({ fetch, session, path })).toEqual({
        ok: false,
        fout: "ongeldig-pad",
      });
    }
    expect(await SM.magisterGet({ fetch, session, path: "account", query: { "x&y": 1 } })).toEqual({
      ok: false,
      fout: "ongeldig-pad",
    });
    expect(
      await SM.magisterGet({ fetch, session: { ...session, schoolHost: "evil.com" }, path: "a" }),
    ).toEqual({ ok: false, fout: "ongeldige-school" });
    expect(await SM.magisterGet({ fetch, session: null, path: "account" })).toEqual({
      ok: false,
      fout: "geen-sessie",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("vertaalt fouten naar dezelfde codes als de proxy", async () => {
    const cases: [number, Record<string, unknown>][] = [
      [401, { fout: "verlopen" }],
      [302, { fout: "verlopen" }],
      [403, { fout: "geen-toegang" }],
      [404, { fout: "niet-gevonden" }],
      [503, { fout: "magister-plat" }],
    ];
    for (const [status, expected] of cases) {
      const fetch = vi.fn(async () => new Response(null, { status }));
      expect(await SM.magisterGet({ fetch, session, path: "account" })).toMatchObject({
        ok: false,
        ...expected,
      });
    }
    expect(
      await SM.magisterGet({
        fetch: respond(429, {}, { "retry-after": "30" }),
        session,
        path: "account",
      }),
    ).toEqual({ ok: false, fout: "te-vaak", status: 429, opnieuwNa: 30 });
    expect(
      await SM.magisterGet({
        fetch: vi.fn(async () => {
          throw new TypeError("Failed to fetch");
        }),
        session,
        path: "account",
      }),
    ).toEqual({ ok: false, fout: "netwerk" });
  });
});

describe("vernieuwen", () => {
  it("vernieuwt binnen 5 minuten voor het verlopen, en als het al verlopen is", () => {
    expect(SM.needsRenewal({ expiresAt: NOW + 10 * 60_000 }, NOW)).toBe(false);
    expect(SM.needsRenewal({ expiresAt: NOW + 4 * 60_000 }, NOW)).toBe(true);
    expect(SM.needsRenewal({ expiresAt: NOW - 1 }, NOW)).toBe(true);
    expect(SM.needsRenewal(null, NOW)).toBe(true);
  });

  it("probeert hooguit één keer per 10 minuten", () => {
    expect(SM.mayRenew(undefined, NOW)).toBe(true);
    expect(SM.mayRenew(NOW - 9 * 60_000, NOW)).toBe(false);
    expect(SM.mayRenew(NOW - 10 * 60_000, NOW)).toBe(true);
  });

  it("herkent de inlogpagina van Magister", () => {
    expect(SM.isLoginPage("https://accounts.magister.net/account/login?ReturnUrl=x")).toBe(true);
    expect(SM.isLoginPage("https://voorbeeld.magister.net/magister/#/vandaag")).toBe(false);
    expect(SM.isLoginPage(undefined)).toBe(false);
  });
});

describe("badge", () => {
  it("telt cijfers die Magister later invoerde dan het nieuwste dat de app kent", () => {
    expect(SM.countNewGrades(laatste, "2026-09-01T00:00:00Z")).toBe(1);
    expect(SM.countNewGrades(laatste, "2026-09-29T11:40:30Z")).toBe(0);
  });

  it("telt niets zolang de app nog niets gemeld heeft", () => {
    expect(SM.countNewGrades(laatste, null)).toBe(0);
    expect(SM.countNewGrades({ wat: "anders" }, "2026-09-01T00:00:00Z")).toBe(0);
  });

  it("zet een net getal op het icoon", () => {
    expect(SM.badgeText(0)).toBe("");
    expect(SM.badgeText(3)).toBe("3");
    expect(SM.badgeText(140)).toBe("99+");
  });
});
