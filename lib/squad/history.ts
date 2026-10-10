import type { Lineup } from "./lineup";

/**
 * Ongedaan maken: de opstellingen van vóór de laatste stappen, de nieuwste
 * achteraan. Hooguit twintig; daarna valt de oudste eraf.
 */
export const HISTORY_LIMIT = 20;

/** Onthoudt de stand van vóór een stap. */
export function recordStep(past: readonly Lineup[], before: Lineup): Lineup[] {
  return [...past, before].slice(-HISTORY_LIMIT);
}

/** De vorige stand en wat er daarna nog over is; null als er niets terug te zetten is. */
export function undoStep(past: readonly Lineup[]): { lineup: Lineup; past: Lineup[] } | null {
  if (past.length === 0) return null;
  return { lineup: past[past.length - 1]!, past: past.slice(0, -1) };
}
