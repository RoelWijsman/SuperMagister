import { create } from "zustand";
import { createBridge, type Bridge } from "./bridge";
import type { ExtensionStatus } from "./protocol";

/**
 * De extensie in de browser: één brug voor de hele app, en wat we van de
 * extensie weten. `present` is null zolang we het nog niet weten.
 */
interface ExtensionState {
  present: boolean | null;
  status: ExtensionStatus | null;
}

export const useExtension = create<ExtensionState>()(() => ({ present: null, status: null }));

let bridge: Bridge | null = null;

/** De brug zelf (ook om de extensie te zoeken). Op de server: null. */
export function getBridge(): Bridge | null {
  if (typeof window === "undefined") return null;
  bridge ??= createBridge(window);
  return bridge;
}

/** De brug, maar alleen als de extensie er echt is (anders wacht een verzoek eindeloos). */
export function getExtensionBridge(): Bridge | null {
  return useExtension.getState().present ? getBridge() : null;
}
