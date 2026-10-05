"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { useLessons, useSubjectAppearance, weekRange } from "@/lib/data/hooks";
import {
  addDays,
  DAY_NAMES,
  formatShortDate,
  formatTime,
  isoWeek,
  parseISODate,
  startOfWeek,
  toISODate,
} from "@/lib/date";
import { useNow } from "@/lib/hooks";
import { isTestInfoType } from "@/lib/school/derive";
import type { Lesson } from "@/lib/types";
import { LessonRow } from "./LessonRow";

const byStart = (a: Lesson, b: Lesson) => a.start.localeCompare(b.start);

function daySummary(lessons: Lesson[]): string {
  const active = lessons.filter((l) => l.status !== "uitval");
  if (active.length === 0) return "Alles valt uit 🎉";
  const first = active[0]!;
  const last = active[active.length - 1]!;
  const tests = active.filter((l) => isTestInfoType(l.infoType)).length;
  const parts = [
    `${active.length} ${active.length === 1 ? "les" : "lessen"}`,
    `${formatTime(new Date(first.start))}–${formatTime(new Date(last.end))}`,
  ];
  if (tests) parts.push(`${tests} ${tests === 1 ? "toets" : "toetsen"}`);
  return parts.join(" · ");
}

function DaySkeleton() {
  return (
    <GlassPanel>
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

/**
 * Rooster per week, als lijst. Fase 3 voegt de dag-, week- en maandweergave,
 * stempels bij uitval en de wijzigingen-detector toe.
 */
export function ScheduleView() {
  const params = useSearchParams();
  const router = useRouter();
  const focusDate = params.get("dag");
  const now = useNow(60_000);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(focusDate ? parseISODate(focusDate) : new Date()),
  );

  // Een nieuwe ?dag= (bijv. vanuit de command palette) springt naar die week.
  const [lastFocus, setLastFocus] = useState(focusDate);
  if (focusDate !== lastFocus) {
    setLastFocus(focusDate);
    if (focusDate) setWeekStart(startOfWeek(parseISODate(focusDate)));
  }

  const range = useMemo(() => weekRange(weekStart), [weekStart]);
  const lessons = useLessons(range);
  const subjects = useSubjectAppearance();
  const todayIso = now ? toISODate(now) : null;

  const days = useMemo(() => {
    const result: { date: string; lessons: Lesson[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = toISODate(addDays(weekStart, i));
      const list = (lessons.data ?? []).filter((l) => l.date === date).sort(byStart);
      if (list.length > 0 || i < 5) result.push({ date, lessons: list });
    }
    return result;
  }, [lessons.data, weekStart]);

  const stats = useMemo(() => {
    const all = lessons.data ?? [];
    return {
      total: all.filter((l) => l.status !== "uitval").length,
      cancelled: all.filter((l) => l.status === "uitval").length,
      moved: all.filter((l) => l.status === "wijziging").length,
      tests: all.filter((l) => isTestInfoType(l.infoType) && l.status !== "uitval").length,
    };
  }, [lessons.data]);

  useEffect(() => {
    if (!focusDate || !lessons.data) return;
    document
      .getElementById(`dag-${focusDate}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusDate, lessons.data]);

  const { week } = isoWeek(weekStart);
  const shift = (weeks: number) => {
    setWeekStart((current) => addDays(current, weeks * 7));
    if (focusDate) router.replace("/rooster", { scroll: false });
  };

  return (
    <>
      <PageHeader
        eyebrow={`Week ${week} · ${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 4))}`}
        title="Rooster"
        subtitle={
          lessons.data
            ? `Deze week: ${stats.total} lessen, ${stats.cancelled} uitgevallen, ${stats.moved} ${stats.moved === 1 ? "lokaalwijziging" : "lokaalwijzigingen"}, ${stats.tests} ${stats.tests === 1 ? "toets" : "toetsen"}`
            : undefined
        }
        actions={
          <>
            <Button
              variant="glass"
              size="icon"
              icon={ChevronLeft}
              aria-label="Vorige week"
              onClick={() => shift(-1)}
            />
            <Button variant="glass" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Deze week
            </Button>
            <Button
              variant="glass"
              size="icon"
              icon={ChevronRight}
              aria-label="Volgende week"
              onClick={() => shift(1)}
            />
          </>
        }
      />

      {!lessons.data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <LoadingQuip topic="rooster" className="lg:col-span-2" />
          <DaySkeleton />
          <DaySkeleton />
        </div>
      ) : (
        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          {days.map(({ date, lessons: list }) => {
            const day = parseISODate(date);
            const isToday = date === todayIso;
            const isFocus = date === focusDate;
            return (
              <GlassPanel
                key={date}
                as="section"
                id={`dag-${date}`}
                aria-label={`${DAY_NAMES[day.getDay()]} ${formatShortDate(day)}`}
                className={cn(
                  "scroll-mt-24",
                  (isToday || isFocus) &&
                    "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--sm-accent)_45%,transparent),var(--sm-shadow)]",
                )}
              >
                <header className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
                    <span className="capitalize">{DAY_NAMES[day.getDay()]}</span>
                    <span className="font-sans text-sm font-medium tracking-normal whitespace-nowrap text-ink-3">
                      {formatShortDate(day)}
                    </span>
                    {isToday && <Chip tone="accent">vandaag</Chip>}
                  </h2>
                  {list.length > 0 && (
                    <p className="text-sm text-ink-3 sm:text-right">{daySummary(list)}</p>
                  )}
                </header>
                {list.length === 0 ? (
                  <p className="py-4 text-ink-2">Geen lessen. Lekker.</p>
                ) : (
                  <ul className="-mx-2 space-y-0.5">
                    {list.map((lesson) => {
                      const isNow =
                        !!now &&
                        new Date(lesson.start) <= now &&
                        now < new Date(lesson.end) &&
                        lesson.status !== "uitval";
                      return (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          subject={subjects.get(lesson.subjectId)}
                          isNow={isNow}
                        />
                      );
                    })}
                  </ul>
                )}
              </GlassPanel>
            );
          })}
        </div>
      )}
    </>
  );
}
