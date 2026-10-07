"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { DAY_NAMES, formatShortDate, parseISODate } from "@/lib/date";
import { daySummary } from "@/lib/schedule/summary";
import { DayAgenda, type AgendaContext } from "./DayAgenda";
import type { ScheduleDay } from "./WeekView";

/** Zo ver (px) moet je vegen, en vooral opzij, niet omhoog. */
const SWIPE = 60;

/**
 * Veeg naar links of rechts voor de volgende of vorige dag. Na een veeg telt
 * de tik niet als klik op een les.
 */
function useSwipe(onSwipe: (delta: -1 | 1) => void) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const swallowClick = useRef(false);
  return {
    onPointerDown: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") return;
      start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    },
    onPointerUp: (event: React.PointerEvent) => {
      const from = start.current;
      start.current = null;
      if (!from || from.id !== event.pointerId) return;
      const dx = event.clientX - from.x;
      const dy = event.clientY - from.y;
      if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      swallowClick.current = true;
      setTimeout(() => (swallowClick.current = false), 400);
      onSwipe(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      start.current = null;
    },
    onClickCapture: (event: React.MouseEvent) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}

/** Fase 3b: één dag, groot. Standaard op mobiel; vegen voor de volgende dag. */
export function DayView({
  day,
  today,
  direction,
  context,
  onSwipe,
}: {
  day: ScheduleDay;
  today: string | null;
  /** Waar de vorige dag heen ging, voor het inschuiven. */
  direction: -1 | 0 | 1;
  context: AgendaContext;
  onSwipe: (delta: -1 | 1) => void;
}) {
  const reduced = useReducedMotion();
  const swipe = useSwipe(onSwipe);
  const date = parseISODate(day.date);

  return (
    <div {...swipe} className="touch-pan-y">
      <motion.div
        key={day.date}
        initial={reduced || direction === 0 ? false : { opacity: 0, x: direction * 36 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
      >
        <GlassPanel
          as="section"
          aria-label={`${DAY_NAMES[date.getDay()]} ${formatShortDate(date)}`}
        >
          <header className="mb-4 flex flex-col gap-1">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
              <span className="capitalize">{DAY_NAMES[date.getDay()]}</span>
              <span className="font-sans text-sm font-medium tracking-normal text-ink-3">
                {formatShortDate(date)}
              </span>
              {day.date === today && <Chip tone="accent">vandaag</Chip>}
            </h2>
            {day.lessons.length > 0 && (
              <p className="text-sm text-ink-3">{daySummary(day.lessons, day.homeworkCount)}</p>
            )}
          </header>
          <DayAgenda date={day.date} lessons={day.lessons} context={context} />
        </GlassPanel>
      </motion.div>
      <p className="mt-3 text-center text-xs text-ink-3 md:hidden">
        Veeg opzij voor de vorige of volgende dag.
      </p>
    </div>
  );
}
