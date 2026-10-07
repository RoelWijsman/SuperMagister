"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { playUiSound } from "@/lib/audio/engine";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";
import { HOMEWORK_XP } from "@/lib/homework/overview";

const SPARKS = 8;

/** Plop, trilling: de beloning bij afvinken (ook bij slepen naar Klaar). */
export function checkReward(checked: boolean) {
  playUiSound(checked ? "plop" : "uit");
  haptic(checked ? "success" : "tap");
}

/** "+10 XP" dat omhoog vliegt en vervaagt. */
export function XpFloat({ id, onDone }: { id: number; onDone: (id: number) => void }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute -top-1 left-1/2 z-10 font-display text-sm font-bold whitespace-nowrap text-accent-ink"
      initial={{ x: "-50%", y: 0, opacity: 0, scale: 0.7 }}
      animate={{ y: -38, opacity: [0, 1, 1, 0], scale: 1 }}
      transition={{ duration: 1.1, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
      onAnimationComplete={() => onDone(id)}
    >
      +{HOMEWORK_XP} XP
    </motion.span>
  );
}

/**
 * Fase 3c: de vinkknop. Veert bij afvinken, het vinkje tekent zichzelf, er
 * spetteren puntjes weg en "+10 XP" vliegt omhoog. Met plop en trilling.
 */
export function CheckButton({
  checked,
  onCheckedChange,
  label,
  size = "md",
  xp = true,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Wat je afvinkt, voor schermlezers ("Wiskunde A, opdracht 3 t/m 7"). */
  label: string;
  size?: "sm" | "md";
  /** "+10 XP" laten vliegen (niet bij mini-stapjes). */
  xp?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [floats, setFloats] = useState<number[]>([]);
  const [pops, setPops] = useState(0);
  const px = size === "sm" ? 26 : 32;

  const toggle = () => {
    const next = !checked;
    checkReward(next);
    if (next) {
      if (xp) setFloats((list) => [...list, Date.now()]);
      setPops((n) => n + 1);
    }
    onCheckedChange(next);
  };

  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", className)}>
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={toggle}
        whileTap={reduced ? undefined : { scale: 0.82 }}
        animate={checked && pops > 0 && !reduced ? { scale: [1, 1.28, 0.94, 1] } : { scale: 1 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className={cn(
          "grid place-items-center rounded-full border-2 transition-colors duration-200",
          checked
            ? "border-transparent bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent shadow-[0_6px_18px_-6px_color-mix(in_oklab,var(--sm-accent)_80%,transparent)]"
            : "border-line-strong bg-glass text-transparent hover:border-[color-mix(in_oklab,var(--sm-accent)_70%,transparent)]",
        )}
        style={{ width: px, height: px }}
      >
        <svg viewBox="0 0 24 24" width={px * 0.58} height={px * 0.58} aria-hidden>
          <motion.path
            d="M5 12.5l4.2 4.2L19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{
              duration: reduced ? 0 : 0.28,
              ease: "easeOut",
              delay: checked ? 0.05 : 0,
            }}
          />
        </svg>
      </motion.button>

      {!reduced && pops > 0 && checked && (
        <span key={pops} aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: SPARKS }, (_, i) => {
            const angle = (i / SPARKS) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                className="absolute top-1/2 left-1/2 size-1.5 rounded-full"
                style={{ background: i % 2 ? "var(--sm-accent)" : "var(--sm-accent-2)" }}
                initial={{ x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
                animate={{
                  x: `calc(-50% + ${Math.cos(angle) * px * 0.95}px)`,
                  y: `calc(-50% + ${Math.sin(angle) * px * 0.95}px)`,
                  opacity: 0,
                  scale: 0.4,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            );
          })}
        </span>
      )}

      <AnimatePresence>
        {floats.map((id) => (
          <XpFloat
            key={id}
            id={id}
            onDone={(done) => setFloats((list) => list.filter((other) => other !== done))}
          />
        ))}
      </AnimatePresence>
    </span>
  );
}
