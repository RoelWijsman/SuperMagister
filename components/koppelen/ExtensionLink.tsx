"use client";

import { useEffect, useMemo, useRef } from "react";
import { useDataSource } from "@/lib/data/context";
import { useGrades, useRevealState } from "@/lib/data/hooks";
import { isExtensionStatus, type ExtensionStatus } from "@/lib/extensie/protocol";
import { getBridge, useExtension } from "@/lib/extensie/runtime";
import { decideSync, EXTENSION_TOKEN } from "@/lib/extensie/sync";
import { completeLink } from "@/lib/koppelen/link";
import { getSessionStore } from "@/lib/koppelen/runtime";
import type { TokenRenewer } from "@/lib/koppelen/session";
import { useConnection } from "@/stores/connection";
import { useUnlink } from "./useUnlink";

/** Zo vernieuwt de app via de extensie: die opent zo nodig zelf Magister op de achtergrond. */
const renewer: TokenRenewer = {
  method: "extensie",
  async renew() {
    const status = await getBridge()
      ?.request("vernieuw", undefined, 70_000)
      .catch(() => null);
    if (!isExtensionStatus(status) || !status.linked || !status.schoolHost) return null;
    return { token: EXTENSION_TOKEN, schoolHost: status.schoolHost, expiresAt: status.expiresAt };
  },
};

/**
 * Houdt de app en de browserextensie (fase 5c) in de pas:
 * - zoekt de extensie (ping via de brug) en luistert naar wat ze meldt;
 * - koppelt vanzelf als de extensie je Magister-sessie heeft (met
 *   welkomstpack bij een nieuw account), en houdt het verloopmoment bij;
 * - meldt zich bij de token-laag als bron die zelf vernieuwt, zodat de
 *   "Opnieuw koppelen"-melding wegblijft;
 * - ontkoppel je in de extensie, dan ontkoppelt de app ook;
 * - geeft je pack door voor het getal op het icoon.
 */
export function ExtensionLink() {
  const unlink = useUnlink();
  const linking = useRef(false);

  useEffect(() => {
    const bridge = getBridge();
    if (!bridge) return;
    let cancelled = false;

    const apply = async (status: ExtensionStatus) => {
      useExtension.setState({ present: true, status });
      const sessions = getSessionStore();
      const decision = decideSync({
        status,
        account: useConnection.getState().account,
        session: sessions.get(),
      });
      sessions.setRenewer(status.paused ? null : renewer);
      switch (decision.action) {
        case "sessie":
          sessions.set(decision.session);
          return;
        case "koppelen":
          if (linking.current) return;
          linking.current = true;
          try {
            await completeLink(decision.session, "extensie", { background: true });
          } finally {
            linking.current = false;
          }
          return;
        case "ontkoppelen":
          await unlink({ fromExtension: true });
          return;
        case "pauze":
          // De app is daarna zelf (bijv. met de bladwijzer) gekoppeld: dat mag zo blijven.
          if (sessions.get()?.method === "extensie") sessions.clear();
          return;
        case "niets":
          return;
      }
    };

    const stop = bridge.subscribe((message) => {
      if (message.type === "aanwezig") {
        useExtension.setState({ present: true });
        bridge.request("status").then(
          (status) => {
            if (isExtensionStatus(status)) void apply(status);
          },
          () => undefined,
        );
      } else if (
        (message.type === "status" || message.type === "ontkoppeld") &&
        isExtensionStatus(message.payload)
      ) {
        void apply(message.payload);
      }
    });

    bridge.detect().then(async (present) => {
      if (cancelled) return;
      if (!present) {
        // Misschien meldde het content script zich al; dan niet terug naar "weg".
        if (useExtension.getState().present !== true) useExtension.setState({ present: false });
        return;
      }
      useExtension.setState({ present: true });
      const status = await bridge.request("status").catch(() => null);
      if (!cancelled && isExtensionStatus(status)) await apply(status);
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [unlink]);

  return <PackReporter />;
}

/** Geeft de extensie je pack door (alleen bij je eigen Magister, huidig schooljaar). */
function PackReporter() {
  const present = useExtension((s) => s.present);
  const source = useDataSource();
  const currentYear = useConnection((s) => s.enrollmentId === null);
  const { pack, isLoading } = useRevealState();
  const grades = useGrades();
  const active = present === true && source.kind === "magister" && currentYear && !isLoading;

  const newestSeen = useMemo(() => {
    if (!grades.data) return null;
    let newest = "";
    for (const grade of grades.data) if (grade.enteredAt > newest) newest = grade.enteredAt;
    return newest || null;
  }, [grades.data]);

  useEffect(() => {
    if (!active || !grades.data) return;
    void getBridge()
      ?.request("pack", {
        count: pack.length,
        // Geen cijfers dit jaar? Dan telt alles vanaf nu als nieuw.
        newestSeen: newestSeen ?? new Date().toISOString(),
      })
      .catch(() => undefined);
  }, [active, pack.length, newestSeen, grades.data]);

  return null;
}
