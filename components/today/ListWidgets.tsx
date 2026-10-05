"use client";

import { CalendarDays, ListChecks, NotebookPen } from "lucide-react";
import Link from "next/link";
import { LessonRow } from "@/components/schedule/LessonRow";
import { SubjectBadge, SubjectDot } from "@/components/subjects/SubjectBadge";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { diffInCalendarDays, formatRelativeDay, parseISODate } from "@/lib/date";
import type { Homework, Lesson, Test, TestKind } from "@/lib/types";

type SubjectLookup = (id: string | null) => SubjectAppearance;

function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

const MoreLink = ({ href, children }: { href: string; children: string }) => (
  <Link href={href} className="text-sm font-medium text-accent-ink hover:underline">
    {children}
  </Link>
);

/** De lessen van vandaag, met de huidige les gemarkeerd. */
export function TodayLessonsWidget({
  lessons,
  currentId,
  subject,
  isLoading,
}: {
  lessons: Lesson[];
  currentId: string | null;
  subject: SubjectLookup;
  isLoading: boolean;
}) {
  return (
    <Widget
      title="Vandaag"
      icon={CalendarDays}
      size="lg"
      className="xl:row-span-2"
      action={<MoreLink href="/rooster">Rooster</MoreLink>}
    >
      {isLoading ? (
        <RowsSkeleton rows={6} />
      ) : lessons.length === 0 ? (
        <p className="py-6 text-center text-ink-2">Geen lessen vandaag. Geniet ervan 🎉</p>
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              subject={subject(lesson.subjectId)}
              isNow={lesson.id === currentId}
            />
          ))}
        </ul>
      )}
    </Widget>
  );
}

/** Huiswerk voor de volgende schooldag. */
export function HomeworkTomorrowWidget({
  items,
  dayLabel,
  subject,
  isLoading,
}: {
  items: Homework[];
  dayLabel: string;
  subject: SubjectLookup;
  isLoading: boolean;
}) {
  return (
    <Widget
      title={`Huiswerk voor ${dayLabel}`}
      icon={ListChecks}
      size="sm"
      action={<MoreLink href="/huiswerk">Alles</MoreLink>}
    >
      {isLoading ? (
        <RowsSkeleton rows={3} />
      ) : items.length === 0 ? (
        <p className="py-4 text-ink-2">Geen huiswerk. Tijd voor de bank 🛋️</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const look = subject(item.subjectId);
            return (
              <li key={item.id} className="flex gap-3">
                <SubjectDot color={look.color} className="mt-1.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {look.name}
                    {item.isTest && (
                      <span className="ml-1.5 text-xs font-medium text-accent-ink">📝 toets</span>
                    )}
                  </p>
                  <p className="line-clamp-2 text-sm text-ink-2">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Widget>
  );
}

const KIND_LABELS: Record<TestKind, string> = {
  toets: "Toets",
  tentamen: "Tentamen",
  schriftelijk: "SO",
  mondeling: "Mondeling",
};

/** Toetsen in de komende twee weken, met aftelling. */
export function TestsWidget({
  tests,
  now,
  subject,
  isLoading,
}: {
  tests: Test[];
  now: Date | null;
  subject: SubjectLookup;
  isLoading: boolean;
}) {
  return (
    <Widget title="Toetsen" icon={NotebookPen} size="sm">
      {isLoading || !now ? (
        <RowsSkeleton rows={3} />
      ) : tests.length === 0 ? (
        <p className="py-4 text-ink-2">Geen toetsen in zicht 😎</p>
      ) : (
        <ul className="space-y-3">
          {tests.map((test) => {
            const look = subject(test.subjectId);
            const date = parseISODate(test.date);
            const days = diffInCalendarDays(date, now);
            return (
              <li key={test.id} className="flex items-center gap-3">
                <SubjectBadge subject={look} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{look.name}</p>
                  <p className="truncate text-xs text-ink-3">
                    {KIND_LABELS[test.kind]} · {formatRelativeDay(date, now)}
                  </p>
                </div>
                <Chip tone={days <= 1 ? "warn" : "neutral"}>
                  {days <= 0 ? "vandaag" : days === 1 ? "morgen" : `${days} dagen`}
                </Chip>
              </li>
            );
          })}
        </ul>
      )}
    </Widget>
  );
}
