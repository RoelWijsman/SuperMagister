import { describe, expect, it, vi } from "vitest";
import { loadExtensionScripts, runScripts } from "@/extension/test/load";
import { createBridge, type BridgeWindow } from "./bridge";
import { APP_REQUESTS, EXTENSION_MESSAGES, isExtensionMessage, PROTOCOL } from "./protocol";

const ORIGIN = "http://localhost:3000";

/** Een nagebootst venster: postMessage komt (net als in de browser) later aan bij alle luisteraars. */
function fakeWindow(origin = ORIGIN) {
  const listeners = new Set<(event: MessageEvent) => void>();
  const win = {
    location: { origin },
    top: null as unknown,
    postMessage(data: unknown, targetOrigin: string) {
      if (targetOrigin !== origin) return;
      queueMicrotask(() => {
        for (const listener of [...listeners])
          listener({ data, origin, source: win } as unknown as MessageEvent);
      });
    },
    addEventListener(_type: "message", listener: (event: MessageEvent) => void) {
      listeners.add(listener);
    },
    removeEventListener(_type: "message", listener: (event: MessageEvent) => void) {
      listeners.delete(listener);
    },
    /** Een bericht van een ander venster of domein. */
    inject(data: unknown, from: { origin?: string; source?: unknown } = {}) {
      for (const listener of [...listeners])
        listener({
          data,
          origin: from.origin ?? origin,
          source: from.source ?? win,
        } as MessageEvent);
    },
  };
  win.top = win;
  return win;
}

/** Het content script van de extensie, met een nagebootste chrome.runtime. */
function installExtension(
  win: ReturnType<typeof fakeWindow>,
  answers: (message: { type: string; payload?: unknown }) => unknown,
) {
  const sendMessage = vi.fn(async (message: { type: string; payload?: unknown }) =>
    answers(message),
  );
  const chrome = {
    runtime: {
      sendMessage,
      getManifest: () => ({ version: "0.5.0" }),
      connect: () => ({
        onMessage: { addListener: () => undefined },
        onDisconnect: { addListener: () => undefined },
      }),
    },
  };
  runScripts(["shared/protocol.js", "content/app.js"], { window: win, chrome, setTimeout });
  return { sendMessage };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("protocol", () => {
  it("is in de app en de extensie precies hetzelfde", () => {
    const SM = loadExtensionScripts<any>(["shared/protocol.js"]);
    expect({ ...SM.PROTOCOL }).toEqual(PROTOCOL);
    expect([...SM.APP_REQUESTS]).toEqual([...APP_REQUESTS]);
    expect([...SM.EXTENSION_MESSAGES]).toEqual([...EXTENSION_MESSAGES]);
  });

  it("herkent alleen berichten van de extensie in het vaste formaat", () => {
    const base = { source: "supermagister-extensie", version: 1, type: "status" };
    expect(isExtensionMessage(base)).toBe(true);
    expect(isExtensionMessage({ ...base, version: 2 })).toBe(false);
    expect(isExtensionMessage({ ...base, type: "token" })).toBe(false);
    expect(isExtensionMessage({ ...base, source: "supermagister-app" })).toBe(false);
  });
});

describe("de brug tussen app en extensie", () => {
  it("merkt dat er geen extensie is", async () => {
    const bridge = createBridge(fakeWindow() as unknown as BridgeWindow);
    expect(await bridge.detect(50)).toBe(false);
  });

  it("vindt de extensie en krijgt antwoord op een vraag", async () => {
    const win = fakeWindow();
    const { sendMessage } = installExtension(win, (message) =>
      message.type === "ping"
        ? { pong: true }
        : { linked: true, schoolHost: "voorbeeld.magister.net" },
    );
    const bridge = createBridge(win as unknown as BridgeWindow);
    expect(await bridge.detect()).toBe(true);
    expect(await bridge.request("status")).toMatchObject({ linked: true });
    expect(sendMessage).toHaveBeenLastCalledWith({
      kind: "app",
      type: "status",
      payload: undefined,
    });
  });

  it("geeft een Magister-verzoek door aan de background", async () => {
    const win = fakeWindow();
    const { sendMessage } = installExtension(win, () => ({
      ok: true,
      data: { Persoon: { Id: 1 } },
    }));
    const bridge = createBridge(win as unknown as BridgeWindow);
    expect(await bridge.request("get", { path: "account" })).toEqual({
      ok: true,
      data: { Persoon: { Id: 1 } },
    });
    expect(sendMessage).toHaveBeenCalledWith({
      kind: "app",
      type: "get",
      payload: { path: "account" },
    });
  });

  it("negeert berichten van andere vensters en domeinen", async () => {
    const win = fakeWindow();
    const bridge = createBridge(win as unknown as BridgeWindow);
    const listener = vi.fn();
    bridge.subscribe(listener);
    const message = { source: "supermagister-extensie", version: 1, type: "status", payload: {} };
    win.inject(message, { origin: "https://evil.example.com" });
    win.inject(message, { source: {} });
    expect(listener).not.toHaveBeenCalled();
    win.inject(message);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("laat de extensie vreemde vragen van de pagina negeren", async () => {
    const win = fakeWindow();
    const { sendMessage } = installExtension(win, () => ({ ok: true }));
    win.inject({ source: "supermagister-app", version: 1, id: "x", type: "token" });
    win.inject(
      { source: "supermagister-app", version: 1, id: "x", type: "status" },
      {
        origin: "https://evil.example.com",
      },
    );
    await Promise.resolve();
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
