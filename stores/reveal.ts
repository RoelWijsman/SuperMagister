import { create } from "zustand";
import { idbGet, idbSet } from "@/lib/idb";
import { initialRevealedIds } from "@/lib/reveal";

interface RevealState {
  /** Voor welke databron (demo of een gekoppeld account) de set geladen is. */
  sourceId: string | null;
  revealed: ReadonlySet<string> | null;
  load: (
    sourceId: string,
    allGradeIds: readonly string[],
    packIds: readonly string[],
  ) => Promise<void>;
  reveal: (ids: readonly string[]) => void;
}

const storageKey = (sourceId: string) => `onthuld:${sourceId}`;

export const useReveal = create<RevealState>()((set, get) => ({
  sourceId: null,
  revealed: null,

  async load(sourceId, allGradeIds, packIds) {
    if (get().sourceId === sourceId && get().revealed) return;
    const stored = await idbGet<string[]>(storageKey(sourceId));
    const ids = stored ?? initialRevealedIds(allGradeIds, packIds);
    if (!stored) await idbSet(storageKey(sourceId), ids);
    set({ sourceId, revealed: new Set(ids) });
  },

  reveal(ids) {
    const { sourceId, revealed } = get();
    if (!sourceId || !revealed) return;
    const next = new Set(revealed);
    for (const id of ids) next.add(id);
    set({ revealed: next });
    void idbSet(storageKey(sourceId), [...next]);
  },
}));
