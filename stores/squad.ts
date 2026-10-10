import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { withoutSources } from "@/lib/sources";
import { cleanClubName, DEFAULT_CLUB, type Club } from "@/lib/squad/club";
import { emptyLineup, type Lineup } from "@/lib/squad/lineup";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * Jouw Elftal, lokaal op dit apparaat: per databron maximaal drie elftallen met
 * een eigen naam, welk elftal open staat en je club. Demo, echte data en eerdere
 * schooljaren lopen zo nooit door elkaar. Alleen kaart-id's, geen cijfers.
 */

export const MAX_SQUADS = 3;
export const SQUAD_NAME_MAX = 24;

export interface SavedSquad {
  id: string;
  name: string;
  lineup: Lineup;
}

export interface SourceSquads {
  squads: SavedSquad[];
  active: string;
  club: Club;
}

export function defaultSourceSquads(): SourceSquads {
  return {
    squads: [{ id: "elftal-1", name: "Mijn elftal", lineup: emptyLineup() }],
    active: "elftal-1",
    club: DEFAULT_CLUB,
  };
}

const SUGGESTED_NAMES = ["Periode 1", "Beste ooit", "Chaos XI"];

interface SquadState {
  bySource: Record<string, SourceSquads>;
  /** De korte uitleg in de kiezer ("elk vak is één speler") is gezien. */
  introSeen: boolean;
  markIntroSeen: () => void;
  /** Past de open opstelling aan (of een bepaalde, bijv. bij ongedaan maken na een wissel). */
  updateLineup: (
    sourceId: string,
    update: (lineup: Lineup) => Lineup,
    squadId?: string,
  ) => void;
  /** Nieuw elftal (leeg, of een kopie van het huidige). Geeft false als er al drie zijn. */
  addSquad: (sourceId: string, copy: boolean) => boolean;
  renameSquad: (sourceId: string, squadId: string, name: string) => void;
  removeSquad: (sourceId: string, squadId: string) => void;
  setActive: (sourceId: string, squadId: string) => void;
  setClub: (sourceId: string, club: Partial<Club>) => void;
  /** Ontkoppelen: alles van deze databronnen vergeten. */
  forgetSources: (match: (sourceId: string) => boolean) => void;
}

export function activeSquad(entry: SourceSquads): SavedSquad {
  return entry.squads.find((s) => s.id === entry.active) ?? entry.squads[0]!;
}

export const useSquadStore = create<SquadState>()(
  persist(
    (set, get) => {
      const entryOf = (sourceId: string) => get().bySource[sourceId] ?? defaultSourceSquads();
      const write = (sourceId: string, entry: SourceSquads) =>
        set((state) => ({ bySource: { ...state.bySource, [sourceId]: entry } }));

      return {
        bySource: {},
        introSeen: false,
        markIntroSeen: () => set({ introSeen: true }),

        updateLineup(sourceId, update, squadId) {
          const entry = entryOf(sourceId);
          const target = squadId ?? activeSquad(entry).id;
          write(sourceId, {
            ...entry,
            squads: entry.squads.map((s) =>
              s.id === target ? { ...s, lineup: update(s.lineup) } : s,
            ),
          });
        },

        addSquad(sourceId, copy) {
          const entry = entryOf(sourceId);
          if (entry.squads.length >= MAX_SQUADS) return false;
          const taken = new Set(entry.squads.map((s) => s.id));
          let n = 1;
          while (taken.has(`elftal-${n}`)) n++;
          const names = new Set(entry.squads.map((s) => s.name));
          const name = SUGGESTED_NAMES.find((candidate) => !names.has(candidate)) ?? `Elftal ${n}`;
          const lineup = copy
            ? activeSquad(entry).lineup
            : emptyLineup(activeSquad(entry).lineup.formation);
          const squad = { id: `elftal-${n}`, name, lineup };
          write(sourceId, { ...entry, squads: [...entry.squads, squad], active: squad.id });
          return true;
        },

        renameSquad(sourceId, squadId, name) {
          const entry = entryOf(sourceId);
          const clean = name.replace(/\s+/g, " ").trim().slice(0, SQUAD_NAME_MAX);
          if (!clean) return;
          write(sourceId, {
            ...entry,
            squads: entry.squads.map((s) => (s.id === squadId ? { ...s, name: clean } : s)),
          });
        },

        removeSquad(sourceId, squadId) {
          const entry = entryOf(sourceId);
          if (entry.squads.length <= 1) return;
          const squads = entry.squads.filter((s) => s.id !== squadId);
          write(sourceId, {
            ...entry,
            squads,
            active: entry.active === squadId ? squads[0]!.id : entry.active,
          });
        },

        setActive(sourceId, squadId) {
          const entry = entryOf(sourceId);
          if (entry.squads.some((s) => s.id === squadId))
            write(sourceId, { ...entry, active: squadId });
        },

        setClub(sourceId, club) {
          const entry = entryOf(sourceId);
          const next = { ...entry.club, ...club };
          write(sourceId, { ...entry, club: { ...next, name: cleanClubName(next.name) } });
        },

        forgetSources(match) {
          set((state) => ({ bySource: withoutSources(state.bySource, match) }));
        },
      };
    },
    {
      name: STORAGE_KEYS.squad,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bySource: state.bySource, introSeen: state.introSeen }),
    },
  ),
);
