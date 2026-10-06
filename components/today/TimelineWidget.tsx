"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatTime } from "@/lib/date";
import { daySegments } from "@/lib/school/day-parts";
import type { Lesson } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";

/** Vanaf deze breedte (px) past een les van 50 minuten met code, tijd en lokaal. */
const MIN_WIDTH = 640;

/** Fase 3a: de dag van vandaag als horizontale tijdlijn. */
export function TimelineWidget({
  lessons,
  now,
  subject,
  isLoading,
}: {
  lessons: Lesson[];
  now: Date | null;
  subject: (id: string | null) => SubjectAppearance;
  isLoading: boolean;
}) {
  const empty = useCopy(!isLoading && lessons.length === 0 ? "leeg.lessenVandaag" : null);
  const segments = daySegments(lessons);
  const start = segments[0]?.start ?? 0;
  const end = segments.at(-1)?.end ?? 1;
  const span = Math.max(1, end - start);
  const at = (t: number) => ((t - start) / span) * 100;
  const nowT = now?.getTime() ?? null;
  const showNow = nowT !== null && nowT >= start && nowT <= end;

  return (
    <Widget
      title="Vandaag"
      icon={CalendarDays}
      action={
        <Link href="/rooster" className="text-sm font-medium text-accent-ink hover:underline">
          Rooster
        </Link>
      }
    >
      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : segments.length === 0 ? (
        <p className="py-6 text-center text-ink-2">{empty}</p>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1 pt-5 pb-1">
          <ol
            aria-label="Lessen van vandaag"
            className="relative h-[6.5rem]"
            style={{ minWidth: MIN_WIDTH }}
          >
            {segments.map((segment) => {
              const left = at(segment.start);
              const width = at(segment.end) - left;
              const style = { left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)` };
              if (segment.kind === "pauze") return null;
              if (segment.kind === "tussenuur") {
                return (
                  <li
                    key={`gat-${segment.start}`}
                    className="absolute inset-y-2 grid place-items-center rounded-2xl border border-dashed border-line-strong text-xs text-ink-3"
                    style={style}
                  >
                    tussenuur
                  </li>
                );
              }
              const lesson = segment.lesson!;
              const look = subject(lesson.subjectId);
              const cancelled = segment.kind === "uitval";
              const current =
                !cancelled && nowT !== null && segment.start <= nowT && nowT < segment.end;
              return (
                <li key={lesson.id} className="absolute inset-y-0" style={style}>
                  <Link
                    href={`/rooster?dag=${lesson.date}`}
                    aria-label={`${look.name}, ${formatTime(new Date(lesson.start))} tot ${formatTime(new Date(lesson.end))}${lesson.location ? `, lokaal ${lesson.location}` : ""}${cancelled ? ", valt uit" : ""}`}
                    className={cn(
                      "flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-2.5 transition-colors",
                      cancelled
                        ? "border-dashed border-line-strong bg-[repeating-linear-gradient(135deg,var(--sm-line)_0_4px,transparent_4px_9px)] text-ink-3"
                        : "border-transparent hover:brightness-110",
                      current && "ring-2 ring-[var(--lesson)]",
                    )}
                    style={
                      cancelled
                        ? undefined
                        : ({
                            "--lesson": look.color,
                            background: `color-mix(in oklab, ${look.color} 22%, transparent)`,
                          } as React.CSSProperties)
                    }
                  >
                    <span
                      className={cn(
                        "truncate text-sm font-semibold",
                        cancelled ? "line-through" : "text-ink",
                      )}
                    >
                      {look.code || look.name}
                    </span>
                    <span
                      className={cn("truncate text-xs", cancelled ? "line-through" : "text-ink-2")}
                    >
                      {formatTime(new Date(lesson.start))}
                    </span>
                    <span className="truncate text-xs text-ink-3">
                      {cancelled ? "valt uit" : (lesson.location ?? "")}
                      {lesson.status === "wijziging" && !cancelled && " · gewijzigd"}
                    </span>
                  </Link>
                </li>
              );
            })}
            {showNow && (
              <li
                aria-hidden
                className="pointer-events-none absolute -inset-y-1 w-0.5 rounded-full bg-ink"
                style={{ left: `${at(nowT!)}%` }}
              >
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full rounded-full bg-ink px-1.5 text-[0.625rem] font-bold text-bg">
                  nu
                </span>
              </li>
            )}
          </ol>
          <div
            className="mt-1.5 flex justify-between text-xs text-ink-3 tabular-nums"
            style={{ minWidth: MIN_WIDTH }}
          >
            <span>{formatTime(new Date(start))}</span>
            <span>{formatTime(new Date(end))}</span>
          </div>
        </div>
      )}
    </Widget>
  );
}
