import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * Fase 5b: met welk Magister-account je gekoppeld bent, wat je bekijkt (demo
 * of je eigen Magister) en welk schooljaar. Staat in localStorage, zodat de
 * app na een herstart weet wie je bent en je laatst opgehaalde data kan
 * tonen. Het token staat hier nooit in: dat blijft in sessionStorage
 * (lib/koppelen/session.ts).
 */
export interface LinkedAccount {
  /** Bijv. `voorbeeld.magister.net`. */
  schoolHost: string;
  personId: number;
  /** Voor de chip en Instellingen. */
  name: string;
  linkedAt: string;
  /** Alleen tijdens het bouwen: gekoppeld met de testbestanden in plaats van Magister. */
  sample?: boolean;
}

export type DataView = "demo" | "magister";

interface ConnectionState {
  account: LinkedAccount | null;
  /** Wat je wilt zien. Zonder koppeling is het altijd de demo. */
  view: DataView;
  /** Gekozen schooljaar; null = automatisch het huidige. */
  enrollmentId: number | null;
  /**
   * Koppelt (of koppelt opnieuw). isNew: een ander account dan hiervoor.
   * show: false laat je huidige weergave staan (behalve bij een nieuw account).
   */
  link: (account: LinkedAccount, options?: { show?: boolean }) => { isNew: boolean };
  setView: (view: DataView) => void;
  setEnrollment: (enrollmentId: number | null) => void;
  unlink: () => void;
}

const sameAccount = (a: LinkedAccount | null, b: LinkedAccount) =>
  a !== null && a.schoolHost === b.schoolHost && a.personId === b.personId;

/** Wat je nu echt ziet. */
export const activeView = (state: Pick<ConnectionState, "account" | "view">): DataView =>
  state.account && state.view === "magister" ? "magister" : "demo";

export const useConnection = create<ConnectionState>()(
  persist(
    (set, get) => ({
      account: null,
      view: "demo",
      enrollmentId: null,
      link(account, { show = true } = {}) {
        const isNew = !sameAccount(get().account, account);
        set((state) => ({
          account,
          view: isNew || show ? "magister" : state.view,
          enrollmentId: isNew ? null : state.enrollmentId,
        }));
        return { isNew };
      },
      setView: (view) => set({ view }),
      setEnrollment: (enrollmentId) => set({ enrollmentId }),
      unlink: () => set({ account: null, view: "demo", enrollmentId: null }),
    }),
    {
      name: STORAGE_KEYS.connection,
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
