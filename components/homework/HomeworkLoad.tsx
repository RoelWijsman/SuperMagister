"use client";

import { Gauge } from "lucide-react";
import { LOAD_STYLES } from "@/components/schedule/WeekView";
import { cn } from "@/lib/cn";
import { DAY_NAMES, DAY_NAMES_SHORT, formatDuration, parseISODate } from "@/lib/date";
import type { DayLoad } from "@/lib/homework/overview";
import { useCopy } from "@/lib/use-copy";

const label = (minutes: number) => (minutes > 0 ? `±${formatDuration(minutes)}` : "niks");

/**
 * Fase 3c: de drukte-meter. Per schooldag hoeveel huiswerk er nog open staat
 * (in tijd), met een zin als een dag zwaar wordt. Tik op een dag om erheen te gaan.
 */
export function HomeworkLoad({
  days,
  onPick,
}: {
  days: readonly DayLoad[];
  onPick?: (date: string) => void;
}) {
  const busiest = [...days].sort((a, b) => b.minutes - a.minutes)[0];
  const heavy = busiest && (busiest.level === "druk" || busiest.level === "zwaar");
  const line = useCopy(heavy ? "huiswerk.drukte" : null, {
    dag: busiest ? (DAY_NAMES[parseISODate(busiest.date).getDay()] ?? "") : "",
    tijd: busiest ? formatDuration(busiest.minutes) : "",
  });
  const max = Math.max(60, ...days.map((day) => day.minutes));

  return (
    <section aria-labelledby="drukte-titel" className="mb-6">
      <h2
        id="drukte-titel"
        className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink-2"
      >
        <Gauge size={16} aria-hidden />
        Drukte per dag
      </h2>
      <ol
        className="grid items-end gap-2"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const date = parseISODate(day.date);
          const content = (
            <>
              <span className="flex h-16 items-end">
                <span
                  className={cn(
                    "block w-full rounded-lg transition-[height] duration-500",
                    LOAD_STYLES[day.level].bar,
                  )}
                  style={{ height: `${Math.max(6, (day.minutes / max) * 100)}%` }}
                />
              </span>
              <span className="mt-1.5 block text-center text-xs leading-tight">
                <span className="block font-medium text-ink-2 capitalize">
                  {DAY_NAMES_SHORT[date.getDay()]}
                </span>
                <span className="text-ink-3 tabular-nums">{label(day.minutes)}</span>
              </span>
            </>
          );
          const description = `${DAY_NAMES[date.getDay()]}: ${
            day.total === 0
              ? "geen huiswerk"
              : `${day.open} van ${day.total} open, ${label(day.minutes)}`
          }`;
          return (
            <li key={day.date}>
              {onPick && day.total > 0 ? (
                <button
                  type="button"
                  onClick={() => onPick(day.date)}
                  aria-label={description}
                  className="block w-full rounded-xl px-1 pt-1 pb-1 transition-colors hover:bg-glass"
                >
                  {content}
                </button>
              ) : (
                <div aria-label={description} role="img" className="px-1 pt-1 pb-1">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {line && <p className="mt-2 text-sm text-ink-2 first-letter:uppercase">{line}</p>}
    </section>
  );
}
