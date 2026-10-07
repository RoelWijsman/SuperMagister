"use client";

import type { SubjectAppearance } from "@/lib/data/hooks";
import { toISODate } from "@/lib/date";
import { freePeriods, suggestForGap, type FreePeriod } from "@/lib/schedule/gaps";
import { dayEdges } from "@/lib/schedule/summary";
import type { Homework, Lesson } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";
import { EdgeBanner, FreePeriodCard } from "./DayParts";
import { LessonCard } from "./LessonCard";

export interface AgendaContext {
  subject: (id: string | null) => SubjectAppearance;
  now: Date | null;
  /** Lessen met een wijziging die je nog niet gezien hebt. */
  unseen: ReadonlySet<string>;
  markSeen: (lessonId: string) => void;
  open: (lesson: Lesson) => void;
  /** Huiswerk dat nog moet, voor de slimme tussenuren (met je eigen tijd als die er is). */
  upcomingHomework: readonly (Homework & { minutes?: number })[];
  /** Lessen met huiswerk (voor het icoontje op de kaart). */
  homeworkLessons: ReadonlySet<string>;
}

type Item =
  { kind: "les"; at: number; lesson: Lesson } | { kind: "gat"; at: number; period: FreePeriod };

/** Lege dag in het rooster. Elke dag een andere variant. */
function EmptyDay() {
  const text = useCopy("leeg.roosterDag");
  return <p className="py-4 text-ink-2">{text}</p>;
}

/**
 * Eén dag als rij kaarten: uitslapen bovenaan, lessen en tussenuren op
 * volgorde (met een slimme suggestie), vroeg naar huis onderaan.
 */
export function DayAgenda({
  date,
  lessons,
  context,
}: {
  date: string;
  lessons: readonly Lesson[];
  context: AgendaContext;
}) {
  if (lessons.length === 0) return <EmptyDay />;
  const { subject, now, unseen, markSeen, open, upcomingHomework, homeworkLessons } = context;
  const edges = dayEdges(lessons);
  const items: Item[] = [
    ...lessons.map((lesson) => ({ kind: "les" as const, at: +new Date(lesson.start), lesson })),
    ...freePeriods(lessons).map((period) => ({ kind: "gat" as const, at: +period.start, period })),
  ].sort((a, b) => a.at - b.at || (a.kind === "les" ? -1 : 1));
  const today = now ? toISODate(now) : date;

  return (
    <div className="space-y-2">
      {edges.sleepIn && <EdgeBanner kind="uitslapen" date={date} time={edges.sleepIn.until} />}
      {items.map((item) => {
        if (item.kind === "gat") {
          return (
            <FreePeriodCard
              key={`gat-${item.at}`}
              period={item.period}
              suggestion={suggestForGap(
                item.period.minutes,
                upcomingHomework,
                date < today ? today : date,
              )}
              subject={subject}
            />
          );
        }
        const { lesson } = item;
        const isNow =
          !!now &&
          lesson.status !== "uitval" &&
          new Date(lesson.start) <= now &&
          now < new Date(lesson.end);
        return (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            subject={subject(lesson.subjectId)}
            hasHomework={homeworkLessons.has(lesson.id)}
            isNow={isNow}
            unseen={unseen.has(lesson.id)}
            onSeen={() => markSeen(lesson.id)}
            onOpen={() => open(lesson)}
          />
        );
      })}
      {edges.homeEarly && <EdgeBanner kind="vroeg" date={date} time={edges.homeEarly.from} />}
    </div>
  );
}
