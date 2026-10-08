import { describe, expect, it, vi } from "vitest";
import {
  createSessionStore,
  sessionStatus,
  SESSION_KEY,
  type LinkedSession,
  type SessionChannel,
} from "./session";

const NOW = Date.UTC(2026, 9, 7, 12, 0);
const TOKEN_A = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJhIn0.aGFuZHRla2VuaW5nLWE";
const TOKEN_B = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJiIn0.aGFuZHRla2VuaW5nLWI";

const session = (extra: Partial<LinkedSession> = {}): LinkedSession => ({
  token: TOKEN_A,
  schoolHost: "voorbeeld.magister.net",
  expiresAt: NOW + 60 * 60_000,
  method: "bookmarklet",
  ...extra,
});

class MemoryStorage {
  items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}

/** Een nagebootst BroadcastChannel: alle kanalen op dezelfde hub horen elkaar. */
function hub() {
  const channels = new Set<FakeChannel>();
  class FakeChannel implements SessionChannel {
    listener: ((event: { data: unknown }) => void) | null = null;
    constructor() {
      channels.add(this);
    }
    postMessage(data: unknown) {
      for (const other of channels) if (other !== this) other.listener?.({ data });
    }
    addEventListener(_type: "message", listener: (event: { data: unknown }) => void) {
      this.listener = listener;
    }
    close() {
      channels.delete(this);
    }
  }
  return () => new FakeChannel();
}

describe("sessionStatus", () => {
  it("kent geen, geldig, bijna verlopen en verlopen", () => {
    expect(sessionStatus(null, NOW)).toBe("geen");
    expect(sessionStatus(session(), NOW)).toBe("geldig");
    expect(sessionStatus(session({ expiresAt: NOW + 4 * 60_000 }), NOW)).toBe("bijna-verlopen");
    expect(sessionStatus(session({ expiresAt: NOW - 1 }), NOW)).toBe("verlopen");
  });

  it("is verlopen na een 401, ook als expires_at nog in de toekomst ligt", () => {
    expect(sessionStatus(session(), NOW, true)).toBe("verlopen");
  });

  it("weet bij een onbekend verloopmoment alleen wat een 401 zegt", () => {
    expect(sessionStatus(session({ expiresAt: null }), NOW)).toBe("geldig");
  });
});

describe("createSessionStore", () => {
  it("bewaart de sessie in sessionStorage en leest hem terug", () => {
    const storage = new MemoryStorage();
    const first = createSessionStore({ storage, now: () => NOW });
    first.set(session());
    expect(JSON.parse(storage.getItem(SESSION_KEY)!)).toMatchObject({ token: TOKEN_A });
    const again = createSessionStore({ storage, now: () => NOW });
    expect(again.get()).toEqual(session());
  });

  it("negeert rommel of een verkeerde school in de opslag", () => {
    const storage = new MemoryStorage();
    storage.setItem(SESSION_KEY, "{kapot");
    expect(createSessionStore({ storage, now: () => NOW }).get()).toBeNull();
    storage.setItem(SESSION_KEY, JSON.stringify(session({ schoolHost: "evil.com" })));
    expect(createSessionStore({ storage, now: () => NOW }).get()).toBeNull();
  });

  it("meldt elke wijziging aan wie luistert", () => {
    const store = createSessionStore({ storage: new MemoryStorage(), now: () => NOW });
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    store.set(session());
    store.reject(TOKEN_A);
    store.clear();
    expect(listener).toHaveBeenCalledTimes(3);
    stop();
    store.set(session());
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("onthoudt een 401 alleen voor dat ene token", () => {
    const store = createSessionStore({ storage: new MemoryStorage(), now: () => NOW });
    store.set(session());
    store.reject(TOKEN_B);
    expect(store.snapshot().rejected).toBe(false);
    store.reject(TOKEN_A);
    expect(store.snapshot().rejected).toBe(true);
    store.set(session({ token: TOKEN_B }));
    expect(store.snapshot().rejected).toBe(false);
  });

  it("wist alles bij ontkoppelen", () => {
    const storage = new MemoryStorage();
    const store = createSessionStore({ storage, now: () => NOW });
    store.set(session());
    store.clear();
    expect(store.get()).toBeNull();
    expect(storage.getItem(SESSION_KEY)).toBeNull();
  });

  describe("tussen tabbladen", () => {
    it("krijgt een nieuw tabblad de sessie van een open tabblad", () => {
      const channel = hub();
      const old = createSessionStore({
        storage: new MemoryStorage(),
        channel: channel(),
        now: () => NOW,
      });
      old.set(session());
      const fresh = createSessionStore({
        storage: new MemoryStorage(),
        channel: channel(),
        now: () => NOW,
      });
      expect(fresh.get()).toEqual(session());
    });

    it("krijgt een tabblad met een verlopen token het nieuwe token na opnieuw koppelen", () => {
      const channel = hub();
      const a = createSessionStore({
        storage: new MemoryStorage(),
        channel: channel(),
        now: () => NOW,
      });
      const b = createSessionStore({
        storage: new MemoryStorage(),
        channel: channel(),
        now: () => NOW,
      });
      a.set(session());
      a.reject(TOKEN_A);
      expect(b.snapshot().rejected).toBe(true);
      b.set(session({ token: TOKEN_B, expiresAt: NOW + 2 * 60 * 60_000 }));
      expect(a.get()?.token).toBe(TOKEN_B);
      expect(a.snapshot().rejected).toBe(false);
    });

    it("ontkoppelt in alle tabbladen tegelijk", () => {
      const channel = hub();
      const a = createSessionStore({
        storage: new MemoryStorage(),
        channel: channel(),
        now: () => NOW,
      });
      const b = createSessionStore({
        storage: new MemoryStorage(),
        channel: channel(),
        now: () => NOW,
      });
      a.set(session());
      expect(b.get()).not.toBeNull();
      b.clear();
      expect(a.get()).toBeNull();
    });

    it("negeert berichten met een ongeldige sessie", () => {
      const channel = hub();
      const store = createSessionStore({
        storage: new MemoryStorage(),
        channel: channel(),
        now: () => NOW,
      });
      channel().postMessage({ type: "sessie", session: session({ schoolHost: "evil.com" }) });
      channel().postMessage({ type: "sessie", session: { token: 42 } });
      channel().postMessage("onzin");
      expect(store.get()).toBeNull();
    });
  });

  describe("vernieuwen (voor de extensie in 5c)", () => {
    it("vernieuwt niet vanzelf zonder extensie: dan moet je opnieuw koppelen", async () => {
      const store = createSessionStore({ storage: new MemoryStorage(), now: () => NOW });
      store.set(session());
      expect(store.autoRenews()).toBe(false);
      expect(await store.renew()).toBe(false);
    });

    it("laat een bron die zelf vernieuwt het token stil vervangen", async () => {
      const store = createSessionStore({ storage: new MemoryStorage(), now: () => NOW });
      store.set(session());
      store.reject(TOKEN_A);
      store.setRenewer({
        method: "extensie",
        renew: async () => ({
          token: TOKEN_B,
          schoolHost: "voorbeeld.magister.net",
          expiresAt: NOW + 3_600_000,
        }),
      });
      expect(store.autoRenews()).toBe(true);
      expect(await store.renew()).toBe(true);
      expect(store.get()).toMatchObject({ token: TOKEN_B, method: "extensie" });
      expect(store.snapshot().rejected).toBe(false);
    });

    it("valt terug op opnieuw koppelen als vernieuwen mislukt", async () => {
      const store = createSessionStore({ storage: new MemoryStorage(), now: () => NOW });
      store.setRenewer({ method: "extensie", renew: async () => null });
      expect(await store.renew()).toBe(false);
      store.setRenewer({
        method: "extensie",
        renew: async () => {
          throw new Error("extensie weg");
        },
      });
      expect(await store.renew()).toBe(false);
    });
  });
});
