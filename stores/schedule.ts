import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idbDel, idbGet, idbSet } from "@/lib/idb";
import type { ScheduleView } from "@/lib/schedule/navigate";
import { nextTrackerState, type TrackerState } from "@/lib/schedule/tracker";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { DateRange, ISODate, Lesson } from "@/lib/types";

const trackerKey = (sourceId: string) => `rooster:${sourceId}`;

interface TrackerStore {
  sourceId: string | null;
  tracker: TrackerState | null;
  /** Vergelijkt met het vorige snapshot en bewaart het nieuwe. */
  sync: (
    sourceId: string,
    lessons: readonly Lesson[],
    range: DateRange,
    today: ISODate,
  ) => Promise<void>;
  markSeen: (lessonId: string) => void;
  /** Alle wijzigingen gezien (de lijst blijft). */
  markAllSeen: () => void;
  clearChanges: () => void;
  /** Ontwikkelaar: het snapshot vergeten (de volgende keer begint opnieuw). */
  forget: (sourceId: string) => Promise<void>;
}

let queue: Promise<void> = Promise.resolve();

/**
 * Fase 3b: de roosterwijzigingen-detector. Per databron een snapshot in
 * IndexedDB; bij elke verversing van het rooster vergelijken.
 */
export const useScheduleTracker = create<TrackerStore>()((set, get) => {
  const save = () => {
    const { sourceId, tracker } = get();
    if (sourceId && tracker) void idbSet(trackerKey(sourceId), tracker);
  };
  return {
    sourceId: null,
    tracker: null,
    sync(sourceId, lessons, range, today) {
      // Na elkaar, zodat twee verversingen elkaar niet in de weg zitten.
      queue = queue.then(async () => {
        const previous =
          get().sourceId === sourceId
            ? get().tracker
            : ((await idbGet<TrackerState>(trackerKey(sourceId))) ?? null);
        const tracker = nextTrackerState(previous, lessons, range, today);
        set({ sourceId, tracker });
        await idbSet(trackerKey(sourceId), tracker);
      });
      return queue;
    },
    markSeen(lessonId) {
      const { tracker } = get();
      if (!tracker || !tracker.unseen.includes(lessonId)) return;
      set({ tracker: { ...tracker, unseen: tracker.unseen.filter((id) => id !== lessonId) } });
      save();
    },
    markAllSeen() {
      const { tracker } = get();
      if (!tracker || tracker.unseen.length === 0) return;
      set({ tracker: { ...tracker, unseen: [] } });
      save();
    },
    clearChanges() {
      const { tracker } = get();
      if (!tracker) return;
      set({ tracker: { ...tracker, changes: [], unseen: [] } });
      save();
    },
    async forget(sourceId) {
      await idbDel(trackerKey(sourceId));
      if (get().sourceId === sourceId) set({ tracker: null, sourceId: null });
    },
  };
});

export type { ScheduleView };

const KEEP = 300;

/**
 * Sleutel per databron, zodat demo en je echte rooster nooit door elkaar lopen
 * (en ontkoppelen alleen je echte notities wist): "demo|1234".
 */
export const scheduleKey = (sourceId: string, id: string) => `${sourceId}|${id}`;
const sourceOf = (key: string) => key.slice(0, Math.max(0, key.indexOf("|")));

interface ScheduleUiState {
  /** De weergave die je zelf koos; null = de standaard (dag op mobiel, week op desktop). */
  view: ScheduleView | null;
  /** Uitval waarop de "VERVALLEN"-stempel al met een klap viel (één keer per les). */
  stamped: string[];
  /** Uitslapen- en vroeg-naar-huis-momenten die al gevierd zijn ("demo|2026-10-06:uitslapen"). */
  cheered: string[];
  /** Je eigen notities bij toetsen, per les. */
  notes: Record<string, string>;
  setView: (view: ScheduleView) => void;
  /** Alle sleutels hieronder via scheduleKey(bron, id). */
  stamp: (key: string) => void;
  cheer: (key: string) => void;
  setNote: (key: string, note: string) => void;
  /** Ontkoppelen: alles van deze databronnen vergeten. */
  forgetSources: (match: (sourceId: string) => boolean) => void;
}

type StoredScheduleUi = Partial<Pick<ScheduleUiState, "view" | "stamped" | "cheered" | "notes">>;

/** Versie 2 (fase 5b): alles per databron. Wat er al stond, kwam uit de demo. */
export function migrateScheduleUi(persisted: unknown, version: number): StoredScheduleUi {
  const state = (persisted ?? {}) as StoredScheduleUi;
  if (version >= 2) return state;
  const demo = (key: string) => scheduleKey("demo", key);
  return {
    ...state,
    stamped: (state.stamped ?? []).map(demo),
    cheered: (state.cheered ?? []).map(demo),
    notes: Object.fromEntries(
      Object.entries(state.notes ?? {}).map(([key, note]) => [demo(key), note]),
    ),
  };
}

/** Fase 3b: kleine rooster-dingen die op dit apparaat blijven. */
export const useScheduleUi = create<ScheduleUiState>()(
  persist(
    (set) => ({
      view: null,
      stamped: [],
      cheered: [],
      notes: {},
      setView: (view) => set({ view }),
      stamp: (key) =>
        set((s) => (s.stamped.includes(key) ? s : { stamped: [...s.stamped, key].slice(-KEEP) })),
      cheer: (key) =>
        set((s) => (s.cheered.includes(key) ? s : { cheered: [...s.cheered, key].slice(-KEEP) })),
      setNote: (key, note) =>
        set((s) => {
          const notes = { ...s.notes };
          if (note.trim()) notes[key] = note;
          else delete notes[key];
          return { notes };
        }),
      forgetSources: (match) =>
        set((s) => ({
          stamped: s.stamped.filter((key) => !match(sourceOf(key))),
          cheered: s.cheered.filter((key) => !match(sourceOf(key))),
          notes: Object.fromEntries(
            Object.entries(s.notes).filter(([key]) => !match(sourceOf(key))),
          ),
        })),
    }),
    {
      name: STORAGE_KEYS.schedule,
      version: 2,
      migrate: (persisted, version) => migrateScheduleUi(persisted, version) as ScheduleUiState,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
