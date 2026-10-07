import { describe, expect, it, vi } from "vitest";
import { createMagisterClient } from "./client";
import { createTransport, TRANSPORT } from "./config";
import { ENDPOINTS } from "./endpoints";
import {
  createProxyTransport,
  MagisterError,
  type MagisterSession,
  type MagisterTransport,
} from "./transport";

const session: MagisterSession = {
  schoolHost: "noorderlicht.magister.net",
  token: "geheim-token-123",
  expiresAt: null,
};

function fakeFetch(response: Partial<Response> & { json?: () => Promise<unknown> } = {}) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ Items: [] }),
    ...response,
  })) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

describe("ENDPOINTS", () => {
  it("kent de paden uit de opdracht", () => {
    expect(ENDPOINTS.account()).toEqual({ path: "account" });
    expect(ENDPOINTS.latestGrades(42)).toEqual({
      path: "personen/42/cijfers/laatste",
      query: { top: 50, skip: 0 },
    });
    expect(ENDPOINTS.appointments(42, { from: "2026-10-05", to: "2026-10-11" })).toEqual({
      path: "personen/42/afspraken",
      query: { van: "2026-10-05", tot: "2026-10-11" },
    });
    expect(ENDPOINTS.enrollments(42)).toEqual({
      path: "personen/42/aanmeldingen",
      query: { geenToekomstige: false },
    });
    expect(ENDPOINTS.gradePeriods(42, 7).path).toBe(
      "personen/42/aanmeldingen/7/cijfers/cijferperiodenvooraanmelding",
    );
    expect(ENDPOINTS.progressGrades(7)).toEqual({ path: "aanmeldingen/7/cijfers" });
    expect(ENDPOINTS.subjects(42, 7).path).toBe("personen/42/aanmeldingen/7/vakken");
    expect(ENDPOINTS.scheduleChanges(42, { from: "2026-10-05", to: "2026-10-11" })).toEqual({
      path: "personen/42/roosterwijzigingen",
      query: { van: "2026-10-05", tot: "2026-10-11" },
    });
    expect(ENDPOINTS.gradeOverview(42, 7)).toEqual({
      path: "personen/42/aanmeldingen/7/cijfers/cijferoverzichtvooraanmelding",
      query: { actievePerioden: false, alleenBerekendeKolommen: false, alleenPTAKolommen: false },
    });
    expect(ENDPOINTS.absences(42, { from: "2026-08-24", to: "2026-10-07" })).toEqual({
      path: "personen/42/absenties",
      query: { van: "2026-08-24", tot: "2026-10-07" },
    });
  });
});

describe("createProxyTransport", () => {
  it("vraagt via de eigen proxy, met token en school in de headers", async () => {
    const fetch = fakeFetch();
    const transport = createProxyTransport({ session: () => session, fetch });
    await transport.get("personen/42/afspraken", { van: "2026-10-05", tot: "2026-10-11" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/magister/personen/42/afspraken?van=2026-10-05&tot=2026-10-11",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer geheim-token-123",
          "X-Magister-School": "noorderlicht.magister.net",
        },
      }),
    );
  });

  it("weigert een school die geen magister.net is, zonder te vragen", async () => {
    const fetch = fakeFetch();
    const transport = createProxyTransport({
      session: () => ({ ...session, schoolHost: "evil.example.com" }),
      fetch,
    });
    await expect(transport.get("account")).rejects.toMatchObject({ code: "ongeldige-school" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("weigert paden die buiten de API willen", async () => {
    const fetch = fakeFetch();
    const transport = createProxyTransport({ session: () => session, fetch });
    for (const path of ["../geheim", "/account", "https://evil.example.com", "personen/1?x=y"]) {
      await expect(transport.get(path)).rejects.toMatchObject({ code: "ongeldig-pad" });
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("zegt 'geen-sessie' zonder token, en 'verlopen' bij een verlopen token", async () => {
    const fetch = fakeFetch();
    await expect(
      createProxyTransport({ session: () => null, fetch }).get("account"),
    ).rejects.toMatchObject({ code: "geen-sessie" });
    await expect(
      createProxyTransport({
        session: () => ({ ...session, expiresAt: Date.now() - 1000 }),
        fetch,
      }).get("account"),
    ).rejects.toMatchObject({ code: "verlopen" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("vertaalt HTTP-fouten, en zet het token nooit in een foutmelding", async () => {
    const cases: [number, string][] = [
      [401, "verlopen"],
      [403, "geen-toegang"],
      [404, "niet-gevonden"],
      [429, "te-vaak"],
      [502, "server"],
    ];
    for (const [status, code] of cases) {
      const transport = createProxyTransport({
        session: () => session,
        fetch: fakeFetch({ ok: false, status }),
      });
      const error = (await transport.get("account").catch((e: unknown) => e)) as MagisterError;
      expect(error).toBeInstanceOf(MagisterError);
      expect(error.code).toBe(code);
      expect(error.status).toBe(status);
      expect(error.message).not.toContain(session.token);
    }
  });

  it("leest de foutcode van de proxy, en wanneer je het opnieuw mag proberen", async () => {
    const transport = createProxyTransport({
      session: () => session,
      fetch: fakeFetch({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "120" }),
        json: async () => ({ fout: "te-vaak", opnieuwNa: 120 }),
      }),
    });
    const error = (await transport.get("account").catch((e: unknown) => e)) as MagisterError;
    expect(error).toMatchObject({ code: "te-vaak", status: 429, retryAfter: 120 });

    const plat = createProxyTransport({
      session: () => session,
      fetch: fakeFetch({ ok: false, status: 502, json: async () => ({ fout: "magister-plat" }) }),
    });
    await expect(plat.get("account")).rejects.toMatchObject({ code: "server", status: 502 });
  });

  it("zegt 'netwerk' als de verbinding wegvalt", async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof globalThis.fetch;
    await expect(
      createProxyTransport({ session: () => session, fetch }).get("account"),
    ).rejects.toMatchObject({ code: "netwerk" });
  });
});

describe("één plek om te wisselen", () => {
  it("gebruikt standaard de proxy", () => {
    expect(TRANSPORT).toBe("proxy");
    expect(createTransport(() => session).kind).toBe("proxy");
  });

  it("kan naar de browserextensie, die er nog niet is", async () => {
    const transport = createTransport(() => session, "extensie");
    expect(transport.kind).toBe("extensie");
    await expect(transport.get("account")).rejects.toMatchObject({ code: "geen-extensie" });
  });
});

describe("createMagisterClient", () => {
  it("praat alleen via de transport, dus wisselen raakt de rest niet", async () => {
    const get = vi.fn(async () => ({ ok: true }));
    const transport = { kind: "proxy", get } as unknown as MagisterTransport;
    const client = createMagisterClient(transport);
    await client.account();
    await client.appointments(42, { from: "2026-10-05", to: "2026-10-11" });
    await client.gradeOverview(42, 7);
    expect(get.mock.calls).toEqual([
      ["account", undefined],
      ["personen/42/afspraken", { van: "2026-10-05", tot: "2026-10-11" }],
      [
        "personen/42/aanmeldingen/7/cijfers/cijferoverzichtvooraanmelding",
        { actievePerioden: false, alleenBerekendeKolommen: false, alleenPTAKolommen: false },
      ],
    ]);
  });
});
