"use client";

import { useEffect, useRef } from "react";
import { create } from "zustand";
import { useDataSource } from "@/lib/data/context";
import { useSession, useSessionStatus } from "@/lib/koppelen/runtime";
import { notify } from "@/lib/notify";
import { useConnection } from "@/stores/connection";
import { RelinkSheet } from "./RelinkSheet";

/** Of de "Opnieuw koppelen"-sheet open is (ook te openen vanaf de chip). */
export const useRelink = create<{ open: boolean; show: () => void; hide: () => void }>()((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));

const LATER_KEY = "sm-later";

function laterFor(): string | null {
  try {
    return window.sessionStorage.getItem(LATER_KEY);
  } catch {
    return null;
  }
}

function rememberLater(key: string) {
  try {
    window.sessionStorage.setItem(LATER_KEY, key);
  } catch {
    // Dan vraagt hij het na herladen gewoon nog een keer.
  }
}

/**
 * Let op je koppeling zolang je je eigen Magister bekijkt:
 * - 5 minuten voor het verlopen een rustige melding (één keer per token);
 * - verlopen of een 401: de "Opnieuw koppelen"-sheet, één keer per token. Kies
 *   je "Later", dan vraagt dit tabblad het niet opnieuw voor dat token.
 */
export function SessionWatcher() {
  const source = useDataSource();
  const live = source.kind === "magister";
  const schoolHost = useConnection((s) => s.account?.schoolHost ?? null);
  const status = useSessionStatus();
  const { session } = useSession();
  const open = useRelink((s) => s.open);
  const show = useRelink((s) => s.show);
  const hide = useRelink((s) => s.hide);
  const warned = useRef<string | null>(null);
  const prompted = useRef<string | null>(null);
  const needsLink = live && (status === "verlopen" || status === "geen");
  const tokenKey = session?.token.slice(-16) ?? "geen";

  useEffect(() => {
    if (!live || status !== "bijna-verlopen" || !session?.expiresAt) return;
    if (warned.current === session.token) return;
    warned.current = session.token;
    const minutes = Math.max(1, Math.round((session.expiresAt - Date.now()) / 60_000));
    notify("toast.bijnaVerlopen", { minuten: minutes }, { tone: "warning", emoji: "⏳" });
  }, [live, status, session]);

  useEffect(() => {
    if (!needsLink || prompted.current === tokenKey) return;
    let cancelled = false;
    // Een nieuw tabblad krijgt de sessie misschien zo van een ander tabblad: even wachten.
    const timer = setTimeout(
      () => {
        if (cancelled) return;
        prompted.current = tokenKey;
        if (laterFor() !== tokenKey) show();
      },
      status === "geen" ? 1200 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [needsLink, tokenKey, status, show]);

  // Weer gekoppeld (ook vanuit een ander tabblad): de sheet mag weg.
  useEffect(() => {
    if (!needsLink && open) hide();
  }, [needsLink, open, hide]);

  if (!schoolHost) return null;
  return (
    <RelinkSheet
      open={open && needsLink}
      schoolHost={schoolHost}
      onClose={() => {
        rememberLater(tokenKey);
        hide();
      }}
    />
  );
}
