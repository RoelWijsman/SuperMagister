"use client";

import { GraduationCap, Hourglass, Palmtree, Sofa } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import { formatDuration, formatShortDate, parseISODate, toISODate } from "@/lib/date";
import { nextHoliday } from "@/lib/school/holidays";
import { useHolidays } from "@/lib/school/use-holidays";
import { examCountdown, weekendCountdown } from "@/lib/today/countdowns";
import { useCopy } from "@/lib/use-copy";

const dagen = (n: number) => (n === 1 ? "dag" : "dagen");

function Row({
  icon: Icon,
  big,
  unit,
  line,
}: {
  icon: typeof Sofa;
  big: string;
  unit: string;
  line: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-glass-strong text-ink">
        <Icon size={19} aria-hidden />
      </span>
      <p className="w-16 shrink-0 text-center leading-none">
        <span className="block font-display text-2xl font-semibold tabular-nums">{big}</span>
        <span className="text-xs text-ink-3">{unit}</span>
      </p>
      <p className="min-w-0 flex-1 text-sm text-ink-2">{line}</p>
    </li>
  );
}

/** Fase 3a: aftellen naar het weekend, de volgende vakantie en (examenklas) het examen. */
export function CountdownWidget({
  now,
  lastBellToday,
  examYear,
}: {
  now: Date | null;
  lastBellToday: Date | null;
  examYear: boolean;
}) {
  const { holidays, region } = useHolidays();
  const weekend = now ? weekendCountdown(now, lastBellToday) : null;
  const holiday = now && holidays ? nextHoliday(holidays, toISODate(now)) : null;
  const exam = now && examYear ? examCountdown(now) : null;

  const weekendLine = useCopy(
    !weekend
      ? null
      : weekend.kind === "weekend"
        ? "aftellen.weekend.nu"
        : weekend.kind === "minuten"
          ? "aftellen.weekend.minuten"
          : "aftellen.weekend.dagen",
    weekend?.kind === "dagen"
      ? { aantal: weekend.days, dagen: dagen(weekend.days) }
      : { tijd: weekend?.kind === "minuten" ? formatDuration(weekend.minutes) : "" },
  );
  const holidayLine = useCopy(
    !holiday
      ? null
      : holiday.state === "komt"
        ? "aftellen.vakantie.komt"
        : holiday.days === 0
          ? "aftellen.vakantie.laatste"
          : "aftellen.vakantie.bezig",
    holiday ? { vakantie: holiday.name, aantal: holiday.days, dagen: dagen(holiday.days) } : {},
  );
  const examLine = useCopy(exam ? "aftellen.examen" : null, {
    aantal: exam?.days ?? 0,
    dagen: dagen(exam?.days ?? 0),
    datum: exam ? formatShortDate(parseISODate(exam.date)) : "",
  });

  return (
    <Widget title="Aftellen" icon={Hourglass}>
      {!weekend ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
      ) : (
        <ul className="space-y-3.5">
          <Row
            icon={Sofa}
            big={
              weekend.kind === "dagen"
                ? String(weekend.days)
                : weekend.kind === "minuten"
                  ? formatDuration(weekend.minutes)
                  : "Nu"
            }
            unit={
              weekend.kind === "dagen"
                ? dagen(weekend.days)
                : weekend.kind === "minuten"
                  ? "nog"
                  : "weekend"
            }
            line={weekendLine}
          />
          {holiday && (
            <Row
              icon={Palmtree}
              big={holiday.days === 0 && holiday.state === "bezig" ? "1" : String(holiday.days)}
              unit={
                holiday.state === "komt"
                  ? dagen(holiday.days)
                  : holiday.days === 0
                    ? "laatste dag"
                    : `${dagen(holiday.days)} vrij`
              }
              line={
                <>
                  {holidayLine} <span className="text-xs text-ink-3">(regio {region})</span>
                </>
              }
            />
          )}
          {exam && (
            <Row
              icon={GraduationCap}
              big={String(exam.days)}
              unit={dagen(exam.days)}
              line={examLine}
            />
          )}
        </ul>
      )}
    </Widget>
  );
}
