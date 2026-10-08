"use client";

import { useIsClient } from "@/lib/hooks";
import { useSettings } from "@/stores/settings";

/** Zoveel keer tikken op het versienummer zet de ontwikkelaarsinstellingen aan of uit. */
export const DEVELOPER_TAPS = 7;

/**
 * Ontwikkelaarsinstellingen tonen? Tijdens het bouwen altijd; in de live
 * versie alleen na de geheime handeling (Instellingen > Over, 7× op de versie).
 */
export function useDeveloperMode(): boolean {
  const isClient = useIsClient();
  const unlocked = useSettings((s) => s.developer);
  return process.env.NODE_ENV !== "production" || (isClient && unlocked);
}
