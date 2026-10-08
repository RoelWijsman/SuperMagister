import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * Fase 5b: met welk Magister-account je gekoppeld bent en welk schooljaar. Staat in localStorage, zodat de
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

interface ConnectionState {
  account: LinkedAccount | null;
  /** Gekozen schooljaar; null = automatisch het huidige. */
  enrollmentId: number | null;
  /** Koppelt (of koppelt opnieuw). isNew: een ander account dan hiervoor. */
  link: (account: LinkedAccount) => { isNew: boolean };
  setEnrollment: (enrollmentId: number | null) => void;
  unlink: () => void;
}

const sameAccount = (a: LinkedAccount | null, b: LinkedAccount) =>
  a !== null && a.schoolHost === b.schoolHost && a.personId === b.personId;

export const useConnection = create<ConnectionState>()(
  persist(
    (set, get) => ({
      account: null,
      enrollmentId: null,
      link(account) {
        const isNew = !sameAccount(get().account, account);
        set((state) => ({ account, enrollmentId: isNew ? null : state.enrollmentId }));
        return { isNew };
      },
      setEnrollment: (enrollmentId) => set({ enrollmentId }),
      unlink: () => set({ account: null, enrollmentId: null }),
    }),
    {
      name: STORAGE_KEYS.connection,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ account: state.account, enrollmentId: state.enrollmentId }),
    },
  ),
);
