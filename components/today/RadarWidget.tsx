"use client";

import { CalendarDays, Radar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatLongDate, formatRelativeDay, formatTime, parseISODate } from "@/lib/date";
import { radarDots, RADAR_DAYS, type RadarDot } from "@/lib/today/radar";
import type { Test, TestKind } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";

export const TEST_KIND_LABELS: Readonly<Record<TestKind, string>> = {
  toets: "Toets",
  tentamen: "Tentamen",
  schriftelijk: "SO",
  mondeling: "Mondeling",
};

const dagen = (n: number) => (n === 1 ? "dag" : "dagen");
const when = (days: number) =>
  days === 0 ? "vandaag" : days === 1 ? "morgen" : `over ${days} ${dagen(days)}`;

/** Stof en aftellen van één toets. */
function TestDetails({ dot }: { dot: RadarDot }) {
  const { test, days } = dot;
  const countdown = useCopy(
    days === 0 ? "radar.vandaag" : days === 1 ? "radar.morgen" : "radar.aftellen",
    { aantal: days, dagen: dagen(days) },
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="accent">{TEST_KIND_LABELS[test.kind]}</Chip>
        <Chip tone={days <= 1 ? "warn" : "neutral"}>{when(days)}</Chip>
      </div>
      <p className="font-display text-lg font-semibold">{countdown}</p>
      <p className="text-sm text-ink-2">
        {formatLongDate(parseISODate(test.date))} om {formatTime(new Date(test.start))}
      </p>
      <div>
        <h3 className="mb-1.5 text-sm font-semibold text-ink">Stof</h3>
        {test.html ? (
          <SafeHtml html={test.html} className="text-sm text-ink-2" />
        ) : (
          <p className="text-sm text-ink-3">Je docent heeft (nog) geen stof opgegeven.</p>
        )}
      </div>
      <Link
        href={`/rooster?dag=${test.date}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
      >
        <CalendarDays size={16} aria-hidden />
        Bekijk in je rooster
      </Link>
    </div>
  );
}

/** Fase 3a: toetsen in de komende twee weken als stipjes op een radar. */
export function RadarWidget({
  tests,
  now,
  subject,
  isLoading,
}: {
  tests: Test[];
  now: Date | null;
  subject: (id: string | null) => SubjectAppearance;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState<RadarDot | null>(null);
  const dots = now ? radarDots(tests, now) : [];
  const empty = useCopy(!isLoading && now && dots.length === 0 ? "leeg.toetsen" : null);
  const first = dots[0];

  return (
    <Widget title="Toets-radar" icon={Radar}>
      {isLoading || !now ? (
        <Skeleton className="mx-auto aspect-square w-full max-w-60 rounded-full" />
      ) : (
        <>
          <div className="relative mx-auto aspect-square w-full max-w-60">
            {/* Ringen: vandaag in het midden, over twee weken aan de rand. */}
            {[1, 0.5].map((scale) => (
              <span
                key={scale}
                aria-hidden
                className="absolute rounded-full border border-line"
                style={{ inset: `${(1 - scale) * 50}%` }}
              />
            ))}
            <span
              aria-hidden
              className="absolute inset-1/2 size-1.5 -translate-1/2 rounded-full bg-ink-3"
            />
            <span
              aria-hidden
              className="absolute inset-0 animate-[radar-sweep_4.5s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,color-mix(in_oklab,var(--sm-accent)_35%,transparent)_360deg)] motion-reduce:animate-none"
            />
            {dots.map((dot) => {
              const look = subject(dot.test.subjectId);
              const big = dot.test.kind === "toets" || dot.test.kind === "tentamen";
              const x = 50 + Math.cos(dot.angle) * dot.radius * 46;
              const y = 50 + Math.sin(dot.angle) * dot.radius * 46;
              return (
                <button
                  key={dot.test.id}
                  type="button"
                  onClick={() => setOpen(dot)}
                  aria-label={`${look.name}, ${TEST_KIND_LABELS[dot.test.kind]}, ${when(dot.days)}`}
                  title={`${look.name} · ${when(dot.days)}`}
                  className="absolute grid size-9 -translate-1/2 place-items-center rounded-full outline-offset-2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span
                    aria-hidden
                    className="absolute rounded-full motion-safe:animate-[radar-ping_2.4s_ease-out_infinite]"
                    style={{
                      background: look.color,
                      width: big ? 14 : 10,
                      height: big ? 14 : 10,
                      animationDelay: `${(dot.angle * 400) % 2400}ms`,
                    }}
                  />
                  <span
                    aria-hidden
                    className="relative rounded-full ring-2 ring-[var(--sm-bg)]"
                    style={{ background: look.color, width: big ? 14 : 10, height: big ? 14 : 10 }}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-sm text-ink-2">
            {first ? (
              <>
                Eerst:{" "}
                <span className="font-semibold text-ink">{subject(first.test.subjectId).name}</span>{" "}
                {first.days <= 1
                  ? when(first.days)
                  : formatRelativeDay(parseISODate(first.test.date), now)}
              </>
            ) : (
              empty
            )}
          </p>
          <p className="mt-0.5 text-center text-xs text-ink-3">
            Midden is vandaag, de rand is over {RADAR_DAYS} dagen.
          </p>
        </>
      )}
      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open ? subject(open.test.subjectId).name : "Toets"}
        size="sm"
      >
        {open && <TestDetails dot={open} />}
      </Sheet>
    </Widget>
  );
}
