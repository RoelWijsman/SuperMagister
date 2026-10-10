"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useToasts, type Toast } from "@/stores/toast";

const toneRing: Record<Toast["tone"], string> = {
  default: "",
  success: "shadow-[inset_3px_0_0_var(--sm-good)]",
  info: "shadow-[inset_3px_0_0_var(--sm-accent)]",
  warning: "shadow-[inset_3px_0_0_var(--sm-warn)]",
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);

  // Een nieuwe versie van dezelfde melding: de tijd begint opnieuw.
  useEffect(() => {
    remaining.current = toast.duration;
  }, [toast.version, toast.duration]);

  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const id = setTimeout(() => dismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, dismiss, toast.id, toast.version]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96, transition: { duration: 0.22, ease: "easeIn" } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full flex-wrap items-start gap-x-3 gap-y-1 rounded-2xl border border-line-strong bg-surface py-3 pr-2 pl-4 shadow-[0_18px_44px_-14px_rgb(0_0_0/0.6)]",
        toneRing[toast.tone],
      )}
      role={toast.tone === "warning" ? "alert" : "status"}
    >
      {toast.emoji && (
        <span aria-hidden className="mt-0.5 text-xl leading-none">
          {toast.emoji}
        </span>
      )}
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-semibold text-ink">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-ink-2">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Melding sluiten"
        className="grid size-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-glass hover:text-ink"
      >
        <X size={16} strokeWidth={2.2} />
      </button>
      {toast.action && (
        <div className="order-last basis-full">
          <button
            type="button"
            onClick={() => {
              // Eerst weg, dan de actie: die mag zelf een nieuwe melding met hetzelfde id tonen.
              dismiss(toast.id);
              toast.action!.onClick();
            }}
            className="rounded-full bg-glass-strong px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-accent-ink transition-colors hover:bg-glass-hover"
          >
            {toast.action.label}
          </button>
        </div>
      )}
    </motion.li>
  );
}

/**
 * Toasts: vliegen zacht in van onder en glijden opzij weg. Dicht van kleur (geen
 * glas), zodat ze leesbaar blijven boven kaarten en tekst, en na een paar
 * seconden weg. Op mobiel net boven de navigatie, op een computer rechtsonder.
 */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <ol
      aria-live="polite"
      data-toaster
      className="pointer-events-none fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 px-4 md:right-6 md:bottom-6 md:left-auto md:mx-0 md:px-0"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </ol>
  );
}
