import { isExtensionMessage, PROTOCOL, type AppRequest, type ExtensionMessage } from "./protocol";

/**
 * De app-kant van de brug naar de browserextensie. Berichten gaan via
 * window.postMessage naar het content script van de extensie op deze pagina;
 * alleen berichten van dit venster en dit domein tellen.
 */

export interface BridgeWindow {
  location: { origin: string };
  postMessage(message: unknown, targetOrigin: string): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
}

export type BridgeListener = (message: ExtensionMessage) => void;

export interface Bridge {
  /** Vraag iets aan de extensie. Faalt na `timeoutMs` als er geen antwoord komt. */
  request<T = unknown>(type: AppRequest, payload?: unknown, timeoutMs?: number): Promise<T>;
  /** Is de extensie er? (antwoordt hij op een ping) */
  detect(timeoutMs?: number): Promise<boolean>;
  /** Berichten die de extensie uit zichzelf stuurt (status, ontkoppeld, aanwezig). */
  subscribe(listener: BridgeListener): () => void;
  dispose(): void;
}

export class BridgeTimeout extends Error {
  constructor() {
    super("De extensie antwoordt niet.");
    this.name = "BridgeTimeout";
  }
}

let counter = 0;

export function createBridge(win: BridgeWindow): Bridge {
  const pending = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  const listeners = new Set<BridgeListener>();

  const onMessage = (event: MessageEvent) => {
    if (event.source !== (win as unknown) || event.origin !== win.location.origin) return;
    if (!isExtensionMessage(event.data)) return;
    const message = event.data;
    if (message.type === "antwoord") {
      const waiting = message.id ? pending.get(message.id) : undefined;
      if (!waiting) return;
      pending.delete(message.id!);
      clearTimeout(waiting.timer);
      waiting.resolve(message.payload);
      return;
    }
    for (const listener of listeners) listener(message);
  };
  win.addEventListener("message", onMessage);

  const request = <T>(type: AppRequest, payload?: unknown, timeoutMs = 20_000) =>
    new Promise<T>((resolve, reject) => {
      const id = `sm-${Date.now().toString(36)}-${++counter}`;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new BridgeTimeout());
      }, timeoutMs);
      pending.set(id, { resolve: resolve as (value: unknown) => void, reject, timer });
      win.postMessage(
        { source: PROTOCOL.APP, version: PROTOCOL.VERSION, id, type, payload },
        win.location.origin,
      );
    });

  return {
    request,
    async detect(timeoutMs = 800) {
      try {
        const answer = await request<{ pong?: boolean }>("ping", undefined, timeoutMs);
        return answer?.pong === true;
      } catch {
        return false;
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      win.removeEventListener("message", onMessage);
      for (const [, waiting] of pending) {
        clearTimeout(waiting.timer);
        waiting.reject(new BridgeTimeout());
      }
      pending.clear();
      listeners.clear();
    },
  };
}
