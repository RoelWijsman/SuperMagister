"use client";

import { DataErrorState } from "@/components/koppelen/DataErrorState";
import { LayoutDashboard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  daysRange,
  useAccount,
  useGrades,
  useLessons,
  useRevealState,
  useSubjectAppearance,
} from "@/lib/data/hooks";
import { formatLongDate, formatRelativeDay, nextWeekday, startOfDay, toISODate } from "@/lib/date";
import { greetingSituation } from "@/lib/greeting";
import { useNow } from "@/lib/hooks";
import { getDayStatus } from "@/lib/school/day";
import { useHomeworkActions, useResolvedHomework } from "@/lib/homework/use-homework";
import { homeworkFromLessons, testsFromLessons } from "@/lib/school/derive";
import type { TodayWidgetId } from "@/lib/today/layout";
import { gradeTrend } from "@/lib/today/trend";
import type { Lesson } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";
import { useSettings } from "@/stores/settings";
import { CountdownWidget } from "./CountdownWidget";
import { HomeworkTomorrowWidget } from "./ListWidgets";
import { NowWidget } from "./NowWidget";
import { PackWidget } from "./PackWidget";
import { RadarWidget } from "./RadarWidget";
import { TimelineWidget } from "./TimelineWidget";
import { TrendWidget } from "./TrendWidget";
import { WeatherWidget, type RideTimes } from "./WeatherWidget";
import { WidgetBoard } from "./WidgetBoard";

const byStart = <T extends { start: string }>(a: T, b: T) => a.start.localeCompare(b.start);
/** Zo ver vooruit gaat de weersverwachting (Open-Meteo: 7 dagen). */
const FORECAST_DAYS = 6;

/** Vertrektijd en eindtijd van een schooldag, voor het fietsweer. */
function rideTimes(lessons: readonly Lesson[], bikeMinutes: number): RideTimes | null {
  const active = lessons.filter((l) => l.status !== "uitval").sort(byStart);
  const first = active[0];
  const last = active.at(-1);
  if (!first || !last) return null;
  return {
    leave: new Date(new Date(first.start).getTime() - bikeMinutes * 60_000),
    home: new Date(last.end),
  };
}

/** Vandaag: je dag in één oogopslag, als bord met widgets die je zelf indeelt. */
export function TodayView() {
  const now = useNow(30_000);
  const [today] = useState(() => startOfDay(new Date()));
  const [editing, setEditing] = useState(false);
  const account = useAccount();
  const lessons = useLessons(daysRange(today, 21));
  const grades = useGrades();
  const { revealed } = useRevealState();
  const subjects = useSubjectAppearance();
  const bikeMinutes = useSettings((s) => s.bikeMinutes);

  const view = useMemo(() => {
    if (!lessons.data || !now) return null;
    const todayIso = toISODate(now);
    const todays = lessons.data.filter((l) => l.date === todayIso).sort(byStart);
    const status = getDayStatus(todays, now);
    const active = todays.filter((l) => l.status !== "uitval");
    /** De laatste bel van vandaag (voor het weekend-aftellen op vrijdag). */
    const lastBell = active.length > 0 ? new Date(active.at(-1)!.end) : null;
    const upcoming =
      lessons.data
        .filter((l) => l.status !== "uitval" && new Date(l.start) > now && l.date !== todayIso)
        .sort(byStart)[0] ?? null;

    // "Morgen" = de eerstvolgende dag met lessen (na een vrijdag dus maandag).
    const nextDay = upcoming?.date ?? toISODate(nextWeekday(now));
    const homework = homeworkFromLessons(lessons.data).filter((h) => h.dueDate === nextDay);
    const tests = testsFromLessons(lessons.data).sort(byStart);
    const testsToday = tests.filter((t) => t.date === todayIso).length;

    // Fietsweer: vandaag zolang je nog op school moet zijn, anders de volgende schooldag.
    const rideDay =
      lastBell && now < lastBell
        ? todays
        : upcoming && new Date(upcoming.start).getTime() - now.getTime() < FORECAST_DAYS * 864e5
          ? lessons.data.filter((l) => l.date === upcoming.date)
          : [];
    const rides = rideTimes(rideDay, bikeMinutes);

    const firstToday = active[0];
    const greeting = account.data
      ? greetingSituation({
          now,
          firstName: account.data.firstName,
          lessonsToday: active.length,
          lessonsLeft: status.lessonsLeft,
          testsToday,
          firstLessonStart: firstToday ? new Date(firstToday.start) : null,
          nextSchoolDayStart: upcoming ? new Date(upcoming.start) : null,
          isBirthday: Boolean(account.data.birthDate?.slice(5) === todayIso.slice(5)),
        })
      : null;

    return { todays, status, lastBell, upcoming, homework, tests, greeting, nextDay, rides };
  }, [lessons.data, now, account.data, bikeMinutes]);

  const tomorrowHomework = useResolvedHomework(view?.homework);
  const homeworkActions = useHomeworkActions();

  const trend = useMemo(
    () =>
      grades.data && revealed
        ? gradeTrend(grades.data.filter((grade) => revealed.has(grade.id)))
        : null,
    [grades.data, revealed],
  );

  const title = useCopy(view?.greeting?.title.key, view?.greeting?.title.vars);
  const subtitle = useCopy(view?.greeting?.subtitle.key, view?.greeting?.subtitle.vars);

  useEffect(() => {
    if (!editing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setEditing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  const widgets: Record<TodayWidgetId, React.ReactNode> = {
    nu: (
      <NowWidget
        status={view?.status ?? null}
        upcoming={view?.upcoming ?? null}
        now={now}
        subject={subjects.get}
      />
    ),
    pack: <PackWidget />,
    tijdlijn: (
      <TimelineWidget
        lessons={view?.todays ?? []}
        now={now}
        subject={subjects.get}
        isLoading={!view}
      />
    ),
    radar: (
      <RadarWidget tests={view?.tests ?? []} now={now} subject={subjects.get} isLoading={!view} />
    ),
    huiswerk: (
      <HomeworkTomorrowWidget
        items={tomorrowHomework ?? []}
        onCheckedChange={(item, checked) =>
          homeworkActions.setStatus(item, checked ? "klaar" : "todo", tomorrowHomework ?? [])
        }
        dayLabel={
          view && now ? formatRelativeDay(new Date(`${view.nextDay}T12:00:00`), now) : "morgen"
        }
        subject={subjects.get}
        isLoading={!view}
      />
    ),
    weer: <WeatherWidget times={view?.rides ?? null} now={view ? now : null} />,
    countdowns: (
      <CountdownWidget
        now={view ? now : null}
        lastBellToday={view?.lastBell ?? null}
        examYear={Boolean(account.data?.isExamYear)}
      />
    ),
    trend: (
      <TrendWidget trend={trend} subject={subjects.get} isLoading={!grades.data || !revealed} />
    ),
  };

  return (
    <>
      {title && now ? (
        <PageHeader
          eyebrow={formatLongDate(now)}
          title={title}
          subtitle={subtitle}
          actions={
            !editing && (
              <Button
                variant="glass"
                size="sm"
                icon={LayoutDashboard}
                onClick={() => setEditing(true)}
              >
                Indelen
              </Button>
            )
          }
        />
      ) : (
        <div className="mb-6 md:mb-8" aria-busy>
          <Skeleton className="mb-3 h-4 w-40" />
          <Skeleton className="h-11 w-full max-w-md" />
          <LoadingQuip className="mt-3" />
        </div>
      )}

      {lessons.isError && (!lessons.data || lessons.isPlaceholderData) && (
        <DataErrorState
          error={lessons.error}
          onRetry={() => void lessons.refetch()}
          className="mb-5"
        />
      )}
      <WidgetBoard editing={editing} onDone={() => setEditing(false)} widgets={widgets} />
    </>
  );
}
