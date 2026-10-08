"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo } from "react";
import { LOGO_DOT, LOGO_RADIUS, LOGO_SIZE, LOGO_SPARK_PATH } from "@/lib/brand";
import { useCopy } from "@/lib/use-copy";

/** Zo lang duurt de intro; daarna gaat hij vanzelf door. */
const INTRO_MS = 4200;
const WORD = ["S", "u", "p", "e", "r", "M", "a", "g", "i", "s", "t", "e", "r"];

/**
 * De intro: puntjes vliegen naar het midden, de tegel verschijnt, de ster
 * tekent zich en het woordmerk komt letter voor letter. Tikken (of een toets)
 * slaat hem over. Met rustige animaties: alles vervaagt gewoon in beeld.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion() ?? false;
  const id = useId();
  const line = useCopy("onboarding.intro");
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const distance = 160 + ((i * 37) % 90);
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          delay: (i % 5) * 0.05,
        };
      }),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(onDone, reduced ? 2600 : INTRO_MS);
    return () => clearTimeout(timer);
  }, [onDone, reduced]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Intro overslaan"
      className="relative grid h-full w-full cursor-pointer place-items-center outline-none"
    >
      <div className="flex flex-col items-center">
        <div className="relative size-28 sm:size-32">
          {!reduced &&
            particles.map((p, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-[var(--sm-accent-2)]"
                initial={{ x: p.x, y: p.y, opacity: 0, scale: 1.4 }}
                animate={{ x: 0, y: 0, opacity: [0, 1, 0], scale: 0.4 }}
                transition={{ duration: 0.9, delay: 0.15 + p.delay, ease: "easeIn" }}
              />
            ))}
          <motion.svg
            viewBox="0 0 40 40"
            aria-hidden
            className="size-full drop-shadow-[0_18px_40px_color-mix(in_oklab,var(--sm-accent)_55%,transparent)]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.55, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={
              reduced
                ? { duration: 0.6 }
                : { delay: 0.95, type: "spring", stiffness: 260, damping: 16 }
            }
          >
            <defs>
              <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--sm-accent)" />
                <stop offset="1" stopColor="var(--sm-accent-2)" />
              </linearGradient>
            </defs>
            <rect width={LOGO_SIZE} height={LOGO_SIZE} rx={LOGO_RADIUS} fill={`url(#${id}-bg)`} />
            <motion.path
              d={LOGO_SPARK_PATH}
              stroke="var(--sm-on-accent)"
              strokeWidth={0.8}
              initial={reduced ? false : { pathLength: 0, fill: "rgba(0,0,0,0)" }}
              animate={{ pathLength: 1, fill: "var(--sm-on-accent)" }}
              transition={{
                pathLength: { delay: 1.25, duration: 0.7, ease: "easeInOut" },
                fill: { delay: reduced ? 0 : 1.85, duration: 0.3 },
              }}
            />
            <motion.circle
              {...LOGO_DOT}
              fill="var(--sm-on-accent)"
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.85 }}
              transition={{ delay: 2.1, type: "spring", stiffness: 500, damping: 14 }}
              style={{ transformOrigin: `${LOGO_DOT.cx}px ${LOGO_DOT.cy}px` }}
            />
          </motion.svg>
        </div>

        <p
          className="mt-6 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
          aria-label="SuperMagister"
        >
          {WORD.map((letter, i) => (
            <motion.span
              key={i}
              aria-hidden
              className={i < 5 ? "text-gradient" : "text-ink"}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (reduced ? 0.3 : 2.15) + i * (reduced ? 0 : 0.045) }}
            >
              {letter}
            </motion.span>
          ))}
        </p>
        <motion.p
          className="mt-3 min-h-[1.5em] text-lg text-ink-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: line ? 1 : 0 }}
          transition={{ delay: reduced ? 0.4 : 2.8 }}
        >
          {line}
        </motion.p>
        <motion.p
          className="mt-10 text-sm text-ink-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0.6 : 3.2 }}
        >
          Tik om verder te gaan
        </motion.p>
      </div>
    </button>
  );
}
