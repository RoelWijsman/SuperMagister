"use client";

import { DataErrorState } from "@/components/koppelen/DataErrorState";
import { Columns3, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { daysRange, useHomework, useLessons, useSubjectAppearance } from "@/lib/data/hooks";
import {
  addDays,
  formatDuration,
  formatRelativeDay,
  parseISODate,
  startOfDay,
  toISODate,
} from "@/lib/date";
import { useIsClient } from "@/lib/hooks";
import {
  groupHomework,
  homeworkLoad,
  type HomeworkItem,
  type HomeworkStatus,
} from "@/lib/homework/overview";
import { useHomeworkActions, useResolvedHomework } from "@/lib/homework/use-homework";
import { hourLabel } from "@/lib/schedule/summary";
import { useCopy, useCopyParts } from "@/lib/use-copy";
import { useHomeworkStore, type HomeworkView as View } from "@/stores/homework";
import { checkReward } from "./CheckButton";
import { HomeworkCard } from "./HomeworkCard";
import { HomeworkLoad } from "./HomeworkLoad";
import { KanbanBoard } from "./KanbanBoard";
import { MinutesSheet } from "./MinutesSheet";
import { NoZinSheet } from "./NoZinSheet";

const VIEW_TABS: readonly TabItem<View>[] = [
  { value: "lijst", label: "Lijst", icon: List },
  { value: "kanban", label: "Kanban", icon: Columns3 },
];

/** Zoveel schooldagen laat de drukte-meter zien. */
const LOAD_DAYS = 5;

/**
 * Fase 3c: huiswerk. Vandaag, morgen, komende dagen en later, of als kanban.
 * Afvinken met beloning, een tijd per item, de drukte per dag en de
 * "ik heb geen zin"-knop. Geen planner, studieplan, focusmodus of streak.
 */
export function HomeworkView() {
  const params = useSearchParams();
  const focusItem = params.get("item");
  const focusDay = params.get("dag");
  const isClient = useIsClient();
  const [today] = useState(() => startOfDay(new Date()));
  const range = useMemo(() => daysRange(today, 28), [today]);
  const homework = useHomework(range);
  const lessons = useLessons(range);
  const subjects = useSubjectAppearance();
  const items = useResolvedHomework(homework.data);
  const actions = useHomeworkActions();
  const storedView = useHomeworkStore((s) => s.view);
  const setView = useHomeworkStore((s) => s.setView);
  const view: View = isClient ? storedView : "lijst";

  const [timeId, setTimeId] = useState<string | null>(null);
  const [noZinId, setNoZinId] = useState<string | null>(null);

  const lessonById = useMemo(
    () => new Map((lessons.data ?? []).map((l) => [l.id, l])),
    [lessons.data],
  );
  const groups = useMemo(() => (items ? groupHomework(items, today) : []), [items, today]);
  const load = useMemo(() => (items ? homeworkLoad(items, today, LOAD_DAYS) : []), [items, today]);

  const open = items?.filter((h) => !h.isDone) ?? [];
  // De tijd voor de komende week; alles tot over vier weken is vooral schrikken.
  const weekEnd = toISODate(addDays(today, 7));
  const weekMinutes = open
    .filter((item) => item.dueDate <= weekEnd)
    .reduce((sum, item) => sum + item.minutes, 0);
  const subtitle = useCopy(items ? "huiswerk.subtitel" : null, {
    aantal: String(open.length),
    dingen: open.length === 1 ? "ding" : "dingen",
  });
  const empty = useCopyParts(items && items.length === 0 ? "leeg.huiswerk" : null);

  // Alleen bij binnenkomst of een nieuwe link scrollen, niet bij elke vink.
  const ready = Boolean(items);
  useEffect(() => {
    if (!ready || view !== "lijst") return;
    const target = focusItem
      ? document.getElementById(focusItem)
      : focusDay
        ? document.querySelector(`[data-due="${focusDay}"]`)
        : null;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusItem, focusDay, ready, view]);

  const meta = (item: HomeworkItem) => {
    const lesson = lessonById.get(item.lessonId);
    const hour = lesson ? hourLabel(lesson) : null;
    return `${formatRelativeDay(parseISODate(item.dueDate), today)}${hour ? ` · ${hour}` : ""}`;
  };
  const setStatus = (item: HomeworkItem, status: HomeworkStatus) =>
    actions.setStatus(item, status, items ?? []);
  const scrollToDay = (date: string) => {
    if (view !== "lijst") setView("lijst");
    requestAnimationFrame(() =>
      document
        .querySelector(`[data-due="${date}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };
  const timeItem = items?.find((item) => item.id === timeId) ?? null;
  const noZinItem = items?.find((item) => item.id === noZinId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow={`${formatRelativeDay(today, today)} t/m ${formatRelativeDay(addDays(today, 28), today)}`}
        title="Huiswerk"
        subtitle={
          subtitle ? (
            <>
              {subtitle}
              {weekMinutes > 0 && (
                <span className="text-ink-3">
                  {" "}
                  · ±{formatDuration(weekMinutes)} voor de komende week
                </span>
              )}
            </>
          ) : undefined
        }
        actions={
          <Tabs
            id="huiswerk-weergave"
            value={view}
            onValueChange={setView}
            items={VIEW_TABS}
            aria-label="Weergave"
          />
        }
      />

      {homework.isError && (!homework.data || homework.isPlaceholderData) ? (
        <DataErrorState error={homework.error} onRetry={() => void homework.refetch()} />
      ) : !items ? (
        <div className="space-y-3">
          <LoadingQuip topic="huiswerk" />
          {Array.from({ length: 3 }, (_, i) => (
            <GlassPanel key={i} className="flex gap-4">
              <Skeleton className="size-8 rounded-full" />
              <SkeletonText className="flex-1" lines={2} />
            </GlassPanel>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState illustration="bank" title={empty?.title ?? ""} description={empty?.body} />
      ) : (
        <>
          <HomeworkLoad days={load} onPick={scrollToDay} />
          {view === "kanban" ? (
            <KanbanBoard items={items} subject={subjects.get} meta={meta} onMove={setStatus} />
          ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                <section key={group.key} aria-labelledby={`groep-${group.key}`}>
                  <h2
                    id={`groep-${group.key}`}
                    className="mb-3 flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight"
                  >
                    {group.title}
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-glass-strong px-2 font-sans text-xs font-semibold text-ink-2">
                      {group.items.length}
                    </span>
                    {group.openMinutes > 0 && (
                      <span className="ml-auto font-sans text-sm font-normal tracking-normal text-ink-3 tabular-nums">
                        ±{formatDuration(group.openMinutes)} open
                      </span>
                    )}
                  </h2>
                  <ul className="grid gap-3 lg:grid-cols-2">
                    {group.items.map((item) => (
                      <HomeworkCard
                        key={item.id}
                        item={item}
                        subject={subjects.get(item.subjectId)}
                        meta={meta(item)}
                        focused={item.id === focusItem}
                        onCheckedChange={(checked) => setStatus(item, checked ? "klaar" : "todo")}
                        onTime={() => setTimeId(item.id)}
                        onNoZin={() => setNoZinId(item.id)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <MinutesSheet item={timeItem} subject={subjects.get} onClose={() => setTimeId(null)} />
      <NoZinSheet
        item={noZinItem}
        subject={subjects.get}
        onClose={() => setNoZinId(null)}
        onStart={(item) => {
          if (item.status === "todo") setStatus(item, "bezig");
        }}
        onDone={(item) => {
          checkReward(true);
          setStatus(item, "klaar");
          setNoZinId(null);
        }}
      />
    </>
  );
}
