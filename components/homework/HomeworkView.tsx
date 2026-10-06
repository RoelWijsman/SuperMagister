"use client";

import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { SkeletonText, Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { daysRange, useHomework, useLessons, useSubjectAppearance } from "@/lib/data/hooks";
import {
  addDays,
  diffInCalendarDays,
  formatRelativeDay,
  parseISODate,
  startOfDay,
} from "@/lib/date";
import { hourLabel } from "@/components/schedule/LessonRow";
import type { Homework } from "@/lib/types";
import { useCopy, useCopyParts } from "@/lib/use-copy";

type GroupKey = "vandaag" | "morgen" | "komend" | "later";

const GROUPS: { key: GroupKey; title: string }[] = [
  { key: "vandaag", title: "Vandaag" },
  { key: "morgen", title: "Morgen" },
  { key: "komend", title: "Komende dagen" },
  { key: "later", title: "Later" },
];

function groupOf(item: Homework, today: Date): GroupKey {
  const days = diffInCalendarDays(parseISODate(item.dueDate), today);
  if (days <= 0) return "vandaag";
  if (days === 1) return "morgen";
  if (days <= 7) return "komend";
  return "later";
}

/**
 * Huiswerk in overzichten: vandaag, morgen, komende dagen en later. Afvinken
 * met beloning, de tijdsschatting en de "ik heb geen zin"-knop komen in fase 3c.
 */
export function HomeworkView() {
  const params = useSearchParams();
  const focusItem = params.get("item");
  const focusDay = params.get("dag");
  const [today] = useState(() => startOfDay(new Date()));
  const range = daysRange(today, 28);
  const homework = useHomework(range);
  const lessons = useLessons(range);
  const subjects = useSubjectAppearance();

  const lessonById = useMemo(
    () => new Map((lessons.data ?? []).map((l) => [l.id, l])),
    [lessons.data],
  );

  const groups = useMemo(() => {
    const items = [...(homework.data ?? [])].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    return GROUPS.map((group) => ({
      ...group,
      items: items.filter((item) => groupOf(item, today) === group.key),
    })).filter((group) => group.items.length > 0);
  }, [homework.data, today]);

  const open = (homework.data ?? []).filter((h) => !h.isDone).length;
  const subtitle = useCopy(homework.data ? "huiswerk.subtitel" : null, {
    aantal: String(open),
    dingen: open === 1 ? "ding" : "dingen",
  });
  const empty = useCopyParts(homework.data && groups.length === 0 ? "leeg.huiswerk" : null);

  useEffect(() => {
    if (!homework.data) return;
    const target = focusItem
      ? document.getElementById(focusItem)
      : focusDay
        ? document.querySelector(`[data-due="${focusDay}"]`)
        : null;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusItem, focusDay, homework.data]);

  return (
    <>
      <PageHeader
        eyebrow={`${formatRelativeDay(today, today)} t/m ${formatRelativeDay(addDays(today, 28), today)}`}
        title="Huiswerk"
        subtitle={subtitle ?? undefined}
      />

      {!homework.data ? (
        <div className="space-y-3">
          <LoadingQuip topic="huiswerk" />
          {Array.from({ length: 3 }, (_, i) => (
            <GlassPanel key={i} className="flex gap-4">
              <Skeleton className="size-9 rounded-xl" />
              <SkeletonText className="flex-1" lines={2} />
            </GlassPanel>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState illustration="bank" title={empty?.title ?? ""} description={empty?.body} />
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
              </h2>
              <ul className="grid gap-3 lg:grid-cols-2">
                {group.items.map((item) => {
                  const look = subjects.get(item.subjectId);
                  const lesson = lessonById.get(item.lessonId);
                  const hour = lesson ? hourLabel(lesson) : null;
                  const due = formatRelativeDay(parseISODate(item.dueDate), today);
                  return (
                    <GlassPanel
                      as="li"
                      key={item.id}
                      id={item.id}
                      data-due={item.dueDate}
                      className={cn(
                        "flex scroll-mt-28 gap-4",
                        item.isDone && "opacity-60",
                        item.id === focusItem &&
                          "shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--sm-accent)_60%,transparent),var(--sm-shadow)]",
                      )}
                    >
                      <SubjectBadge subject={look} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-semibold text-ink">{look.name}</p>
                          <p className="text-sm text-ink-3">
                            {due}
                            {hour && ` · ${hour}`}
                          </p>
                          {item.isTest && <Chip tone="accent">📝 Toets</Chip>}
                          {item.isDone && (
                            <Chip tone="good">
                              <CheckCircle2 size={13} aria-hidden /> Af
                            </Chip>
                          )}
                        </div>
                        <SafeHtml html={item.html} className="text-[0.9375rem] text-ink-2" />
                      </div>
                    </GlassPanel>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
