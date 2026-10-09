import { create } from "zustand";

/**
 * De calculator met handmatig invullen ("Wat moet ik halen?" zonder echte
 * cijfers): vanuit de oefen-walkout en de demo, en zonder koppeling.
 */
interface CalculatorState {
  manualOpen: boolean;
  openManual: () => void;
  closeManual: () => void;
}

export const useCalculator = create<CalculatorState>()((set) => ({
  manualOpen: false,
  openManual: () => set({ manualOpen: true }),
  closeManual: () => set({ manualOpen: false }),
}));
