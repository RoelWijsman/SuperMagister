"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { daysRange, useAccount, useLessons, useSubjectAppearance } from "@/lib/data/hooks";
import { formatLongDate, formatRelativeDay, nextWeekday, startOfDay, toISODate } from "@/lib/date";
import { greetingSituation } from "@/lib/greeting";
import { useNow } from "@/lib/hooks";
import { useCopy } from "@/lib/use-copy";
import { getDayStatus } from "@/lib/school/day";
import { homeworkFromLessons, testsFromLessons } from "@/lib/school/derive";
import { NowWidget } from "./NowWidget";
import { PackWidget } from "./PackWidget";
import { HomeworkTomorrowWidget, TestsWidget, TodayLessonsWidget } from "./ListWidgets";

const byStart = <T extends { start: string }>(a: T, b: T) => a.start.localeCompare(b.start);

/** Vandaag: je dag in één oogopslag. In fase 3 worden dit versleepbare widgets. */
export function TodayView() {
  const now = useNow(30_000);
  const [today] = useState(() => startOfDay(new Date()));
  const account = useAccount();
  const lessons = useLessons(daysRange(today, 21));
  const subjects = useSubjectAppearance();

  const view = useMemo(() => {
    if (!lessons.data || !now) return null;
    const todayIso = toISODate(now);
    const todays = lessons.data.filter((l) => l.date === todayIso).sort(byStart);
    const status = getDayStatus(todays, now);
    const upcoming =
      lessons.data
        .filter((l) => l.status !== "uitval" && new Date(l.start) > now && l.date !== todayIso)
        .sort(byStart)[0] ?? null;

    // "Morgen" = de eerstvolgende dag met lessen (na een vrijdag dus maandag).
    const nextDay = upcoming?.date ?? toISODate(nextWeekday(now));
    const homework = homeworkFromLessons(lessons.data).filter((h) => h.dueDate === nextDay);
    const tests = testsFromLessons(lessons.data)
      .filter(
        (t) => t.date >= todayIso && t.date <= toISODate(new Date(now.getTime() + 14 * 864e5)),
      )
      .sort(byStart)
      .slice(0, 5);
    const testsToday = tests.filter((t) => t.date === todayIso).length;

    const greeting = account.data
      ? greetingSituation({
          now,
          firstName: account.data.firstName,
          lessonsToday: todays.filter((l) => l.status !== "uitval").length,
          lessonsLeft: status.lessonsLeft,
          testsToday,
          firstLessonStart: todays.find((l) => l.status !== "uitval")
            ? new Date(todays.find((l) => l.status !== "uitval")!.start)
            : null,
          nextSchoolDayStart: upcoming ? new Date(upcoming.start) : null,
          isBirthday: Boolean(account.data.birthDate?.slice(5) === todayIso.slice(5)),
        })
      : null;

    return { todays, status, upcoming, homework, tests, greeting, nextDay };
  }, [lessons.data, now, account.data]);

  const title = useCopy(view?.greeting?.title.key, view?.greeting?.title.vars);
  const subtitle = useCopy(view?.greeting?.subtitle.key, view?.greeting?.subtitle.vars);

  return (
    <>
      {title && now ? (
        <PageHeader eyebrow={formatLongDate(now)} title={title} subtitle={subtitle} />
      ) : (
        <div className="mb-6 md:mb-8" aria-busy>
          <Skeleton className="mb-3 h-4 w-40" />
          <Skeleton className="h-11 w-full max-w-md" />
          <LoadingQuip className="mt-3" />
        </div>
      )}

      <div className="grid grid-flow-row-dense grid-cols-12 gap-4 md:gap-5">
        <NowWidget
          status={view?.status ?? null}
          upcoming={view?.upcoming ?? null}
          now={now}
          subject={subjects.get}
        />
        <PackWidget />
        <TodayLessonsWidget
          lessons={view?.todays ?? []}
          currentId={view?.status.current?.id ?? null}
          subject={subjects.get}
          isLoading={!view}
        />
        <HomeworkTomorrowWidget
          items={view?.homework ?? []}
          dayLabel={
            view && now ? formatRelativeDay(new Date(`${view.nextDay}T12:00:00`), now) : "morgen"
          }
          subject={subjects.get}
          isLoading={!view}
        />
        <TestsWidget tests={view?.tests ?? []} now={now} subject={subjects.get} isLoading={!view} />
      </div>
    </>
  );
}
