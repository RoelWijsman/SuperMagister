import { describe, expect, it } from "vitest";
import type { LinkedSession } from "@/lib/koppelen/session";
import type { LinkedAccount } from "@/stores/connection";
import type { ExtensionStatus } from "./protocol";
import { decideSync, EXTENSION_TOKEN } from "./sync";

const NOW = Date.UTC(2026, 9, 8, 12, 0);

const status = (extra: Partial<ExtensionStatus> = {}): ExtensionStatus => ({
  linked: true,
  schoolHost: "voorbeeld.magister.net",
  expiresAt: NOW + 3_600_000,
  paused: false,
  needsLogin: false,
  renewing: false,
  unlinkedAt: null,
  version: "0.5.0",
  personId: 1002,
  ...extra,
});

const account: LinkedAccount = {
  schoolHost: "voorbeeld.magister.net",
  personId: 1002,
  name: "Daan Visser",
  linkedAt: new Date(NOW - 86_400_000).toISOString(),
};

const extensionSession = (extra: Partial<LinkedSession> = {}): LinkedSession => ({
  token: EXTENSION_TOKEN,
  schoolHost: "voorbeeld.magister.net",
  expiresAt: NOW + 3_600_000,
  method: "extensie",
  ...extra,
});

describe("decideSync", () => {
  it("koppelt vanzelf als de extensie gekoppeld is en de app nog niet", () => {
    expect(decideSync({ status: status(), account: null, session: null })).toEqual({
      action: "koppelen",
      session: {
        token: EXTENSION_TOKEN,
        schoolHost: "voorbeeld.magister.net",
        expiresAt: NOW + 3_600_000,
      },
    });
  });

  it("stapt over op de extensie als je eerst met de bladwijzer koppelde", () => {
    const bookmarklet = {
      ...extensionSession(),
      token: "eyJ.echt.token-van-de-bladwijzer",
      method: "bookmarklet" as const,
    };
    expect(decideSync({ status: status(), account, session: bookmarklet }).action).toBe("koppelen");
  });

  it("koppelt opnieuw als de extensie een ander account heeft", () => {
    expect(
      decideSync({ status: status({ personId: 2001 }), account, session: extensionSession() })
        .action,
    ).toBe("koppelen");
    expect(
      decideSync({
        status: status({ schoolHost: "anders.magister.net" }),
        account,
        session: extensionSession(),
      }).action,
    ).toBe("koppelen");
  });

  it("werkt alleen het verloopmoment bij als alles al klopt", () => {
    expect(
      decideSync({
        status: status({ expiresAt: NOW + 7_200_000 }),
        account,
        session: extensionSession(),
      }),
    ).toEqual({ action: "sessie", session: extensionSession({ expiresAt: NOW + 7_200_000 }) });
    expect(decideSync({ status: status(), account, session: extensionSession() })).toEqual({
      action: "niets",
    });
  });

  it("ontkoppelt de app als je na je laatste koppeling in de extensie ontkoppelde", () => {
    expect(
      decideSync({
        status: status({ linked: false, paused: true, unlinkedAt: NOW }),
        account,
        session: extensionSession(),
      }).action,
    ).toBe("ontkoppelen");
  });

  it("laat een latere koppeling (bijv. met de bladwijzer) staan als de extensie op pauze staat", () => {
    const later = { ...account, linkedAt: new Date(NOW + 1000).toISOString() };
    expect(
      decideSync({
        status: status({ linked: false, paused: true, unlinkedAt: NOW }),
        account: later,
        session: null,
      }).action,
    ).toBe("pauze");
  });

  it("wacht rustig als de extensie (nog) geen token heeft", () => {
    expect(
      decideSync({ status: status({ linked: false }), account, session: extensionSession() })
        .action,
    ).toBe("niets");
  });
});
