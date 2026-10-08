import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { proxyToMagister } from "./proxy";

const TOKEN = "eyJ.geheim-token.123";

function request(
  path = "/api/magister/personen/42/afspraken?van=2026-10-05&tot=2026-10-11",
  headers: Record<string, string> = {},
  method = "GET",
) {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "x-magister-school": "noorderlicht.magister.net",
      cookie: "sessie=van-supermagister",
      ...headers,
    },
  });
}

function upstream(
  status: number,
  body: unknown = { Items: [] },
  headers: Record<string, string> = {},
) {
  return vi.fn(
    async () =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json; charset=utf-8", ...headers },
      }),
  );
}

const SEGMENTS = ["personen", "42", "afspraken"];

afterEach(() => vi.restoreAllMocks());

describe("proxyToMagister", () => {
  it("stuurt een GET door naar de eigen school, met alleen het token en Accept", async () => {
    const fetch = upstream(200, { Items: [{ Id: 1 }] });
    const response = await proxyToMagister(request(), SEGMENTS, fetch);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "https://noorderlicht.magister.net/api/personen/42/afspraken?van=2026-10-05&tot=2026-10-11",
    );
    expect(init).toMatchObject({ method: "GET", redirect: "manual", cache: "no-store" });
    expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}`, Accept: "application/json" });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ Items: [{ Id: 1 }] });
  });

  it("weigert alles behalve GET", async () => {
    const fetch = upstream(200);
    const response = await proxyToMagister(request(undefined, {}, "POST"), SEGMENTS, fetch);
    expect(response.status).toBe(405);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    "evil.example.com",
    "noorderlicht.magister.net.evil.com",
    "NOORDERLICHT.magister.net",
    "noord_licht.magister.net",
    "magister.net",
    "a.b.magister.net",
    "",
  ])("weigert school %j zonder Magister te vragen", async (school) => {
    const fetch = upstream(200);
    const response = await proxyToMagister(
      request(undefined, { "x-magister-school": school }),
      SEGMENTS,
      fetch,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ fout: "ongeldige-school" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("weigert paden die ergens anders heen willen", async () => {
    const fetch = upstream(200);
    for (const segments of [["..", "geheim"], ["personen", "42?x=1"], [], ["a/b"], ["%2e%2e"]]) {
      const response = await proxyToMagister(request(), segments, fetch);
      expect(response.status).toBe(400);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("vraagt niets zonder (geldig) token", async () => {
    const fetch = upstream(200);
    const zonder = await proxyToMagister(
      request(undefined, { authorization: "" }),
      SEGMENTS,
      fetch,
    );
    expect(zonder.status).toBe(401);
    expect(await zonder.json()).toMatchObject({ fout: "geen-token" });
    const raar = await proxyToMagister(
      request(undefined, { authorization: "Basic dXNlcjpwYXNz" }),
      SEGMENTS,
      fetch,
    );
    expect(raar.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [401, 401, "verlopen"],
    [403, 403, "geen-toegang"],
    [404, 404, "niet-gevonden"],
    [500, 502, "magister-plat"],
    [503, 502, "magister-plat"],
  ])("vertaalt Magister %i naar %i (%s)", async (status, expected, fout) => {
    const response = await proxyToMagister(
      request(),
      SEGMENTS,
      upstream(status, "<html>oeps</html>"),
    );
    expect(response.status).toBe(expected);
    const body = await response.json();
    expect(body).toMatchObject({ fout });
    expect(JSON.stringify(body)).not.toContain(TOKEN);
  });

  it("remt per IP-adres, zonder Magister lastig te vallen", async () => {
    const fetch = upstream(200);
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => 0 });
    const from = (ip: string) => request(undefined, { "x-forwarded-for": ip });
    expect((await proxyToMagister(from("1.2.3.4"), SEGMENTS, fetch, limiter)).status).toBe(200);
    expect((await proxyToMagister(from("1.2.3.4"), SEGMENTS, fetch, limiter)).status).toBe(200);
    const blocked = await proxyToMagister(from("1.2.3.4"), SEGMENTS, fetch, limiter);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("60");
    expect(await blocked.json()).toMatchObject({ fout: "te-vaak", opnieuwNa: 60 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect((await proxyToMagister(from("5.6.7.8"), SEGMENTS, fetch, limiter)).status).toBe(200);
  });

  it("geeft bij 429 door wanneer je het opnieuw mag proberen", async () => {
    const response = await proxyToMagister(
      request(),
      SEGMENTS,
      upstream(429, "", { "retry-after": "120" }),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("120");
    expect(await response.json()).toMatchObject({ fout: "te-vaak", opnieuwNa: 120 });
  });

  it("ziet een doorverwijzing (naar het inlogscherm) als een verlopen sessie", async () => {
    const response = await proxyToMagister(
      request(),
      SEGMENTS,
      upstream(302, "", { location: "https://accounts.magister.net/" }),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ fout: "verlopen" });
  });

  it("zegt 'netwerk' of 'timeout' als Magister niet antwoordt", async () => {
    const kapot = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    expect((await proxyToMagister(request(), SEGMENTS, kapot)).status).toBe(502);
    const traag = vi.fn(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    const response = await proxyToMagister(request(), SEGMENTS, traag);
    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ fout: "timeout" });
  });

  it("logt nooit iets en geeft geen cookies of andere headers door", async () => {
    const log = vi.spyOn(console, "log");
    const error = vi.spyOn(console, "error");
    const warn = vi.spyOn(console, "warn");
    const fetch = upstream(200, { ok: true }, { "set-cookie": "magister=sessie" });
    const response = await proxyToMagister(request(), SEGMENTS, fetch);
    await proxyToMagister(request(), SEGMENTS, upstream(500));
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.stringify(init.headers)).not.toContain("sessie=van-supermagister");
  });
});
