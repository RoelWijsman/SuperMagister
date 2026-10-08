import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FoilId } from "@/lib/collection/goals";
import { toggleShowcase, type ShowcaseResult } from "@/lib/collection/showcase";
import { withoutSources } from "@/lib/sources";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * Collectie-voorkeuren, lokaal op dit apparaat. Vitrine en gemelde doelen
 * per databron, zodat kaarten van verschillende accounts en jaren niet door elkaar lopen.
 */
interface CollectionState {
  showcase: Record<string, string[]>;
  foil: FoilId;
  /** Doelen waarvan de melding al getoond is. Ontbreekt = nog nooit gekeken. */
  announced: Record<string, string[]>;
  toggleShowcase: (sourceId: string, cardId: string) => ShowcaseResult;
  setFoil: (foil: FoilId) => void;
  markAnnounced: (sourceId: string, goalIds: readonly string[]) => void;
  /** Doelen mogen opnieuw gemeld worden. */
  resetAnnounced: (sourceId: string) => void;
  /** Ontkoppelen: alles van deze databronnen vergeten. */
  forgetSources: (match: (sourceId: string) => boolean) => void;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      showcase: {},
      foil: "standaard",
      announced: {},

      toggleShowcase(sourceId, cardId) {
        const { ids, result } = toggleShowcase(get().showcase[sourceId] ?? [], cardId);
        if (result !== "vol")
          set((state) => ({ showcase: { ...state.showcase, [sourceId]: ids } }));
        return result;
      },

      setFoil: (foil) => set({ foil }),

      markAnnounced(sourceId, goalIds) {
        set((state) => {
          const known = state.announced[sourceId] ?? [];
          return {
            announced: { ...state.announced, [sourceId]: [...new Set([...known, ...goalIds])] },
          };
        });
      },

      resetAnnounced(sourceId) {
        set((state) => {
          const { [sourceId]: _forgotten, ...rest } = state.announced;
          return { announced: rest };
        });
      },

      forgetSources(match) {
        set((state) => ({
          showcase: withoutSources(state.showcase, match),
          announced: withoutSources(state.announced, match),
        }));
      },
    }),
    {
      name: STORAGE_KEYS.collection,
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
