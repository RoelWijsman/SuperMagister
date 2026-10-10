import { create } from "zustand";
import { recordStep, undoStep } from "@/lib/squad/history";
import type { Lineup } from "@/lib/squad/lineup";

/**
 * Ongedaan maken voor Jouw Elftal: per databron en per opstelling de standen van
 * vóór de laatste twintig stappen. Alleen in het geheugen (niet bewaard): na
 * herladen begin je met een schone lei.
 */
interface SquadHistoryState {
  past: Record<string, Lineup[]>;
  record: (key: string, before: Lineup) => void;
  /** Haalt de vorige stand op en vergeet hem; null als er niets terug te zetten is. */
  undo: (key: string) => Lineup | null;
}

export const useSquadHistory = create<SquadHistoryState>()((set, get) => ({
  past: {},
  record: (key, before) =>
    set((state) => ({ past: { ...state.past, [key]: recordStep(state.past[key] ?? [], before) } })),
  undo: (key) => {
    const step = undoStep(get().past[key] ?? []);
    if (!step) return null;
    set((state) => ({ past: { ...state.past, [key]: step.past } }));
    return step.lineup;
  },
}));
