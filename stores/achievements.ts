import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * Welke prestaties al gemeld zijn, per databron. De prestaties zelf volgen
 * uit je geschiedenis (zoals je gokken); hier staat alleen wat je al weet.
 */
interface AchievementState {
  /** Ontbreekt = nog nooit gekeken: dan leggen we stil vast wat er al was. */
  announced: Record<string, string[]>;
  markAnnounced: (sourceId: string, ids: readonly string[]) => void;
  resetAnnounced: (sourceId: string) => void;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set) => ({
      announced: {},
      markAnnounced(sourceId, ids) {
        set((state) => {
          const known = state.announced[sourceId] ?? [];
          return {
            announced: { ...state.announced, [sourceId]: [...new Set([...known, ...ids])] },
          };
        });
      },
      resetAnnounced(sourceId) {
        set((state) => {
          const { [sourceId]: _forgotten, ...rest } = state.announced;
          return { announced: rest };
        });
      },
    }),
    {
      name: STORAGE_KEYS.achievements,
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
