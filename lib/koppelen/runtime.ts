"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { idbGet, idbSet } from "@/lib/idb";
import type { CacheBackend, LockFn } from "@/lib/magister/cache";
import {
  createSessionStore,
  sessionStatus,
  SESSION_CHANNEL,
  WARN_BEFORE_MS,
  type SessionSnapshot,
  type SessionStatus,
  type SessionStore,
} from "./session";

/**
 * De koppeling in de browser: één sessie-opslag voor de hele app, plus het
 * slot en de cache-opslag die tabbladen met elkaar delen.
 */

const EMPTY: SessionSnapshot = { session: null, rejected: false };

/** Op de server is er nooit een sessie. */
const serverStore: SessionStore = {
  get: () => null,
  snapshot: () => EMPTY,
  set: () => undefined,
  clear: () => undefined,
  reject: () => undefined,
  subscribe: () => () => undefined,
  autoRenews: () => false,
  setRenewer: () => undefined,
  renew: async () => false,
  dispose: () => undefined,
};

let store: SessionStore | null = null;

function safeSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** De sessie-opslag van dit tabblad. De extensie (5c) meldt zich hier met setRenewer. */
export function getSessionStore(): SessionStore {
  if (typeof window === "undefined") return serverStore;
  store ??= createSessionStore({
    storage: safeSessionStorage(),
    channel: typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(SESSION_CHANNEL),
  });
  return store;
}

export function useSession(): SessionSnapshot {
  const current = getSessionStore();
  return useSyncExternalStore(current.subscribe, current.snapshot, () => EMPTY);
}

const MAX_TIMEOUT = 2 ** 31 - 1;

/** Geldig, bijna verlopen of verlopen; schuift vanzelf door als de tijd verstrijkt. */
export function useSessionStatus(): SessionStatus {
  const { session, rejected } = useSession();
  const [now, setNow] = useState(0);
  const expiresAt = session?.expiresAt ?? null;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Meteen kijken, en opnieuw op de omslagpunten: 5 minuten ervoor en bij verlopen.
    const timers = [setTimeout(tick, 0)];
    if (expiresAt !== null && !rejected) {
      const current = Date.now();
      for (const moment of [expiresAt - WARN_BEFORE_MS, expiresAt]) {
        if (moment > current)
          timers.push(setTimeout(tick, Math.min(moment - current + 50, MAX_TIMEOUT)));
      }
    }
    // Na het slapen van een laptop klopt de timer niet meer: kijk opnieuw als je terugkomt.
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      for (const timer of timers) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [expiresAt, rejected]);

  return sessionStatus(session, now, rejected);
}

/** navigator.locks waar het kan: tabbladen wachten op elkaar. */
export const browserLock: LockFn = <T>(name: string, task: () => Promise<T>) =>
  typeof navigator !== "undefined" && navigator.locks
    ? (navigator.locks.request(name, task) as Promise<T>)
    : task();

/** De cache staat in IndexedDB onder "cache:{bron}|…". */
export const idbCache: CacheBackend = {
  get: (key) => idbGet(`cache:${key}`),
  set: (key, entry) => idbSet(`cache:${key}`, entry),
};
