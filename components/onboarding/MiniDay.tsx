"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const LESSONS = [
  { time: "08:30", name: "Wiskunde", room: "C11", color: "#7c9cff" },
  { time: "09:20", name: "Engels", room: "B04", color: "#ff8fb1", uitval: true },
  { time: "10:30", name: "Biologie", room: "A02", color: "#4fe3a3" },
  { time: "11:20", name: "Geschiedenis", room: "A04", color: "#ffb547" },
];

const HOMEWORK = ["Lees § 3.2", "Opgave 12 t/m 18"];

/** Hoe lang één rondje duurt (ms). */
const LOOP_MS = 4600;

/**
 * Een dag in het klein: lessen met een uitgevallen uur (de stempel valt erop)
 * en huiswerk dat zichzelf afvinkt. In een lus; met rustige animaties staat
 * alles meteen in de eindstand.
 */
export function MiniDay({ active }: { active: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const [round, setRound] = useState(0);
  const still = reduced || !active;

  useEffect(() => {
    if (still) return;
    const timer = setInterval(() => setRound((n) => n + 1), LOOP_MS);
    return () => clearInterval(timer);
  }, [still]);

  return (
    <div
      role="img"
      aria-label="Je dag: vier lessen, Engels valt uit, en twee keer huiswerk dat je afvinkt"
      className="grid gap-3 rounded-3xl border border-line bg-[color-mix(in_oklab,var(--sm-bg)_60%,transparent)] p-3 sm:grid-cols-[1.4fr_1fr]"
    >
      <ul className="space-y-1.5" key={`les-${round}`}>
        {LESSONS.map((lesson, i) => (
          <motion.li
            key={lesson.time}
            initial={still ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="relative flex items-center gap-2 rounded-xl bg-glass px-2 py-1.5 text-xs"
          >
            <span className="w-9 shrink-0 text-ink-3 tabular-nums">{lesson.time}</span>
            <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: lesson.color }} />
            <span
              className={cn(
                "min-w-0 flex-1 truncate font-semibold text-ink",
                lesson.uitval && "line-through opacity-50",
              )}
            >
              {lesson.name}
            </span>
            <span className="text-ink-3">{lesson.room}</span>
            {lesson.uitval && (
              <motion.span
                aria-hidden
                initial={still ? false : { opacity: 0, scale: 2.2, rotate: -14 }}
                animate={{ opacity: 1, scale: 1, rotate: -8 }}
                transition={{ delay: still ? 0 : 0.9, type: "spring", stiffness: 420, damping: 16 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-bad px-1.5 font-card text-sm tracking-[0.18em] text-bad uppercase"
              >
                Vervallen
              </motion.span>
            )}
          </motion.li>
        ))}
      </ul>
      <ul className="space-y-1.5" key={`hw-${round}`}>
        <li className="px-1 text-xs font-semibold text-ink-3">Huiswerk voor morgen</li>
        {HOMEWORK.map((item, i) => (
          <li
            key={item}
            className="flex items-center gap-2 rounded-xl bg-glass px-2 py-1.5 text-xs"
          >
            <motion.span
              aria-hidden
              initial={still ? false : { backgroundColor: "rgba(255,255,255,0)", scale: 1 }}
              animate={{ backgroundColor: "var(--sm-good)", scale: [1, 1.25, 1] }}
              transition={{ delay: still ? 0 : 1.8 + i * 0.7, duration: 0.35 }}
              className="grid size-5 shrink-0 place-items-center rounded-full border border-line-strong text-[#0b0a1a]"
            >
              <motion.span
                initial={still ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: still ? 0 : 1.85 + i * 0.7 }}
              >
                <Check size={12} strokeWidth={3.2} />
              </motion.span>
            </motion.span>
            <span className="min-w-0 truncate text-ink-2">{item}</span>
          </li>
        ))}
        <motion.li
          initial={still ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: still ? 0 : 3.2 }}
          className="px-1 text-xs font-semibold text-good"
        >
          Alles af.
        </motion.li>
      </ul>
    </div>
  );
}
