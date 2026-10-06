"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, type CSSProperties } from "react";
import { playLiveCue } from "@/lib/audio/engine";
import { haptic } from "@/lib/haptics";
import {
  clampGuess,
  formatGuess,
  guessColor,
  guessCommentKey,
  isSixSeven,
  tickFrequency,
} from "@/lib/guess/scale";
import { useCopy } from "@/lib/use-copy";

interface GuessSliderProps {
  /** Gok in tienden (10 = 1,0). */
  value: number;
  onChange: (tenths: number) => void;
  /** Enter in de slider: gok vastzetten. */
  onSubmit?: () => void;
  autoFocus?: boolean;
}

/**
 * De gokslider: een gigantisch cijfer dat van rood naar groen kleurt, een
 * tikje met stijgende toon en live commentaar. Bij een 6,7 wiebelt hij even.
 */
export function GuessSlider({ value, onChange, onSubmit, autoFocus }: GuessSliderProps) {
  const lastTick = useRef(0);
  const color = guessColor(value);
  const commentKey = guessCommentKey(value);
  const comment = useCopy(commentKey);

  const change = (next: number) => {
    const tenths = clampGuess(next);
    if (tenths === value) return;
    onChange(tenths);
    // Niet elk tikje als je snel sleept: dan wordt het een zoemer.
    const now = performance.now();
    if (now - lastTick.current < 30) return;
    lastTick.current = now;
    playLiveCue({ at: 0, cue: "tik", pitch: tickFrequency(tenths) }, { tier: "zilver" });
    haptic("tap");
  };

  return (
    <div className="w-full">
      <p
        aria-hidden
        className="text-center font-card leading-[0.9] tabular-nums transition-colors duration-150"
        style={{ color, fontSize: "clamp(6.5rem, 30vw, 12rem)", textShadow: `0 0 48px ${color}` }}
      >
        {formatGuess(value)}
      </p>

      <motion.div
        className="mx-auto mt-2 max-w-md"
        animate={isSixSeven(value) ? { y: [0, -12, 10, -7, 5, -2, 0] } : { y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <input
          type="range"
          min={10}
          max={100}
          step={1}
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => change(Number(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit?.();
          }}
          aria-label="Jouw gok"
          aria-valuetext={formatGuess(value)}
          className="gok-slider"
          style={{ "--gok-color": color } as CSSProperties}
        />
        <div
          aria-hidden
          className="flex justify-between px-1 font-card text-base tracking-wider text-white/45"
        >
          <span>1</span>
          <span>5,5</span>
          <span>10</span>
        </div>
      </motion.div>

      <div className="mt-3 min-h-[3.25rem] text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={commentKey}
            className="text-[1.05rem] font-medium text-balance text-white/85"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {comment}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
