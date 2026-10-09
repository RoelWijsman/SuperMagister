import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_HEADER,
  createSession,
  dashboardConfigFrom,
  SESSION_COOKIE,
  type DashboardConfig,
} from "./auth";

/** De tweede deur: elke pagina en route van het dashboard geeft zelf ook een 404. */

const state: { headers: Record<string, string>; cookies: Record<string, string> } = {
  headers: {},
  cookies: {},
};

vi.mock("next/headers", () => ({
  headers: async () => new Headers(state.headers),
  cookies: async () => ({
    get: (name: string) =>
      name in state.cookies ? { name, value: state.cookies[name] } : undefined,
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const ENV = {
  DEV_DASHBOARD_PATH: "/dev-k3v9x7q2abcd",
  DEV_DASHBOARD_PASSWORD: "een-heel-lang-wachtwoord",
  DEV_DASHBOARD_KEY: "sleutel-voor-de-deur-123",
};
const CONFIG = dashboardConfigFrom(ENV) as DashboardConfig;

const { requireAccess } = await import("./guard");

beforeEach(() => {
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
  state.headers = {};
  state.cookies = {};
});
afterEach(() => vi.unstubAllEnvs());

describe("requireAccess", () => {
  it("zonder de header van de proxy: 404", async () => {
    await expect(requireAccess("dashboard")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(requireAccess("inloggen")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("dashboard met header maar zonder geldige sessie: 404", async () => {
    state.headers = { [ACCESS_HEADER]: "dashboard" };
    await expect(requireAccess("dashboard")).rejects.toThrow("NEXT_NOT_FOUND");
    state.cookies = { [SESSION_COOKIE]: "v1.9999999999999.nep" };
    await expect(requireAccess("dashboard")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("de inlog-toegang opent het dashboard niet", async () => {
    state.headers = { [ACCESS_HEADER]: "inloggen" };
    await expect(requireAccess("dashboard")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(requireAccess("inloggen")).resolves.toEqual(CONFIG);
  });

  it("met header én geldige sessie: binnen", async () => {
    state.headers = { [ACCESS_HEADER]: "dashboard" };
    state.cookies = { [SESSION_COOKIE]: (await createSession(CONFIG)).value };
    await expect(requireAccess("dashboard")).resolves.toEqual(CONFIG);
  });

  it("zonder configuratie: altijd 404", async () => {
    vi.stubEnv("DEV_DASHBOARD_PATH", "");
    state.headers = { [ACCESS_HEADER]: "dashboard" };
    state.cookies = { [SESSION_COOKIE]: (await createSession(CONFIG)).value };
    await expect(requireAccess("dashboard")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
