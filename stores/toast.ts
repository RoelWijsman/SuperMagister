import { create } from "zustand";

export type ToastTone = "default" | "success" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  /** Emoji of kort symbool voor links in de toast. */
  emoji?: string;
  tone: ToastTone;
  duration: number;
  /** Een knop in de melding, bijv. "Ongedaan maken". */
  action?: { label: string; onClick: () => void };
  /** Verandert bij elke nieuwe versie van dezelfde melding (zelfde id): dan begint de tijd opnieuw. */
  version?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Toast) => void;
  dismiss: (id: string) => void;
}

const MAX_VISIBLE = 3;

export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  // Zelfde id: de melding wordt vervangen (bijv. de laatste stap met "Ongedaan maken").
  push: (toast) =>
    set((s) =>
      s.toasts.some((t) => t.id === toast.id)
        ? { toasts: s.toasts.map((t) => (t.id === toast.id ? toast : t)) }
        : { toasts: [...s.toasts, toast].slice(-MAX_VISIBLE) },
    ),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

let counter = 0;

/** Laat een toast zien. Werkt overal, ook buiten React-componenten. */
export function toast(input: Omit<Toast, "id" | "tone" | "duration"> & Partial<Toast>): string {
  const id = input.id ?? `toast-${++counter}`;
  const duration = input.duration ?? (input.description || input.action ? 4800 : 3200);
  useToasts.getState().push({ tone: "default", ...input, id, duration, version: ++counter });
  return id;
}
