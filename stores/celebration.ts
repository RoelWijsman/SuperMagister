import { create } from "zustand";

interface CelebrationState {
  /** Telt op bij elk feestje; de confetti-regen kijkt ernaar. */
  count: number;
  fire: () => void;
}

/** Fase 3c: een confetti-regen over de hele app (alles voor morgen af). */
export const useCelebration = create<CelebrationState>()((set) => ({
  count: 0,
  fire: () => set((state) => ({ count: state.count + 1 })),
}));
