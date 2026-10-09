"use client";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useIsClient } from "@/lib/hooks";
import { browserLock, getSessionStore, idbCache } from "@/lib/koppelen/runtime";
import { withCache } from "@/lib/magister/cache";
import { createMagisterClient } from "@/lib/magister/client";
import { createTransport } from "@/lib/magister/config";
import { createMagisterSource, type MagisterSource } from "@/lib/magister/source";
import { MagisterError } from "@/lib/magister/transport";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useConnection } from "@/stores/connection";
import { useOnboarding } from "@/stores/onboarding";
import { createDemoSource } from "./demo-source";
import { createEmptySource } from "./empty-source";
import type { SchoolDataSource } from "./source";

const DataSourceContext = createContext<SchoolDataSource | null>(null);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * Hoe lang een antwoord van Magister vers is. Rooster, cijfers en absenties:
 * 15 minuten (zo vaak verversen we hooguit). Vakken en perioden veranderen
 * zelden; eerdere schooljaren bijna nooit.
 */
const FRESHNESS = {
  getAccount: 24 * HOUR,
  getEnrollments: 24 * HOUR,
  getCurrentEnrollment: 24 * HOUR,
  getSubjects: 6 * HOUR,
  getPeriods: 6 * HOUR,
  getGrades: 15 * MINUTE,
  getAverageChecks: 15 * MINUTE,
  getLessons: 15 * MINUTE,
  getAbsences: 15 * MINUTE,
  getHistory: 7 * 24 * HOUR,
} satisfies Partial<Record<keyof MagisterSource, number>>;

const DATA_CHANNEL = "sm-data";

function dataChannel(): BroadcastChannel | null {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(DATA_CHANNEL);
}

/** De echte bron: Magister via de transport, met de cache ervoor. */
function createLiveSource({
  schoolHost,
  personId,
  enrollmentId,
  sample,
  queryClient,
}: {
  schoolHost: string;
  personId: number;
  enrollmentId: number | null;
  sample: boolean;
  queryClient: QueryClient;
}): SchoolDataSource {
  const sessions = getSessionStore();
  // Na een 401 of bij een andere school is er geen bruikbare sessie: dan vraagt de app
  // Magister niets meer tot je opnieuw koppelt (en blijft de bewaarde data staan).
  const session = () => {
    const { session: current, rejected } = sessions.snapshot();
    return current && !rejected && current.schoolHost === schoolHost ? current : null;
  };
  // Rooster en welkomstpack halen vakken, cijfers en eerdere jaren via de cache.
  const via: Partial<Pick<SchoolDataSource, "getSubjects" | "getGrades" | "getHistory">> = {};
  const inner = createMagisterSource({
    client: createMagisterClient(createTransport(session, sample ? "voorbeeld" : undefined)),
    schoolHost,
    personId,
    enrollmentId: enrollmentId ?? undefined,
    via,
  });

  let pending: ReturnType<typeof setTimeout> | null = null;
  const refreshScreens = () => {
    pending ??= setTimeout(() => {
      pending = null;
      void queryClient.invalidateQueries({ queryKey: [inner.id] });
    }, 250);
  };

  const cached = withCache(inner, {
    prefix: inner.id,
    methods: Object.keys(FRESHNESS) as (keyof typeof FRESHNESS)[],
    freshness: FRESHNESS,
    backend: idbCache,
    lock: browserLock,
    onFresh() {
      refreshScreens();
      // Andere tabbladen lezen de nieuwe data uit dezelfde cache.
      const channel = dataChannel();
      channel?.postMessage({ type: "vers", sourceId: inner.id });
      channel?.close();
    },
    onError(error) {
      if (error instanceof MagisterError && error.code === "verlopen") {
        const current = sessions.get();
        if (current) sessions.reject(current.token);
      }
    },
  });
  via.getSubjects = () => cached.getSubjects();
  via.getGrades = () => cached.getGrades();
  via.getHistory = () => cached.getHistory();
  return cached;
}

/**
 * Levert de actieve databron: je eigen Magister als je gekoppeld bent, anders
 * de demo (als je die koos) of een lege bron. Tijdens de hydratie altijd de lege bron (zie
 * useHydrated), zodat server en browser hetzelfde tekenen.
 */
export function DataSourceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const isClient = useIsClient();
  const [empty] = useState(() => createEmptySource());
  const [demoSource] = useState(() => createDemoSource());
  const demo = useConnection((s) => s.demo && s.account === null);
  const schoolHost = useConnection((s) => s.account?.schoolHost);
  const personId = useConnection((s) => s.account?.personId);
  const sample = useConnection((s) => s.account?.sample === true);
  const enrollmentId = useConnection((s) => s.enrollmentId);

  const source = useMemo(() => {
    if (!isClient) return empty;
    if (!schoolHost || personId === undefined) return demo ? demoSource : empty;
    return createLiveSource({ schoolHost, personId, enrollmentId, sample, queryClient });
  }, [isClient, schoolHost, personId, enrollmentId, sample, queryClient, empty, demo, demoSource]);

  // Weer een bruikbare sessie (opnieuw gekoppeld): meteen verversen.
  useEffect(() => {
    if (source.kind !== "magister") return;
    const sessions = getSessionStore();
    const usable = () => {
      const { session, rejected } = sessions.snapshot();
      return session !== null && !rejected;
    };
    let was = usable();
    return sessions.subscribe(() => {
      const now = usable();
      if (now && !was) void queryClient.invalidateQueries({ queryKey: [source.id] });
      was = now;
    });
  }, [source, queryClient]);

  // Koppelt (of ontkoppelt) een ander tabblad, bijvoorbeeld via de bladwijzer: dit tabblad volgt.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.connection) void useConnection.persist.rehydrate();
      if (event.key === STORAGE_KEYS.onboarding) void useOnboarding.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Een ander tabblad haalde nieuwe data op: die staat al in de cache.
  useEffect(() => {
    if (source.kind !== "magister") return;
    const channel = dataChannel();
    if (!channel) return;
    channel.addEventListener("message", (event: MessageEvent<{ sourceId?: string }>) => {
      if (event.data?.sourceId === source.id)
        void queryClient.invalidateQueries({ queryKey: [source.id] });
    });
    return () => channel.close();
  }, [source, queryClient]);

  return <DataSourceContext.Provider value={source}>{children}</DataSourceContext.Provider>;
}

export function useDataSource(): SchoolDataSource {
  const source = useContext(DataSourceContext);
  if (!source) throw new Error("useDataSource moet binnen <DataSourceProvider> gebruikt worden");
  return source;
}
