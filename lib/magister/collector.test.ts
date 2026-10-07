import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * Het verzamelscript (scripts/verzamel-magister.js) draait in de console van
 * Magister, met je echte token. Deze test draait het tegen een nep-Magister
 * en controleert vooral één ding: er komt nooit een token in de export.
 */
const SCRIPT = readFileSync(join(process.cwd(), "scripts", "verzamel-magister.js"), "utf8");

const ACCESS = "eyJhbGciOi.ACCESS-geheim.123";
const REFRESH = "REFRESH-geheim-456789";
const ID = "eyJ.ID-geheim.987654";
const KEY = "oidc.user:https://accounts.magister.net:M6-noorderlicht.magister.net";

function storage(entries: Record<string, string>) {
  return {
    getItem: (key: string) => entries[key] ?? null,
    key: (i: number) => Object.keys(entries)[i] ?? null,
    get length() {
      return Object.keys(entries).length;
    },
    ...entries,
  };
}

const ROUTES: [RegExp, number, unknown][] = [
  [/\/api\/account$/, 200, { Persoon: { Id: 42, Roepnaam: "Test" } }],
  [/\/api\/sessions\/current$/, 404, null],
  [
    /\/aanmeldingen\?geenToekomstige=false$/,
    200,
    {
      Items: [
        { Id: 6, Start: "2025-08-01T00:00:00Z", Einde: "2026-07-31T00:00:00Z" },
        { Id: 7, Start: "2026-08-01T00:00:00Z", Einde: "2027-07-31T00:00:00Z" },
      ],
    },
  ],
  [/cijfers\/laatste\?top=50&skip=0$/, 404, null],
  // Een antwoord dat (per ongeluk) het token bevat: moet eruit.
  [/cijfers\/laatste\?top=50$/, 200, { Items: [{ Waarde: "7,8", Echo: `Bearer ${ACCESS}` }] }],
  [
    /\/api\/aanmeldingen\/6\/cijfers$/,
    200,
    {
      items: [
        {
          kolomId: 300,
          waarde: "7,5",
          links: {
            kolom: { href: "/api/kolommen/300" },
            elders: { href: "https://evil.example.com/steel" },
          },
        },
      ],
    },
  ],
  [/\/api\/aanmeldingen\/7\/cijfers$/, 200, { items: [] }],
  [/\/api\/kolommen\/300$/, 200, { weging: 2 }],
  [/cijferoverzichtvooraanmelding\?/, 200, { Items: [{ Id: 1 }, { Id: 2 }] }],
  [/afspraken\?van=/, 200, { Items: [{ Id: 9, Status: 5, InfoType: 1 }] }],
];

async function run() {
  const fetch = vi.fn(async (url: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${ACCESS}`);
    const route = ROUTES.find(([pattern]) => pattern.test(url));
    const [, status, body] = route ?? [null, 500, null];
    return new Response(body === null ? "" : JSON.stringify(body), { status });
  });
  let blob: Blob | null = null;
  const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
  const logs: string[] = [];
  const consoleMock = {
    log: (...args: unknown[]) => logs.push(String(args[0])),
    warn: (...args: unknown[]) => logs.push(String(args[0])),
    error: (...args: unknown[]) => logs.push(String(args[0])),
    table: vi.fn(),
  };
  const sessionStorage = storage({
    "andere.key": "niks",
    [KEY]: JSON.stringify({
      access_token: ACCESS,
      refresh_token: REFRESH,
      id_token: ID,
      token_type: "Bearer",
      expires_at: Math.round(Date.now() / 1000) + 3600,
      profile: { name: "Echte Naam" },
    }),
  });

  const body = SCRIPT.trim().replace(/;\s*$/, "");
  const runScript = new Function(
    "location",
    "sessionStorage",
    "localStorage",
    "fetch",
    "document",
    "console",
    "setTimeout",
    "URL",
    `return (\n${body}\n);`,
  );
  await runScript(
    { host: "noorderlicht.magister.net" },
    sessionStorage,
    storage({}),
    fetch,
    { createElement: () => link, body: { appendChild: vi.fn() } },
    consoleMock,
    (fn: () => void) => {
      fn();
      return 0;
    },
    {
      createObjectURL: (b: Blob) => {
        blob = b;
        return "blob:export";
      },
      revokeObjectURL: vi.fn(),
    },
  );
  const text = blob ? await (blob as Blob).text() : "";
  return { text, json: JSON.parse(text || "{}"), link, logs, fetch };
}

describe("verzamelscript (scripts/verzamel-magister.js)", () => {
  it("zet nooit een token in de export", async () => {
    const { text } = await run();
    expect(text).not.toContain(ACCESS);
    expect(text).not.toContain(REFRESH);
    expect(text).not.toContain(ID);
    expect(text).toContain("[TOKEN VERWIJDERD]");
  });

  it("noemt de naam van de key, maar niet de waarde", async () => {
    const { json } = await run();
    expect(json.rapport.school).toBe("noorderlicht.magister.net");
    expect(json.rapport.token).toMatchObject({
      opslag: "sessionStorage",
      key: KEY,
      bevatAccessToken: true,
      bevatExpiresAt: true,
    });
    expect(json.rapport.token.velden).toContain("expires_at");
    expect(JSON.stringify(json.rapport)).not.toContain("Echte Naam");
  });

  it("probeert varianten en noteert per endpoint URL, status en aantal items", async () => {
    const { json } = await run();
    type Endpoint = { naam: string; pogingen: { url: string; status: number }[] };
    const byName: Record<string, Endpoint> = Object.fromEntries(
      (json.rapport.endpoints as Endpoint[]).map((e) => [e.naam, e]),
    );
    expect(byName.laatsteCijfers).toMatchObject({ gelukt: true, status: 200, items: 1 });
    expect(byName.laatsteCijfers!.pogingen.map((p) => p.status)).toEqual([404, 200]);
    expect(byName.sessie).toMatchObject({ gelukt: false });
    expect(byName.sessie!.pogingen[0]).toMatchObject({
      url: "https://noorderlicht.magister.net/api/sessions/current",
      status: 404,
    });
    expect(byName.cijferoverzicht).toMatchObject({ gelukt: true, items: 2 });
    expect(json.rapport.huidigeAanmelding).toMatchObject({ id: 7 });
    expect(json.data.afspraken).toEqual({ Items: [{ Id: 9, Status: 5, InfoType: 1 }] });
  });

  it("haalt de cijfers per schooljaar op en volgt alleen links binnen /api/", async () => {
    const { json, fetch } = await run();
    expect(json.versie).toBe(3);
    expect(json.data["voortgangscijfers-6"].items).toHaveLength(1);
    expect(json.data["voortgangscijfers-7"]).toEqual({ items: [] });
    expect(json.data.gevolgdeLinks).toEqual([
      { href: "/api/kolommen/300", gelukt: true, antwoord: { weging: 2 } },
    ]);
    expect(json.data.link).toBeUndefined();
    expect(fetch.mock.calls.some(([url]) => String(url).includes("evil"))).toBe(false);
  });

  it("downloadt één bestand en zegt wat je ermee moet", async () => {
    const { link, logs } = await run();
    expect(link.download).toMatch(/^magister-export-\d{4}-\d{2}-\d{2}\.json$/);
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(
      logs.some((line) => line.includes("Klaar! Zet het bestand in de map magister-voorbeelden.")),
    ).toBe(true);
  });

  it("vraagt alleen dingen op de eigen school", async () => {
    const { fetch } = await run();
    for (const [url] of fetch.mock.calls) {
      expect(String(url)).toMatch(/^https:\/\/noorderlicht\.magister\.net\/api\//);
    }
  });
});
