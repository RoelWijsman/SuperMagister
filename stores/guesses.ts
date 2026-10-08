import { create } from "zustand";
import type { GuessRecord } from "@/lib/guess/outcome";
import { idbGet, idbSet } from "@/lib/idb";

/**
 * Gok je cijfer (feature A): per cijfer-id de gok, het moment en het
 * verschil. Per databron in IndexedDB, net als de onthulde cijfers.
 */
interface GuessState {
  sourceId: string | null;
  guesses: Readonly<Record<string, GuessRecord>> | null;
  load: (sourceId: string, initial: Readonly<Record<string, GuessRecord>>) => Promise<void>;
  /** Je gokt maar één keer per cijfer: een bestaande gok blijft staan. */
  record: (gradeId: string, record: GuessRecord) => void;
  /** Terug naar de gokken van vóór het eerste pack. */
  reset: (sourceId: string, initial: Readonly<Record<string, GuessRecord>>) => void;
}

const storageKey = (sourceId: string) => `gokken:${sourceId}`;

export const useGuessStore = create<GuessState>()((set, get) => ({
  sourceId: null,
  guesses: null,

  async load(sourceId, initial) {
    if (get().sourceId === sourceId && get().guesses) return;
    const stored = await idbGet<Record<string, GuessRecord>>(storageKey(sourceId));
    const guesses = stored ?? { ...initial };
    if (!stored) await idbSet(storageKey(sourceId), guesses);
    set({ sourceId, guesses });
  },

  record(gradeId, record) {
    const { sourceId, guesses } = get();
    if (!sourceId || !guesses || guesses[gradeId]) return;
    const next = { ...guesses, [gradeId]: record };
    set({ guesses: next });
    void idbSet(storageKey(sourceId), next);
  },

  reset(sourceId, initial) {
    const guesses = { ...initial };
    set({ sourceId, guesses });
    void idbSet(storageKey(sourceId), guesses);
  },
}));
