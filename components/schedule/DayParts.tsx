"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Coffee } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatTime } from "@/lib/date";
import type { FreePeriod } from "@/lib/schedule/gaps";
import type { Homework } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";
import { useDataSource } from "@/lib/data/context";
import { scheduleKey, useScheduleUi } from "@/stores/schedule";

const CONFETTI = ["var(--sm-accent)", "var(--sm-accent-2)", "var(--sm-good)", "#ffd36b", "#ff8fb1"];

/** Een klein confettimoment, één keer per dag en soort (uitslapen, vroeg naar huis). */
function Confetti({ id }: { id: string }) {
  const reduced = useReducedMotion();
  const key = scheduleKey(useDataSource().id, id);
  const cheered = useScheduleUi((s) => s.cheered.includes(key));
  const cheer = useScheduleUi((s) => s.cheer);
  const [show] = useState(() => !cheered && !reduced);

  useEffect(() => {
    if (!cheered) cheer(key);
  }, [cheered, cheer, key]);

  if (!show) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {Array.from({ length: 16 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-1/2 left-1/2 h-2.5 w-1.5 rounded-[2px]"
          style={{ background: CONFETTI[i % CONFETTI.length] }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: Math.cos((i / 16) * Math.PI * 2) * (70 + (i % 3) * 30),
            y: Math.sin((i / 16) * Math.PI * 2) * (30 + (i % 4) * 12) - 20,
            rotate: 220 + i * 20,
            opacity: 0,
          }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + (i % 5) * 0.03 }}
        />
      ))}
    </span>
  );
}

/** "Uitslapen! 😴" bovenaan of "Vroeg naar huis! 🏠" onderaan de dag. */
export function EdgeBanner({
  kind,
  date,
  time,
}: {
  kind: "uitslapen" | "vroeg";
  date: string;
  time: Date;
}) {
  const line = useCopy(kind === "uitslapen" ? "uitval.uitslapen" : "uitval.vroeg", {
    tijd: formatTime(time),
  });
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border border-dashed border-[color-mix(in_oklab,var(--sm-good)_55%,transparent)] bg-[color-mix(in_oklab,var(--sm-good)_10%,transparent)] px-3.5 py-3">
      <span className="text-2xl" aria-hidden>
        {kind === "uitslapen" ? "😴" : "🏠"}
      </span>
      <div className="min-w-0">
        <p className="font-display font-semibold text-ink">
          {kind === "uitslapen" ? "Uitslapen!" : "Vroeg naar huis!"}
        </p>
        <p className="text-sm text-ink-2">{line}</p>
      </div>
      <Confetti id={`${date}:${kind}`} />
    </div>
  );
}

/**
 * Een tussenuur in de dag, met een slimme suggestie: huiswerk dat precies in
 * het gat past. Door uitval heet het "Tussenuur! ☕".
 */
export function FreePeriodCard({
  period,
  suggestion,
  subject,
  compact = false,
}: {
  period: FreePeriod;
  suggestion: { homework: Homework; minutes: number } | null;
  subject: (id: string | null) => SubjectAppearance;
  compact?: boolean;
}) {
  const minutes = Math.round(period.minutes);
  const look = suggestion ? subject(suggestion.homework.subjectId) : null;
  const cancelledLine = useCopy(period.cancelled ? "uitval.tussenuur" : null);
  const tip = useCopy(suggestion ? "tussenuur.suggestie" : "tussenuur.vrij", {
    minuten: minutes,
    vak: look?.name ?? "",
    schatting: suggestion?.minutes ?? 0,
  });

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-dashed border-line-strong px-3.5 py-3",
        compact && "py-2",
      )}
    >
      <Coffee size={18} aria-hidden className="mt-0.5 shrink-0 text-ink-3" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {period.cancelled ? "Tussenuur! ☕" : "Tussenuur"}{" "}
          <span className="font-normal text-ink-3 tabular-nums">
            {formatTime(period.start)}–{formatTime(period.end)} · {minutes} min
          </span>
        </p>
        {cancelledLine && <p className="text-sm text-ink-2">{cancelledLine}</p>}
        <p className="mt-0.5 text-sm text-ink-2">{tip}</p>
        {suggestion && (
          <Link
            href={`/huiswerk?item=${suggestion.homework.id}`}
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline"
          >
            Bekijk het huiswerk <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
