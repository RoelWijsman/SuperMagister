import { SCHOOL_HOST, type MagisterSession } from "@/lib/magister/transport";
import { TOKEN_PATTERN } from "./fragment";

/**
 * De token-afhandeling van SuperMagister, achter één interface. Alles wat met
 * je Magister-sessie te maken heeft (bewaren, verlopen, opnieuw koppelen,
 * vernieuwen) loopt hierdoor; de rest van de app vraagt alleen `get()`.
 *
 * - Het token staat alleen in sessionStorage van dit tabblad (en in het
 *   geheugen). Nooit in localStorage, nooit op een server.
 * - Open tabbladen van de app delen de sessie via een BroadcastChannel (alleen
 *   binnen hetzelfde domein): een nieuw tabblad vraagt erom, opnieuw koppelen
 *   en ontkoppelen gelden overal tegelijk.
 * - Hoe je koppelde (bookmarklet of
 *   plakveld) maakt verder niets uit, ook niet voor het welkomstpack.
 */

export type LinkMethod = "bookmarklet" | "plakken" | "voorbeeld";

export interface LinkedSession extends MagisterSession {
  method: LinkMethod;
}

export type SessionStatus = "geen" | "geldig" | "bijna-verlopen" | "verlopen";

/** Zo lang van tevoren melden we dat de koppeling bijna verloopt. */
export const WARN_BEFORE_MS = 5 * 60_000;

export const SESSION_KEY = "sm-sessie";
/** Het BroadcastChannel waarop tabbladen de sessie delen. */
export const SESSION_CHANNEL = "sm-sessie";

export function sessionStatus(
  session: LinkedSession | null,
  now: number,
  rejected = false,
): SessionStatus {
  if (!session) return "geen";
  if (rejected) return "verlopen";
  if (session.expiresAt === null) return "geldig";
  if (session.expiresAt <= now) return "verlopen";
  return session.expiresAt - now <= WARN_BEFORE_MS ? "bijna-verlopen" : "geldig";
}

export interface SessionSnapshot {
  session: LinkedSession | null;
  /** Magister zei 401 op dit token: hij werkt niet meer, wat expires_at ook zegt. */
  rejected: boolean;
}

export interface SessionStore {
  get(): LinkedSession | null;
  snapshot(): SessionSnapshot;
  set(session: LinkedSession): void;
  clear(): void;
  reject(token: string): void;
  subscribe(listener: () => void): () => void;
  dispose(): void;
}

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SessionChannel {
  postMessage(data: unknown): void;
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  close(): void;
}

type Message =
  | { type: "vraag" }
  | { type: "sessie"; session: LinkedSession }
  | { type: "antwoord"; session: LinkedSession; rejected: boolean }
  | { type: "afgewezen"; token: string }
  | { type: "weg" };

const METHODS: ReadonlySet<string> = new Set(["bookmarklet", "plakken", "voorbeeld"]);

/** Alles wat van buiten komt (opslag, ander tabblad) eerst controleren. */
function validSession(value: unknown): LinkedSession | null {
  if (!value || typeof value !== "object") return null;
  const { token, schoolHost, expiresAt, method } = value as Record<string, unknown>;
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) return null;
  if (typeof schoolHost !== "string" || !SCHOOL_HOST.test(schoolHost)) return null;
  if (expiresAt !== null && (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)))
    return null;
  if (typeof method !== "string" || !METHODS.has(method)) return null;
  return { token, schoolHost, expiresAt, method: method as LinkMethod };
}

export function createSessionStore({
  storage,
  channel = null,
}: {
  storage: SessionStorageLike | null;
  channel?: SessionChannel | null;
}): SessionStore {
  const listeners = new Set<() => void>();
  let state: SessionSnapshot = { session: load(), rejected: false };

  function load(): LinkedSession | null {
    try {
      const raw = storage?.getItem(SESSION_KEY);
      return raw ? validSession(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  function save(session: LinkedSession | null) {
    try {
      if (session) storage?.setItem(SESSION_KEY, JSON.stringify(session));
      else storage?.removeItem(SESSION_KEY);
    } catch {
      // Geen opslag (privévenster): dan alleen in het geheugen.
    }
  }

  function update(next: SessionSnapshot) {
    if (next.session !== state.session) save(next.session);
    state = next;
    for (const listener of listeners) listener();
  }

  function post(message: Message) {
    try {
      channel?.postMessage(message);
    } catch {
      // Een gesloten kanaal is geen ramp: dan deelt dit tabblad even niet.
    }
  }

  const expiry = (session: LinkedSession) => session.expiresAt ?? 0;

  channel?.addEventListener("message", ({ data }) => {
    if (!data || typeof data !== "object") return;
    const message = data as Message;
    const current = state.session;
    switch (message.type) {
      case "vraag":
        if (current) post({ type: "antwoord", session: current, rejected: state.rejected });
        return;
      case "sessie": {
        const incoming = validSession(message.session);
        if (incoming) update({ session: incoming, rejected: false });
        return;
      }
      case "antwoord": {
        const incoming = validSession(message.session);
        if (!incoming) return;
        const rejected = message.rejected === true;
        if (!current) update({ session: incoming, rejected });
        else if (incoming.token === current.token) {
          if (rejected && !state.rejected) update({ session: current, rejected: true });
        } else if (!rejected && (state.rejected || expiry(incoming) > expiry(current))) {
          update({ session: incoming, rejected: false });
        }
        return;
      }
      case "afgewezen":
        if (current && message.token === current.token && !state.rejected)
          update({ session: current, rejected: true });
        return;
      case "weg":
        if (current) update({ session: null, rejected: false });
        return;
    }
  });
  // Een nieuw tabblad vraagt of er al ergens een sessie is.
  post({ type: "vraag" });

  return {
    get: () => state.session,
    snapshot: () => state,
    set(session) {
      const clean = validSession(session);
      if (!clean) throw new Error("Ongeldige sessie.");
      update({ session: clean, rejected: false });
      post({ type: "sessie", session: clean });
    },
    clear() {
      update({ session: null, rejected: false });
      post({ type: "weg" });
    },
    reject(token) {
      const current = state.session;
      if (!current || current.token !== token || state.rejected) return;
      update({ session: current, rejected: true });
      post({ type: "afgewezen", token });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      listeners.clear();
      channel?.close();
    },
  };
}
