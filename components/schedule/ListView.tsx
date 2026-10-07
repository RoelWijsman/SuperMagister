"use client";

import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/cn";
import { DAY_NAMES, formatShortDate, parseISODate } from "@/lib/date";
import { daySummary } from "@/lib/schedule/summary";
import { DayAgenda, type AgendaContext } from "./DayAgenda";
import type { ScheduleDay } from "./WeekView";

/** Fase 3b: de week als lijst, dag voor dag. */
export function ListView({
  days,
  today,
  focus,
  context,
}: {
  days: readonly ScheduleDay[];
  today: string | null;
  /** Dag uit de link (?dag=), krijgt een rand. */
  focus: string | null;
  context: AgendaContext;
}) {
  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
      {days.map((day) => {
        const date = parseISODate(day.date);
        const isToday = day.date === today;
        return (
          <GlassPanel
            key={day.date}
            as="section"
            id={`dag-${day.date}`}
            aria-label={`${DAY_NAMES[date.getDay()]} ${formatShortDate(date)}`}
            className={cn(
              "scroll-mt-24",
              (isToday || day.date === focus) &&
                "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--sm-accent)_45%,transparent),var(--sm-shadow)]",
            )}
          >
            <header className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                <span className="capitalize">{DAY_NAMES[date.getDay()]}</span>
                <span className="font-sans text-sm font-medium tracking-normal whitespace-nowrap text-ink-3">
                  {formatShortDate(date)}
                </span>
                {isToday && <Chip tone="accent">vandaag</Chip>}
              </h2>
              {day.lessons.length > 0 && (
                <p className="text-sm text-ink-3 sm:text-right">
                  {daySummary(day.lessons, day.homeworkCount)}
                </p>
              )}
            </header>
            <DayAgenda date={day.date} lessons={day.lessons} context={context} />
          </GlassPanel>
        );
      })}
    </div>
  );
}
