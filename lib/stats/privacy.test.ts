import { describe, expect, it, vi } from "vitest";
import { proxyToMagister } from "@/lib/magister/proxy";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { ONBOARDING_STEPS } from "@/stores/onboarding";
import { handleTelling } from "./endpoint";
import { ONBOARDING_STEP_NAMES, STAT_EVENTS, isStatEvent, videoEvent } from "./events";
import { proxyObserver } from "./server";
import { createCounterBuffer, dayHash, FIELD, type CounterBuffer } from "./store";

/**
 * De belofte: in de tellers staat nooit iets persoonlijks. Geen IP-adres, geen
 * id, geen user-agent, geen schoolhost, geen token, geen cijfer, vak of naam.
 */

const PERSONAL = {
  ip: "203.0.113.42",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Geheim/1.0",
  school: "noorderlicht.magister.net",
  token: "eyJhbGciOi.geheim-token.abc123",
  name: "Daan Visser",
  subject: "wiskunde-a",
  grade: "7,8",
  personId: "1234567",
};

/** Alles wat er in de buffer staat, als platte lijst van sleutels, velden en waarden. */
function everything(buffer: CounterBuffer): string[] {
  return [...buffer.pending()].flatMap(([date, fields]) => [
    dayHash(date),
    ...[...fields].flatMap(([field, value]) => [field, String(value)]),
  ]);
}

function expectNothingPersonal(buffer: CounterBuffer) {
  const stored = everything(buffer).join("\n");
  for (const value of Object.values(PERSONAL)) expect(stored).not.toContain(value);
  for (const [, fields] of buffer.pending())
    for (const field of fields.keys()) expect(field).toMatch(FIELD);
}

function telling(body: unknown, headers: Record<string, string> = {}, method = "POST") {
  return new Request("https://supermagister.nl/api/telling", {
    method,
    body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    headers: {
      "content-type": "application/json",
      host: "supermagister.nl",
      "x-forwarded-for": PERSONAL.ip,
      "user-agent": PERSONAL.userAgent,
      ...headers,
    },
  });
}

const fresh = () => ({
  buffer: createCounterBuffer({ config: () => null }),
  limiter: createRateLimiter({ limit: 60, windowMs: 60_000 }),
});

describe("de whitelist", () => {
  it("de onboardingstappen zijn dezelfde als in de app", () => {
    expect([...ONBOARDING_STEP_NAMES]).toEqual([...ONBOARDING_STEPS]);
  });

  it("elke eventnaam is een veilig veld", () => {
    for (const event of STAT_EVENTS) expect(`e:${event}`).toMatch(FIELD);
  });

  it("kent alleen de vaste namen", () => {
    expect(isStatEvent("walkout-gestart")).toBe(true);
    expect(isStatEvent("onboarding-overgeslagen:koppelen")).toBe(true);
    expect(isStatEvent("fout:typeerror")).toBe(true);
    expect(isStatEvent("onboarding-overgeslagen:wiskunde")).toBe(false);
    expect(isStatEvent("walkout-gestart:7,8")).toBe(false);
    expect(isStatEvent("WALKOUT-GESTART")).toBe(false);
    expect(isStatEvent(42)).toBe(false);
    expect(videoEvent("staand", true)).toBe("video-gemaakt:9x16:mysterie");
    expect(videoEvent("vierkant", false)).toBe("video-gemaakt:1x1:open");
  });
});

describe("POST /api/telling", () => {
  it("telt een bekend event als dagteller", async () => {
    const { buffer, limiter } = fresh();
    const response = await handleTelling(telling({ e: "walkout-gestart" }), { buffer, limiter });
    expect(response.status).toBe(204);
    const [date, fields] = [...buffer.pending()][0]!;
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.fromEntries(fields)).toEqual({ "e:walkout-gestart": 1 });
  });

  it("weigert onbekende events en telt dan niets", async () => {
    const { buffer, limiter } = fresh();
    for (const e of ["iets-anders", "gekoppeld:noorderlicht", "", null, { naam: "x" }]) {
      const response = await handleTelling(telling({ e }), { buffer, limiter });
      expect(response.status).toBe(400);
    }
    expect((await handleTelling(telling("geen json"), { buffer, limiter })).status).toBe(400);
    expect(buffer.pending().size).toBe(0);
  });

  it("alleen POST", async () => {
    const { buffer, limiter } = fresh();
    const response = await handleTelling(telling(null, {}, "GET"), { buffer, limiter });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("negeert alles wat er verder wordt meegestuurd", async () => {
    const { buffer, limiter } = fresh();
    // Alles wat persoonlijk is, behalve de user-agent (die zit al in de header): past onder de 256 tekens.
    const { userAgent: _, ...rest } = PERSONAL;
    const body = { e: "gok-precies-goed", ...rest, gok: 7.8 };
    const response = await handleTelling(
      telling(body, { cookie: `id=${PERSONAL.personId}`, referer: `https://${PERSONAL.school}/` }),
      { buffer, limiter },
    );
    expect(response.status).toBe(204);
    expectNothingPersonal(buffer);
    expect(everything(buffer)).toContain("e:gok-precies-goed");
  });

  it("weigert te grote berichten", async () => {
    const { buffer, limiter } = fresh();
    const response = await handleTelling(telling({ e: "app-geopend", x: "a".repeat(400) }), {
      buffer,
      limiter,
    });
    expect(response.status).toBe(413);
    expect(buffer.pending().size).toBe(0);
  });

  it("Do Not Track of Global Privacy Control: niets tellen", async () => {
    const { buffer, limiter } = fresh();
    await handleTelling(telling({ e: "app-geopend" }, { dnt: "1" }), { buffer, limiter });
    await handleTelling(telling({ e: "app-geopend" }, { "sec-gpc": "1" }), { buffer, limiter });
    expect(buffer.pending().size).toBe(0);
  });

  it("weigert verzoeken van een andere site", async () => {
    const { buffer, limiter } = fresh();
    const response = await handleTelling(
      telling({ e: "app-geopend" }, { origin: "https://kwaad.example" }),
      { buffer, limiter },
    );
    expect(response.status).toBe(403);
    expect(buffer.pending().size).toBe(0);
  });

  it("rem per IP-adres: spam telt niet mee (de blokkade wel, anoniem)", async () => {
    const buffer = createCounterBuffer({ config: () => null });
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++)
      statuses.push(
        (await handleTelling(telling({ e: "app-geopend" }), { buffer, limiter })).status,
      );
    expect(statuses).toEqual([204, 204, 204, 429, 429, 429]);
    const fields = Object.fromEntries([...buffer.pending().values()][0]!);
    expect(fields).toEqual({ "e:app-geopend": 3, "r:telling": 3 });
    expectNothingPersonal(buffer);
  });
});

describe("de proxy telt alleen status en snelheid", () => {
  it("geen school, pad, token of IP-adres in de tellers", async () => {
    const buffer = createCounterBuffer({ config: () => null });
    const observe = proxyObserver(buffer);
    const request = (auth = `Bearer ${PERSONAL.token}`) =>
      new Request(`https://supermagister.nl/api/magister/personen/${PERSONAL.personId}/cijfers`, {
        headers: {
          authorization: auth,
          "x-magister-school": PERSONAL.school,
          "x-forwarded-for": PERSONAL.ip,
          "user-agent": PERSONAL.userAgent,
        },
      });
    const limiter = createRateLimiter({ limit: 300, windowMs: 60_000 });
    const ok = vi.fn(async () => Response.json({ Items: [{ Waarde: PERSONAL.grade }] }));
    const expired = vi.fn(async () => new Response(null, { status: 401 }));

    await proxyToMagister(
      request(),
      ["personen", PERSONAL.personId, "cijfers"],
      ok,
      limiter,
      observe,
    );
    await proxyToMagister(
      request(),
      ["personen", PERSONAL.personId, "cijfers"],
      expired,
      limiter,
      observe,
    );
    await proxyToMagister(request("geen"), ["personen"], ok, limiter, observe);

    const fields = Object.fromEntries([...buffer.pending().values()][0]!);
    expect(fields["p:n"]).toBe(2);
    expect(fields["p:s:2xx"]).toBe(1);
    expect(fields["p:s:401"]).toBe(1);
    expect(fields["p:afgewezen"]).toBe(1);
    expectNothingPersonal(buffer);
  });
});

describe("de buffer en de opslag", () => {
  it("schrijft alleen HINCRBY en EXPIREAT, met een TTL van ruim 13 maanden", async () => {
    const sent: unknown[] = [];
    const doFetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
      sent.push(JSON.parse(String(init?.body)));
      return Response.json([{ result: 1 }, { result: 1 }]);
    }) as unknown as typeof fetch;
    const buffer = createCounterBuffer({
      config: () => ({ url: "https://opslag.example", token: "t" }),
      doFetch,
      now: () => Date.UTC(2026, 9, 9, 10),
    });
    buffer.add("e:app-geopend");
    buffer.add("e:app-geopend");
    buffer.add("met spatie en Hoofdletters"); // ongeldig veld: genegeerd
    await buffer.flush(true);
    expect(sent).toEqual([
      [
        ["HINCRBY", "sm:dag:2026-10-09", "e:app-geopend", 2],
        ["EXPIREAT", "sm:dag:2026-10-09", Date.UTC(2027, 10, 13) / 1000],
      ],
    ]);
    // 13 maanden na 9 oktober 2026 is 9 november 2027; we bewaren tot 13 november.
    expect(Date.UTC(2027, 10, 13)).toBeGreaterThan(Date.UTC(2027, 10, 9));
  });

  it("schrijft hooguit eens per 5 seconden, tenzij het moet", async () => {
    let now = 0;
    const doFetch = vi.fn(async () => Response.json([])) as unknown as typeof fetch;
    const buffer = createCounterBuffer({
      config: () => ({ url: "https://opslag.example", token: "t" }),
      doFetch,
      now: () => now,
    });
    now = 10_000;
    buffer.add("e:app-geopend");
    await buffer.flush();
    buffer.add("e:app-geopend");
    now += 1000;
    await buffer.flush();
    expect(doFetch).toHaveBeenCalledTimes(1);
    now += 5000;
    await buffer.flush();
    expect(doFetch).toHaveBeenCalledTimes(2);
  });

  it("zonder opslag: niets bewaren en de buffer niet laten groeien", async () => {
    const buffer = createCounterBuffer({ config: () => null });
    buffer.add("e:app-geopend");
    await buffer.flush();
    expect(buffer.pending().size).toBe(0);
  });
});
