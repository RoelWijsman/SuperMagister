"use client";

import { useIsClient } from "@/lib/hooks";
import { useSettings } from "@/stores/settings";

/**
 * Staan prestaties en XP aan? (Instellingen > Ontwikkelaar; standaard uit,
 * want fase 6 is vervallen.) Tot na de hydratie altijd uit, zodat server en
 * browser hetzelfde tekenen.
 */
export function useGamification(): boolean {
  const isClient = useIsClient();
  const on = useSettings((s) => s.gamification);
  return isClient && on;
}
