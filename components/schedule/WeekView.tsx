"use client";

import { AlertTriangle, Coffee, Rabbit, Snail } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import {
  DAY_NAMES,
  DAY_NAMES_SHORT,
  formatShortDate,
  formatTime,
  parseISODate,
  toISODate,
} from "@/lib/date";
import { freePeriods } from "@/lib/schedule/gaps";
import {
  BUSY_WEEK_TESTS,
  dayLoad,
  daySummary,
  longestAndShortest,
  type LoadLevel,
} from "@/lib/schedule/summary";
import { isTestInfoType } from "@/lib/school/derive";
import type { Lesson } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";
import type { AgendaContext } from "./DayAgenda";
import { LessonCard } from "./LessonCard";

export interface ScheduleDay {
  date: string;
  lessons: Lesson[];
  homeworkCount: number;
}

/** Pixels per minuut op de tijdas. */
const PX = 1.15;

export const LOAD_STYLES: Readonly<Record<LoadLevel, { bar: string; label: string }>> = {
  vrij: { bar: "bg-line", label: "vrij" },
  rustig: { bar: "bg-good", label: "rustig" },
  normaal: { bar: "bg-[var(--sm-accent)]", label: "normaal" },
  druk: { bar: "bg-warn", label: "druk" },
  zwaar: { bar: "bg-bad", label: "zwaar" },
};

const testCount = (lessons: readonly Lesson[]) =>
  lessons.filter((l) => l.status !== "uitval" && isTestInfoType(l.infoType)).length;

/** "⚠️ Drukke week: 3 toetsen" vanaf drie toetsen. */
export function BusyWeek({ tests }: { tests: number }) {
  const line = useCopy(tests >= BUSY_WEEK_TESTS ? "rooster.druk" : null);
  if (tests < BUSY_WEEK_TESTS) return null;
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--sm-warn)_50%,transparent)] bg-[color-mix(in_oklab,var(--sm-warn)_12%,transparent)] px-4 py-3"
    >
      <AlertTriangle size={18} aria-hidden className="mt-0.5 shrink-0 text-warn" />
      <p className="text-sm text-ink">
        <span className="font-semibold">⚠️ Drukke week: {tests} toetsen.</span>{" "}
        <span className="text-ink-2">{line}</span>
      </p>
    </div>
  );
}

/**
 * De weekbelasting: per dag een kleurbalk met hoe druk die dag is. Met
 * `onPick` is het ook een dagkiezer (dagweergave).
 */
export function WeekLoad({
  days,
  focus,
  onPick,
}: {
  days: readonly ScheduleDay[];
  focus?: string;
  onPick?: (date: string) => void;
}) {
  return (
    <ol
      aria-label="Weekbelasting"
      className="mb-4 grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
    >
      {days.map((day) => {
        const { level, score } = dayLoad(day.lessons, day.homeworkCount, testCount(day.lessons));
        const date = parseISODate(day.date);
        const name = DAY_NAMES_SHORT[date.getDay()];
        const content = (
          <>
            <span className={cn("block h-2 rounded-full", LOAD_STYLES[level].bar)} />
            <span className="mt-1 block text-center text-xs leading-tight text-ink-3">
              <span
                className={cn(
                  "block font-medium capitalize",
                  day.date === focus ? "font-semibold text-ink" : "text-ink-2",
                )}
              >
                {name}
              </span>
              {LOAD_STYLES[level].label}
            </span>
          </>
        );
        return (
          <li key={day.date} title={`Belasting ${score}`}>
            {onPick ? (
              <button
                type="button"
                onClick={() => onPick(day.date)}
                aria-current={day.date === focus ? "date" : undefined}
                aria-label={`${DAY_NAMES[date.getDay()]} ${formatShortDate(date)}, ${LOAD_STYLES[level].label}`}
                className={cn(
                  "block w-full rounded-xl px-1 pt-1.5 pb-1 transition-colors hover:bg-glass",
                  day.date === focus && "bg-glass",
                )}
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}

const span = (lessons: readonly Lesson[]) => {
  const active = lessons.filter((l) => l.status !== "uitval");
  return active.length
    ? `${formatTime(new Date(active[0]!.start))}–${formatTime(new Date(active.at(-1)!.end))}`
    : "";
};

/** Langste en kortste dag van de week, met een slak en een haas. */
export function WeekFacts({ days }: { days: readonly ScheduleDay[] }) {
  const facts = longestAndShortest(days);
  if (!facts) return null;
  const describe = (iso: string) => {
    const day = days.find((d) => d.date === iso);
    return `${DAY_NAMES[parseISODate(iso).getDay()]}, ${span(day?.lessons ?? [])}`;
  };
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Chip>
        <Snail size={14} aria-hidden />
        Langste dag: {describe(facts.longest)}
      </Chip>
      <Chip>
        <Rabbit size={14} aria-hidden />
        Kortste dag: {describe(facts.shortest)}
      </Chip>
    </div>
  );
}

/** Fase 3b: de week als rooster op een tijdas, met een live "nu"-lijn. */
export function WeekView({
  days,
  context,
}: {
  days: readonly ScheduleDay[];
  context: AgendaContext;
}) {
  const { subject, now, unseen, markSeen, open, homeworkLessons } = context;
  const all = days.flatMap((d) => d.lessons);
  const minutesOf = (iso: string) => {
    const date = new Date(iso);
    return date.getHours() * 60 + date.getMinutes();
  };
  const top = all.length
    ? Math.floor(Math.min(...all.map((l) => minutesOf(l.start))) / 60) * 60
    : 8 * 60;
  const bottom = all.length
    ? Math.ceil(Math.max(...all.map((l) => minutesOf(l.end))) / 60) * 60
    : 16 * 60;
  const height = (bottom - top) * PX;
  const hours = Array.from({ length: (bottom - top) / 60 + 1 }, (_, i) => top + i * 60);
  const todayIso = now ? toISODate(now) : null;
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : null;

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2">
      <div
        className="grid min-w-[720px] gap-2"
        style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div />
        {days.map((day) => {
          const date = parseISODate(day.date);
          const isToday = day.date === todayIso;
          return (
            <div key={day.date} className="pb-2">
              <p className={cn("text-sm font-semibold", isToday ? "text-accent-ink" : "text-ink")}>
                <span className="capitalize">{DAY_NAMES_SHORT[date.getDay()]}</span>{" "}
                <span className="font-normal text-ink-3">{formatShortDate(date)}</span>
              </p>
              <p
                className="truncate text-xs text-ink-3"
                title={daySummary(day.lessons, day.homeworkCount)}
              >
                {day.lessons.length ? daySummary(day.lessons, day.homeworkCount) : "geen lessen"}
              </p>
            </div>
          );
        })}

        {/* Tijdas */}
        <div className="relative" style={{ height }}>
          {hours.map((minute) => (
            <span
              key={minute}
              className="absolute right-1 -translate-y-1/2 text-[0.6875rem] text-ink-3 tabular-nums"
              style={{ top: (minute - top) * PX }}
            >
              {String(minute / 60).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        {days.map((day) => {
          const isToday = day.date === todayIso;
          return (
            <div
              key={day.date}
              className={cn(
                "relative rounded-2xl border border-line",
                isToday && "bg-[color-mix(in_oklab,var(--sm-accent)_6%,transparent)]",
              )}
              style={{ height }}
            >
              {hours.slice(1, -1).map((minute) => (
                <span
                  key={minute}
                  aria-hidden
                  className="absolute inset-x-0 border-t border-dashed border-line"
                  style={{ top: (minute - top) * PX }}
                />
              ))}
              {/* Uitval heeft zijn eigen stempel; hier alleen de echte gaten. */}
              {freePeriods(day.lessons)
                .filter((period) => !period.cancelled)
                .map((period) => (
                  <span
                    key={+period.start}
                    className="absolute inset-x-1 flex items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-[0.6875rem] text-ink-3"
                    style={{
                      top:
                        (period.start.getHours() * 60 + period.start.getMinutes() - top) * PX + 2,
                      height: period.minutes * PX - 4,
                    }}
                    title={`Tussenuur ${formatTime(period.start)}–${formatTime(period.end)}`}
                  >
                    <Coffee size={12} aria-hidden />
                    tussenuur
                  </span>
                ))}
              {day.lessons.map((lesson) => {
                const start = minutesOf(lesson.start);
                const end = minutesOf(lesson.end);
                const isNow =
                  !!now &&
                  lesson.status !== "uitval" &&
                  new Date(lesson.start) <= now &&
                  now < new Date(lesson.end);
                return (
                  <LessonCard
                    key={lesson.id}
                    compact
                    lesson={lesson}
                    subject={subject(lesson.subjectId)}
                    hasHomework={homeworkLessons.has(lesson.id)}
                    isNow={isNow}
                    unseen={unseen.has(lesson.id)}
                    onSeen={() => markSeen(lesson.id)}
                    onOpen={() => open(lesson)}
                    className="absolute inset-x-1"
                    style={{ top: (start - top) * PX + 2, height: (end - start) * PX - 4 }}
                  />
                );
              })}
              {isToday && nowMinutes !== null && nowMinutes >= top && nowMinutes <= bottom && (
                <span
                  aria-label={`Nu, ${formatTime(now!)}`}
                  role="img"
                  className="pointer-events-none absolute -inset-x-1 z-10 h-0.5 bg-bad"
                  style={{ top: (nowMinutes - top) * PX }}
                >
                  <span className="absolute -top-[5px] -left-1 size-3 rounded-full bg-bad" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
