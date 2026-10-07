"use client";

import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { parseISODate } from "@/lib/date";
import type { MonthCell } from "@/lib/schedule/month";
import { isTestInfoType } from "@/lib/school/derive";
import type { Lesson } from "@/lib/types";

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

/** Fase 3b: de maand, met stipjes voor toetsen. Tik op een dag voor de dagweergave. */
export function MonthView({
  grid,
  lessonsByDate,
  subject,
  today,
  focus,
  onPick,
}: {
  grid: MonthCell[][];
  lessonsByDate: ReadonlyMap<string, Lesson[]>;
  subject: (id: string | null) => SubjectAppearance;
  today: string | null;
  focus: string;
  onPick: (date: string) => void;
}) {
  return (
    <div role="grid" aria-label="Maand" className="select-none">
      <div role="row" className="mb-2 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            role="columnheader"
            className="text-center text-xs font-medium text-ink-3 uppercase"
          >
            {day}
          </span>
        ))}
      </div>
      {grid.map((week) => (
        <div key={week[0]!.date} role="row" className="mb-1.5 grid grid-cols-7 gap-1.5">
          {week.map((cell) => {
            const lessons = lessonsByDate.get(cell.date) ?? [];
            const tests = lessons.filter(
              (l) => l.status !== "uitval" && isTestInfoType(l.infoType),
            );
            const cancelled = lessons.filter((l) => l.status === "uitval").length;
            const date = parseISODate(cell.date);
            const isToday = cell.date === today;
            return (
              <button
                key={cell.date}
                type="button"
                role="gridcell"
                onClick={() => onPick(cell.date)}
                aria-label={`${date.getDate()} ${date.toLocaleDateString("nl-NL", { month: "long" })}${lessons.length ? `, ${lessons.length - cancelled} lessen` : ""}${tests.length ? `, ${tests.length} ${tests.length === 1 ? "toets" : "toetsen"}` : ""}`}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "flex aspect-square min-h-11 flex-col items-center justify-between rounded-2xl border p-1.5 transition-colors sm:aspect-[4/3] sm:items-start",
                  cell.inMonth
                    ? "border-line bg-glass hover:bg-glass-strong"
                    : "border-transparent opacity-40",
                  cell.date === focus &&
                    "border-[color-mix(in_oklab,var(--sm-accent)_60%,transparent)]",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-sm font-semibold tabular-nums",
                    isToday
                      ? "bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent"
                      : "text-ink",
                  )}
                >
                  {date.getDate()}
                </span>
                <span className="flex flex-wrap justify-center gap-1 sm:justify-start">
                  {tests.map((lesson) => (
                    <span
                      key={lesson.id}
                      aria-hidden
                      className="size-2 rounded-full ring-1 ring-[var(--sm-bg)]"
                      style={{ background: subject(lesson.subjectId).color }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      ))}
      <p className="mt-2 text-xs text-ink-3">Een stipje is een toets, in de kleur van het vak.</p>
    </div>
  );
}
