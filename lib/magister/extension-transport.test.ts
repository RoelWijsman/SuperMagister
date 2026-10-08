import { describe, expect, it, vi } from "vitest";
import { createExtensionTransport, MagisterError } from "./transport";

const requester = (answer: unknown) => ({
  request: vi.fn(async () => (answer instanceof Error ? Promise.reject(answer) : answer)),
});

describe("createExtensionTransport", () => {
  it("laat de extensie het verzoek doen, zonder token in de app", async () => {
    const bridge = requester({ ok: true, data: { Persoon: { Id: 1002 } } });
    const transport = createExtensionTransport({ bridge: () => bridge });
    expect(transport.kind).toBe("extensie");
    expect(await transport.get("account")).toEqual({ Persoon: { Id: 1002 } });
    expect(bridge.request).toHaveBeenCalledWith(
      "get",
      { path: "account", query: undefined },
      expect.any(Number),
    );
  });

  it("geeft de query mee", async () => {
    const bridge = requester({ ok: true, data: [] });
    await createExtensionTransport({ bridge: () => bridge }).get("personen/1/afspraken", {
      van: "2026-10-05",
      tot: "2026-10-11",
    });
    expect(bridge.request).toHaveBeenCalledWith(
      "get",
      { path: "personen/1/afspraken", query: { van: "2026-10-05", tot: "2026-10-11" } },
      expect.any(Number),
    );
  });

  it("vertaalt de foutcodes van de extensie", async () => {
    const cases: [Record<string, unknown>, string][] = [
      [{ ok: false, fout: "verlopen", status: 401 }, "verlopen"],
      [{ ok: false, fout: "geen-sessie" }, "geen-sessie"],
      [{ ok: false, fout: "geen-toegang", status: 403 }, "geen-toegang"],
      [{ ok: false, fout: "niet-gevonden", status: 404 }, "niet-gevonden"],
      [{ ok: false, fout: "magister-plat", status: 502 }, "server"],
      [{ ok: false, fout: "timeout" }, "netwerk"],
      [{ ok: false, fout: "geen-extensie" }, "geen-extensie"],
      [{ ok: false, fout: "iets-nieuws" }, "server"],
    ];
    for (const [answer, code] of cases) {
      await expect(
        createExtensionTransport({ bridge: () => requester(answer) }).get("account"),
      ).rejects.toMatchObject({ code });
    }
    const error = await createExtensionTransport({
      bridge: () => requester({ ok: false, fout: "te-vaak", status: 429, opnieuwNa: 30 }),
    })
      .get("account")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MagisterError);
    expect(error).toMatchObject({ code: "te-vaak", retryAfter: 30 });
  });

  it("zegt het eerlijk als de extensie er niet (meer) is", async () => {
    await expect(
      createExtensionTransport({ bridge: () => null }).get("account"),
    ).rejects.toMatchObject({
      code: "geen-extensie",
    });
    await expect(
      createExtensionTransport({ bridge: () => requester(new Error("time-out")) }).get("account"),
    ).rejects.toMatchObject({ code: "geen-extensie" });
  });

  it("weigert een vreemd pad al in de app", async () => {
    const bridge = requester({ ok: true, data: {} });
    await expect(
      createExtensionTransport({ bridge: () => bridge }).get("../account"),
    ).rejects.toMatchObject({ code: "ongeldig-pad" });
    expect(bridge.request).not.toHaveBeenCalled();
  });
});
