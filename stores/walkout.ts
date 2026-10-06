import { create } from "zustand";
import type { CardData } from "@/lib/cards/model";
import type { Grade } from "@/lib/types";

export interface WalkoutEntry {
  card: CardData;
  /** Cijfers van hetzelfde vak, voor de reactie onder de kaart. */
  grades: readonly Grade[];
}

export interface WalkoutSession {
  id: string;
  /** "pack": nieuwe cijfers (worden onthuld), "oefen": nepcijfers, "opnieuw": een oude kaart. */
  mode: "pack" | "oefen" | "opnieuw";
  /** In afspeelvolgorde: het beste cijfer als laatste. */
  entries: readonly WalkoutEntry[];
}

interface WalkoutState {
  session: WalkoutSession | null;
  start: (session: Omit<WalkoutSession, "id">) => void;
  close: () => void;
}

let counter = 0;

/** Welke walkout er nu loopt. De overlay in de layout luistert hiernaar. */
export const useWalkout = create<WalkoutState>()((set) => ({
  session: null,
  start: (session) => set({ session: { ...session, id: `walkout-${++counter}` } }),
  close: () => set({ session: null }),
}));
