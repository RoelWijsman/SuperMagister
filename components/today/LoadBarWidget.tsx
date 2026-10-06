"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Download } from "lucide-react";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatDuration, formatRelativeDay, formatTime, toISODate } from "@/lib/date";
import type { SchoolDayLoad } from "@/lib/school/day-parts";
import type { Lesson } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";
import { useToday } from "@/stores/today";

const BURST_COLORS = ["var(--sm-accent)", "var(--sm-accent-2)", "var(--sm-good)", "#ffd36b"];

/** Een klein feestje bij 100%: snippers die uit de balk springen. */
function Burst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2">
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const distance = 40 + (i % 3) * 22;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 size-2 rounded-[2px]"
            style={{ background: BURST_COLORS[i % BURST_COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * distance * 2.4,
              y: Math.sin(angle) * distance - 10,
              opacity: 0,
              rotate: 240,
            }}
            transition={{ duration: 1.3, ease: "easeOut", delay: (i % 4) * 0.03 }}
          />
        );
      })}
    </span>
  );
}

interface LoadBarWidgetProps {
  load: SchoolDayLoad | null;
  /** Stijlgids: het feestje altijd laten zien, zonder de vlag van vandaag te gebruiken. */
  preview?: boolean;
  /** Eerste les van de volgende schooldag (voor als er vandaag geen school is). */
  upcoming: Lesson | null;
  now: Date | null;
  subject: (id: string | null) => SubjectAppearance;
}

/** Fase 3a: de schooldag als downloadbalk. */
export function LoadBarWidget({
  load,
  preview = false,
  upcoming,
  now,
  subject,
}: LoadBarWidgetProps) {
  const reduced = useReducedMotion();
  const celebrated = useToday((s) => s.celebrated);
  const celebrate = useToday((s) => s.celebrate);
  const today = now ? toISODate(now) : null;
  const done = load?.state === "klaar";
  // "Volgende schooldag": vandaag niks meer, dus de eerstvolgende les.
  const waiting = load && (load.state === "vrij" || load.state === "klaar") ? upcoming : null;

  const sub = useCopy(
    !load
      ? null
      : load.state === "voor"
        ? "laadbalk.voor"
        : load.state === "bezig"
          ? "laadbalk.bezig"
          : load.state === "klaar"
            ? "laadbalk.klaar"
            : "laadbalk.vrij",
    { tijd: load?.start ? formatTime(load.start) : "" },
  );

  // Eén feestje per dag, op het moment dat je de voltooide balk voor het eerst ziet.
  const party = done && today !== null && (preview || celebrated !== today);
  useEffect(() => {
    if (!party || !today || preview) return;
    const id = setTimeout(() => celebrate(today), 1600);
    return () => clearTimeout(id);
  }, [party, today, celebrate, preview]);

  if (!load || !now) {
    return (
      <Widget title="Schooldag" icon={Download}>
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-3 h-4 w-full rounded-full" />
      </Widget>
    );
  }

  const progress = load.state === "klaar" ? 1 : load.percent / 100;
  const next = waiting
    ? `Volgende schooldag start ${formatRelativeDay(new Date(waiting.start), now)} ${formatTime(new Date(waiting.start))}`
    : null;
  const headline =
    load.state === "bezig"
      ? `Schooldag ${load.percent}% geladen · nog ${formatDuration(load.minutesLeft)}`
      : load.state === "voor"
        ? `Schooldag 0% · start om ${formatTime(load.start!)}`
        : load.state === "klaar"
          ? "Download voltooid ✅"
          : (next ?? "Geen schooldag in zicht");

  return (
    <Widget title="Schooldag" icon={Download}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p
          className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
          aria-live="polite"
        >
          {headline}
        </p>
        <p className="text-sm text-ink-2">
          {load.state === "klaar" && next && <span className="text-ink">{next}. </span>}
          {sub}
        </p>
      </div>

      <div className="relative mt-3.5">
        {load.segments.length > 0 ? (
          <div
            role="progressbar"
            aria-label="Schooldag"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="relative h-4 w-full"
          >
            {load.segments.map((segment) => {
              const width = segment.to - segment.from;
              const fill = Math.min(1, Math.max(0, (progress - segment.from) / width));
              const lesson = segment.kind === "les";
              const color = lesson ? subject(segment.lesson?.subjectId ?? null).color : undefined;
              return (
                <span
                  key={`${segment.start}-${segment.kind}`}
                  className={cn(
                    "absolute inset-y-0 overflow-hidden",
                    lesson ? "rounded-full bg-glass-strong" : "inset-y-1 rounded-full",
                    segment.kind === "pauze" &&
                      "bg-[repeating-linear-gradient(90deg,var(--sm-line)_0_3px,transparent_3px_6px)]",
                    segment.kind !== "les" &&
                      segment.kind !== "pauze" &&
                      "bg-[repeating-linear-gradient(135deg,var(--sm-line)_0_4px,transparent_4px_8px)]",
                  )}
                  style={{
                    left: `calc(${segment.from * 100}% + 1.5px)`,
                    width: `calc(${width * 100}% - 3px)`,
                  }}
                  title={
                    lesson
                      ? `${subject(segment.lesson?.subjectId ?? null).name} ${formatTime(new Date(segment.start))}–${formatTime(new Date(segment.end))}`
                      : segment.kind
                  }
                >
                  {lesson && fill > 0 && (
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full",
                        done
                          ? "bg-good"
                          : "bg-[linear-gradient(90deg,var(--sm-accent),var(--sm-accent-2))]",
                      )}
                      style={{ width: `${fill * 100}%` }}
                    >
                      {!done && fill < 1 && (
                        <span className="absolute inset-0 animate-[download-stripes_1s_linear_infinite] bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.25)_0_6px,transparent_6px_12px)] bg-[length:17px_17px] motion-reduce:animate-none" />
                      )}
                    </span>
                  )}
                  {lesson && color && fill === 0 && (
                    <span
                      className="absolute inset-y-0 left-0 w-1 rounded-full opacity-70"
                      style={{ background: color }}
                    />
                  )}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="h-4 w-full rounded-full border border-dashed border-line-strong" />
        )}
        {party && !reduced && <Burst />}
      </div>

      {load.start && load.end && (
        <div className="mt-1.5 flex justify-between text-xs text-ink-3 tabular-nums">
          <span>{formatTime(load.start)}</span>
          <span>{formatTime(load.end)}</span>
        </div>
      )}
    </Widget>
  );
}
