"use client";

import { Clock } from "lucide-react";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import type { CopyKey } from "@/content/copy";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatDuration, formatRelativeDay, formatTime } from "@/lib/date";
import type { DayStatus, DayStatusKind } from "@/lib/school/day";
import type { Lesson } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";

const FLAVOR: Partial<Record<DayStatusKind, CopyKey>> = {
  pauze: "nu.pauze",
  tussenuur: "nu.tussenuur",
  "voor-school": "nu.voorSchool",
  "na-school": "nu.klaar",
  vrij: "nu.vrij",
};

const TITLES: Partial<Record<DayStatusKind, string>> = {
  pauze: "Pauze",
  tussenuur: "Tussenuur",
  "voor-school": "Bijna begonnen",
};

function Ring({
  progress,
  label,
  sublabel,
}: {
  progress: number;
  label: string;
  sublabel: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="now-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--sm-accent)" />
            <stop offset="1" stopColor="var(--sm-accent-2)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--sm-line)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#now-ring)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl leading-none font-semibold tracking-tight">
          {label}
        </span>
        <span className="mt-1 text-xs text-ink-3">{sublabel}</span>
      </div>
    </div>
  );
}

function NextUp({
  lesson,
  subject,
  now,
}: {
  lesson: Lesson;
  subject: SubjectAppearance;
  now: Date;
}) {
  const moved = lesson.status === "wijziging";
  const start = new Date(lesson.start);
  const day = formatRelativeDay(start, now);
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5">
      <SubjectBadge subject={subject} size="sm" />
      <p className="min-w-0 flex-1 truncate text-sm text-ink-2">
        <span className="text-ink-3 first-letter:uppercase">
          {day === "vandaag" ? "Hierna" : day} ·{" "}
        </span>
        <span className="font-medium text-ink">{formatTime(start)}</span> {subject.name}
        {lesson.location && <> · {lesson.location}</>}
      </p>
      {moved && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-warn">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-warn opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-warn" />
          </span>
          Ander lokaal
        </span>
      )}
    </div>
  );
}

interface NowWidgetProps {
  status: DayStatus | null;
  /** Eerste les van de volgende schooldag, voor na schooltijd. */
  upcoming: Lesson | null;
  now: Date | null;
  subject: (id: string | null) => SubjectAppearance;
}

/** Nu bezig: vak, lokaal, docent en de minuten tot de bel. */
export function NowWidget({ status, upcoming, now, subject }: NowWidgetProps) {
  const flavor = useCopy(status ? FLAVOR[status.kind] : null, {
    minuten: String(status?.minutesLeft ?? 0),
    tijd: status?.next ? formatTime(new Date(status.next.start)) : "",
  });

  if (!status || !now) {
    return (
      <Widget title="Nu bezig" icon={Clock} size="md">
        <div className="flex items-center gap-5">
          <Skeleton className="size-28 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Widget>
    );
  }

  const { kind, current, next, minutesLeft, progress } = status;

  if (kind === "les" && current) {
    const look = subject(current.subjectId);
    return (
      <Widget title="Nu bezig" icon={Clock} size="md" color={look.color}>
        <div className="flex items-center gap-5">
          <Ring progress={progress ?? 0} label={`${minutesLeft}`} sublabel="min tot de bel" />
          <div className="min-w-0">
            <p className="font-display text-2xl leading-tight font-semibold tracking-tight">
              {look.name}
            </p>
            <p className="mt-1.5 text-ink-2">
              {current.location ?? "Geen lokaal"} · {current.teachers.map((t) => t.code).join(", ")}
            </p>
            <p className="mt-0.5 text-sm text-ink-3">tot {formatTime(new Date(current.end))}</p>
          </div>
        </div>
        {next && <NextUp lesson={next} subject={subject(next.subjectId)} now={now} />}
      </Widget>
    );
  }

  if ((kind === "pauze" || kind === "tussenuur" || kind === "voor-school") && next) {
    const minutes = minutesLeft ?? 0;
    return (
      <Widget title="Nu bezig" icon={Clock} size="md">
        <div className="flex items-center gap-5">
          <Ring
            progress={kind === "voor-school" ? 0 : (progress ?? 0)}
            label={minutes < 60 ? `${minutes}` : formatDuration(minutes)}
            sublabel={minutes < 60 ? "min te gaan" : "te gaan"}
          />
          <div className="min-w-0">
            <p className="font-display text-2xl leading-tight font-semibold tracking-tight">
              {TITLES[kind]}
            </p>
            <p className="mt-1.5 text-ink-2">{flavor}</p>
            <p className="mt-0.5 text-sm text-ink-3">
              {kind === "voor-school" ? "Eerste les om " : "Volgende les om "}
              {formatTime(new Date(next.start))}
            </p>
          </div>
        </div>
        <NextUp lesson={next} subject={subject(next.subjectId)} now={now} />
      </Widget>
    );
  }

  return (
    <Widget title="Nu bezig" icon={Clock} size="md">
      <p className="font-display text-2xl font-semibold tracking-tight">{flavor}</p>
      <p className="mt-1.5 text-ink-2">
        {upcoming
          ? `Volgende les: ${formatRelativeDay(new Date(upcoming.start), now)} om ${formatTime(new Date(upcoming.start))}.`
          : "Geen lessen in zicht."}
      </p>
      {upcoming && <NextUp lesson={upcoming} subject={subject(upcoming.subjectId)} now={now} />}
    </Widget>
  );
}
