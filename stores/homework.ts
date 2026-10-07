import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { HomeworkPrefs, HomeworkStatus } from "@/lib/homework/overview";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export interface SourcePrefs extends HomeworkPrefs {
  /** Afgevinkte mini-stapjes ("ik heb geen zin"), per item. */
  steps: Readonly<Record<string, readonly number[]>>;
}

export type HomeworkView = "lijst" | "kanban";

/** Vaste lege stand, zodat selectors niet bij elke render iets nieuws geven. */
export const EMPTY_PREFS: SourcePrefs = Object.freeze({
  status: {},
  items: {},
  subjects: {},
  steps: {},
});

/** Zoveel statussen bewaren we hooguit; de oudste gaan eerst. */
const KEEP_STATUS = 500;
const KEEP_CELEBRATED = 60;

interface HomeworkState {
  bySource: Record<string, SourcePrefs>;
  /** "bron:datum" waarop alles-af al gevierd is. */
  celebrated: string[];
  view: HomeworkView;
  setStatus: (sourceId: string, id: string, status: HomeworkStatus, at?: Date) => void;
  setMinutes: (sourceId: string, id: string, minutes: number | null) => void;
  setSubjectMinutes: (sourceId: string, subjectId: string, minutes: number | null) => void;
  toggleStep: (sourceId: string, id: string, index: number) => void;
  /** Geeft true als dit de eerste keer is (dan mag de confetti). */
  celebrate: (key: string) => boolean;
  setView: (view: HomeworkView) => void;
}

const withEntry = <T>(record: Readonly<Record<string, T>>, key: string, value: T | null) => {
  const next = { ...record };
  if (value === null) delete next[key];
  else next[key] = value;
  return next;
};

/**
 * Fase 3c: wat je zelf met je huiswerk doet. Afvinken, bezig, eigen tijden en
 * mini-stapjes blijven op dit apparaat (per databron); Magister merkt er niets
 * van, want de koppeling leest alleen.
 */
export const useHomeworkStore = create<HomeworkState>()(
  persist(
    (set, get) => {
      const update = (sourceId: string, change: (prefs: SourcePrefs) => SourcePrefs) =>
        set((state) => ({
          bySource: {
            ...state.bySource,
            [sourceId]: change(state.bySource[sourceId] ?? EMPTY_PREFS),
          },
        }));
      return {
        bySource: {},
        celebrated: [],
        view: "lijst",
        setStatus(sourceId, id, status, at = new Date()) {
          update(sourceId, (prefs) => {
            let entries = Object.entries({
              ...prefs.status,
              [id]: { status, at: at.toISOString() },
            });
            if (entries.length > KEEP_STATUS) {
              entries = entries
                .sort(([, a], [, b]) => b.at.localeCompare(a.at))
                .slice(0, KEEP_STATUS);
            }
            return { ...prefs, status: Object.fromEntries(entries) };
          });
        },
        setMinutes(sourceId, id, minutes) {
          update(sourceId, (prefs) => ({ ...prefs, items: withEntry(prefs.items, id, minutes) }));
        },
        setSubjectMinutes(sourceId, subjectId, minutes) {
          update(sourceId, (prefs) => ({
            ...prefs,
            subjects: withEntry(prefs.subjects, subjectId, minutes),
          }));
        },
        toggleStep(sourceId, id, index) {
          update(sourceId, (prefs) => {
            const done = prefs.steps[id] ?? [];
            const next = done.includes(index)
              ? done.filter((i) => i !== index)
              : [...done, index].sort((a, b) => a - b);
            return { ...prefs, steps: withEntry(prefs.steps, id, next.length ? next : null) };
          });
        },
        celebrate(key) {
          if (get().celebrated.includes(key)) return false;
          set((state) => ({ celebrated: [...state.celebrated, key].slice(-KEEP_CELEBRATED) }));
          return true;
        },
        setView: (view) => set({ view }),
      };
    },
    {
      name: STORAGE_KEYS.homework,
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
