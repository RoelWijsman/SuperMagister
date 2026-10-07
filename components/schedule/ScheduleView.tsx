"use client";

import { CalendarArrowDown, ChevronLeft, ChevronRight, History } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { downloadFile } from "@/lib/cards/share";
import { useDataSource } from "@/lib/data/context";
import { daysRange, useLessons, useSubjectAppearance } from "@/lib/data/hooks";
import {
  addDays,
  formatShortDate,
  isoWeek,
  MONTH_NAMES,
  parseISODate,
  startOfWeek,
  toISODate,
} from "@/lib/date";
import { isModalOpen, isTypingTarget, useIsClient, useMediaQuery, useNow } from "@/lib/hooks";
import { notify } from "@/lib/notify";
import type { ScheduleChange } from "@/lib/schedule/changes";
import { buildIcs } from "@/lib/schedule/ics";
import { monthGrid } from "@/lib/schedule/month";
import { defaultFocus, shiftFocus, viewRange, type ScheduleView } from "@/lib/schedule/navigate";
import { weekStats } from "@/lib/schedule/summary";
import { homeworkFromLessons, isTestInfoType } from "@/lib/school/derive";
import type { Lesson } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";
import { useScheduleTracker, useScheduleUi } from "@/stores/schedule";
import { toast } from "@/stores/toast";
import { ChangesSheet } from "./ChangesSheet";
import type { AgendaContext } from "./DayAgenda";
import { DayView } from "./DayView";
import { LessonSheet } from "./LessonSheet";
import { ListView } from "./ListView";
import { MonthView } from "./MonthView";
import { BusyWeek, WeekFacts, WeekLoad, WeekView, type ScheduleDay } from "./WeekView";

const VIEW_TABS: readonly TabItem<ScheduleView>[] = [
  { value: "dag", label: "Dag" },
  { value: "week", label: "Week" },
  { value: "lijst", label: "Lijst" },
  { value: "maand", label: "Maand" },
];

const UNIT: Record<ScheduleView, string> = {
  dag: "dag",
  week: "week",
  lijst: "week",
  maand: "maand",
};

/** Zoveel dagen vooruit houdt de wijzigingen-detector in de gaten. */
const TRACK_DAYS = 13;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const byStart = (a: Lesson, b: Lesson) => a.start.localeCompare(b.start);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function ScheduleSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <LoadingQuip topic="rooster" className="lg:col-span-2" />
      {[0, 1].map((panel) => (
        <GlassPanel key={panel}>
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

/** Banner bovenaan: er is iets veranderd dat je nog niet gezien hebt. */
function ChangesBanner({ count, onOpen }: { count: number; onOpen: () => void }) {
  const line = useCopy(count > 0 ? "rooster.wijzigingen" : null, {
    aantal: count,
    wijzigingen: count === 1 ? "wijziging" : "wijzigingen",
  });
  if (count === 0) return null;
  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[color-mix(in_oklab,var(--sm-warn)_50%,transparent)] bg-[color-mix(in_oklab,var(--sm-warn)_12%,transparent)] px-4 py-3"
    >
      <History size={18} aria-hidden className="shrink-0 text-warn" />
      <p className="min-w-0 flex-1 text-sm text-ink">{line}</p>
      <Button variant="glass" size="sm" onClick={onOpen}>
        Wat is er veranderd?
      </Button>
    </div>
  );
}

/**
 * Fase 3b: het rooster. Dag (standaard op mobiel), week (standaard op
 * desktop), lijst en maand; met uitval, tussenuren, toetsen, wijzigingen en
 * een export naar je agenda.
 */
export function ScheduleView() {
  const params = useSearchParams();
  const router = useRouter();
  const source = useDataSource();
  const isClient = useIsClient();
  const desktop = useMediaQuery("(min-width: 768px)");
  const storedView = useScheduleUi((s) => s.view);
  const setView = useScheduleUi((s) => s.setView);
  const view: ScheduleView = (isClient ? storedView : null) ?? (desktop ? "week" : "dag");
  const now = useNow(60_000);

  const [initialToday] = useState(() => toISODate(new Date()));
  const today = now ? toISODate(now) : initialToday;
  const todayIso = now ? today : null;

  const rawParam = params.get("dag");
  const paramDay = rawParam && ISO_DATE.test(rawParam) ? rawParam : null;
  const [focus, setFocus] = useState(() => paramDay ?? defaultFocus(new Date()));
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  // Een nieuwe ?dag= (bijv. vanuit de command palette) springt naar die dag.
  const [lastParam, setLastParam] = useState(paramDay);
  if (paramDay !== lastParam) {
    setLastParam(paramDay);
    if (paramDay) {
      setFocus(paramDay);
      setDirection(0);
    }
  }

  const range = useMemo(() => viewRange(focus, view), [focus, view]);
  const lessons = useLessons(range);
  const subjects = useSubjectAppearance();
  const subject = subjects.get;

  // De wijzigingen-detector kijkt altijd naar vandaag en de twee weken erna.
  const trackRange = useMemo(() => daysRange(parseISODate(today), TRACK_DAYS), [today]);
  const upcoming = useLessons(trackRange);
  const sync = useScheduleTracker((s) => s.sync);
  useEffect(() => {
    if (upcoming.data && !upcoming.isPlaceholderData)
      void sync(source.id, upcoming.data, trackRange, today);
  }, [upcoming.data, upcoming.isPlaceholderData, source.id, trackRange, today, sync]);

  const tracker = useScheduleTracker((s) => (s.sourceId === source.id ? s.tracker : null));
  const markSeen = useScheduleTracker((s) => s.markSeen);
  const markAllSeen = useScheduleTracker((s) => s.markAllSeen);
  const clearChanges = useScheduleTracker((s) => s.clearChanges);
  const unseen = useMemo(() => new Set(tracker?.unseen ?? []), [tracker]);
  const changes = useMemo(() => tracker?.changes ?? [], [tracker]);
  const unseenCount = changes.filter((change) => unseen.has(change.lessonId)).length;

  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const [changesOpen, setChangesOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const ready = Boolean(lessons.data) && !lessons.isPlaceholderData;
  const byDate = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const lesson of lessons.data ?? [])
      map.set(lesson.date, [...(map.get(lesson.date) ?? []), lesson]);
    for (const list of map.values()) list.sort(byStart);
    return map;
  }, [lessons.data]);

  const homework = useMemo(() => homeworkFromLessons(lessons.data ?? []), [lessons.data]);
  const homeworkLessons = useMemo(() => new Set(homework.map((h) => h.lessonId)), [homework]);
  const upcomingHomework = useMemo(() => homeworkFromLessons(upcoming.data ?? []), [upcoming.data]);

  const dayOf = useCallback(
    (date: string): ScheduleDay => ({
      date,
      lessons: byDate.get(date) ?? [],
      homeworkCount: homework.filter((h) => h.dueDate === date && !h.isTest).length,
    }),
    [byDate, homework],
  );

  const weekDays = useMemo(() => {
    const monday = startOfWeek(parseISODate(focus));
    const days: ScheduleDay[] = [];
    for (let i = 0; i < 7; i++) {
      const day = dayOf(toISODate(addDays(monday, i)));
      if (i < 5 || day.lessons.length > 0) days.push(day);
    }
    return days;
  }, [focus, dayOf]);

  const context: AgendaContext = useMemo(
    () => ({
      subject,
      now,
      unseen,
      markSeen,
      open: setOpenLesson,
      upcomingHomework,
      homeworkLessons,
    }),
    [subject, now, unseen, markSeen, upcomingHomework, homeworkLessons],
  );

  const shift = useCallback(
    (delta: -1 | 1) => {
      setDirection(delta);
      setFocus((current) => shiftFocus(current, view, delta));
      if (paramDay) router.replace("/rooster", { scroll: false });
    },
    [view, paramDay, router],
  );

  const pickDay = (date: string) => {
    setDirection(date < focus ? -1 : date > focus ? 1 : 0);
    setFocus(date);
    if (view === "maand") setView("dag");
  };

  const goToday = () => {
    setDirection(0);
    setFocus(defaultFocus(new Date()));
    if (paramDay) router.replace("/rooster", { scroll: false });
  };

  // ← en → bladeren door dagen, weken of maanden.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.shiftKey || isTypingTarget(event.target) || isModalOpen()) return;
      event.preventDefault();
      shift(event.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shift]);

  // Vanuit een link (?dag=) in de lijst meteen naar die dag scrollen.
  useEffect(() => {
    if (!paramDay || !ready || view !== "lijst") return;
    document
      .getElementById(`dag-${paramDay}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [paramDay, ready, view]);

  const exportIcs = async () => {
    setExporting(true);
    try {
      const from = startOfWeek(parseISODate(today));
      const list = await source.getLessons(daysRange(from, 27));
      const ics = buildIcs(list, (id) => subject(id).name, new Date());
      downloadFile(new File([ics], `rooster-${toISODate(from)}.ics`, { type: "text/calendar" }));
      notify("toast.ics", undefined, { emoji: "📅" });
    } catch {
      toast({
        tone: "warning",
        emoji: "📅",
        title: "Exporteren lukte niet",
        description: "Probeer het zo nog eens.",
      });
    } finally {
      setExporting(false);
    }
  };

  const pickChange = (change: ScheduleChange) => {
    setChangesOpen(false);
    pickDay(change.date);
  };

  // Kop: weeknummer of maand, en de weekstatistiek.
  const focusDate = parseISODate(focus);
  const monday = startOfWeek(focusDate);
  const isThisWeek = viewRange(today, "week").from === toISODate(monday);
  let eyebrow: string;
  let subtitle: string | undefined;
  if (view === "maand") {
    eyebrow = `${MONTH_NAMES[focusDate.getMonth()]} ${focusDate.getFullYear()}`;
    const month = focus.slice(0, 7);
    const inMonth = (lessons.data ?? []).filter((l) => l.date.startsWith(month));
    const tests = inMonth.filter((l) => l.status !== "uitval" && isTestInfoType(l.infoType)).length;
    const cancelled = inMonth.filter((l) => l.status === "uitval").length;
    subtitle = ready
      ? `${focus.slice(0, 7) === today.slice(0, 7) ? "Deze maand" : `In ${MONTH_NAMES[focusDate.getMonth()]}`}: ${plural(tests, "toets", "toetsen")}, ${cancelled} uitgevallen`
      : undefined;
  } else {
    eyebrow = `Week ${isoWeek(monday).week} · ${formatShortDate(monday)} – ${formatShortDate(addDays(monday, 4))}`;
    const stats = weekStats(weekDays.flatMap((day) => day.lessons));
    subtitle = ready
      ? `${isThisWeek ? "Deze week" : `Week ${isoWeek(monday).week}`}: ${plural(stats.lessons, "les", "lessen")}, ${stats.cancelled} uitgevallen, ${plural(stats.freePeriods, "tussenuur", "tussenuren")}`
      : undefined;
  }
  const weekTests = weekDays
    .flatMap((day) => day.lessons)
    .filter((l) => l.status !== "uitval" && isTestInfoType(l.infoType)).length;
  const unit = UNIT[view];

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title="Rooster"
        subtitle={subtitle}
        actions={
          <>
            <Button
              variant="glass"
              size="icon"
              icon={History}
              aria-label={
                unseenCount
                  ? `Wat is er veranderd? ${plural(unseenCount, "nieuwe wijziging", "nieuwe wijzigingen")}`
                  : "Wat is er veranderd?"
              }
              title="Wat is er veranderd?"
              onClick={() => setChangesOpen(true)}
            >
              {unseenCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-warn px-1 text-[0.6875rem] font-bold text-white tabular-nums"
                >
                  {unseenCount}
                </span>
              )}
            </Button>
            <Button
              variant="glass"
              size="icon"
              icon={CalendarArrowDown}
              onClick={exportIcs}
              disabled={exporting}
              aria-label="Naar je agenda (.ics)"
              title="Vier weken rooster als .ics, voor je agenda"
              className="sm:hidden"
            />
            <Button
              variant="glass"
              icon={CalendarArrowDown}
              onClick={exportIcs}
              disabled={exporting}
              title="Vier weken rooster als .ics, voor je agenda"
              className="hidden sm:inline-flex"
            >
              Naar je agenda
            </Button>
            <span aria-hidden className="w-1" />
            <Button
              variant="glass"
              size="icon"
              icon={ChevronLeft}
              aria-label={`Vorige ${unit}`}
              title={`Vorige ${unit} (←)`}
              onClick={() => shift(-1)}
            />
            <Button variant="glass" onClick={goToday}>
              Vandaag
            </Button>
            <Button
              variant="glass"
              size="icon"
              icon={ChevronRight}
              aria-label={`Volgende ${unit}`}
              title={`Volgende ${unit} (→)`}
              onClick={() => shift(1)}
            />
          </>
        }
      />

      <div className="mb-5">
        <Tabs
          id="rooster-weergave"
          value={view}
          onValueChange={setView}
          items={VIEW_TABS}
          aria-label="Weergave"
        />
      </div>

      <ChangesBanner count={unseenCount} onOpen={() => setChangesOpen(true)} />

      {!ready ? (
        <ScheduleSkeleton />
      ) : view === "maand" ? (
        <MonthView
          grid={monthGrid(focusDate.getFullYear(), focusDate.getMonth())}
          lessonsByDate={byDate}
          subject={subject}
          today={todayIso}
          focus={focus}
          onPick={pickDay}
        />
      ) : (
        <>
          <BusyWeek tests={weekTests} />
          {view === "dag" ? (
            <>
              <WeekLoad days={weekDays} focus={focus} onPick={pickDay} />
              <DayView
                day={dayOf(focus)}
                today={todayIso}
                direction={direction}
                context={context}
                onSwipe={shift}
              />
            </>
          ) : (
            <>
              <WeekLoad days={weekDays} />
              <WeekFacts days={weekDays} />
              {view === "week" ? (
                <WeekView days={weekDays} context={context} />
              ) : (
                <ListView days={weekDays} today={todayIso} focus={paramDay} context={context} />
              )}
            </>
          )}
        </>
      )}

      <LessonSheet
        lesson={openLesson}
        subject={subject}
        now={now}
        onClose={() => setOpenLesson(null)}
      />
      <ChangesSheet
        open={changesOpen}
        onClose={() => setChangesOpen(false)}
        changes={changes}
        unseen={unseen}
        subjectName={(id) => subject(id).name}
        onPick={pickChange}
        onAllSeen={markAllSeen}
        onClear={clearChanges}
      />
    </>
  );
}
