"use client";

import { Gift, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tilt } from "@/components/ui/Tilt";
import { formatGrade, gradeTone } from "@/lib/calc/average";
import { overallAverage, summarizeSubject } from "@/lib/calc/summary";
import { cn } from "@/lib/cn";
import { useGrades, usePeriods, useRevealState, useSubjectAppearance } from "@/lib/data/hooks";
import { toISODate } from "@/lib/date";
import type { Grade } from "@/lib/types";
import { toast } from "@/stores/toast";
import { GradeValue, TONE_TEXT } from "./GradeValue";

const PILL_TONE = {
  good: "bg-[color-mix(in_oklab,var(--sm-good)_16%,transparent)]",
  warn: "bg-[color-mix(in_oklab,var(--sm-warn)_16%,transparent)]",
  bad: "bg-[color-mix(in_oklab,var(--sm-bad)_16%,transparent)]",
} as const;

function GradePill({ grade }: { grade: Grade }) {
  if (grade.kind === "text") {
    return (
      <span className="sensitive grid h-7 min-w-9 place-items-center rounded-lg bg-glass-strong px-1.5 text-sm font-semibold text-ink-2">
        {grade.value}
      </span>
    );
  }
  const tone = gradeTone(grade.value);
  const counts = grade.countsTowardAverage && grade.weight > 0;
  return (
    <span
      title={`${grade.description} · ${counts ? `weging ${grade.weight}` : "telt niet mee"}`}
      className={cn(
        "sensitive grid h-7 min-w-9 place-items-center rounded-lg px-1.5 text-sm font-semibold tabular-nums",
        PILL_TONE[tone],
        TONE_TEXT[tone],
        !counts && "line-through opacity-50",
      )}
    >
      {formatGrade(grade.value)}
    </span>
  );
}

function LockedPill({ count }: { count: number }) {
  return (
    <span
      title="Nog niet onthuld: open je pack"
      className="flex h-7 items-center gap-1 rounded-lg bg-[color-mix(in_oklab,var(--sm-accent)_18%,transparent)] px-2 text-xs font-semibold text-accent-ink"
    >
      <Lock size={12} strokeWidth={2.6} aria-hidden />
      {count}
    </span>
  );
}

const openPackToast = () =>
  toast({
    emoji: "🎁",
    title: "Je pack opent in fase 2",
    description: "Dan onthul je deze cijfers met een walkout en worden ze verzamelkaarten.",
  });

/**
 * Cijferoverzicht per vak. Niet-onthulde cijfers blijven op slot tot je je
 * pack opent. Fase 4 voegt vak-detail, calculator, simulator en meer toe.
 */
export function GradesView() {
  const params = useSearchParams();
  const focus = params.get("vak");
  const grades = useGrades();
  const periods = usePeriods();
  const subjects = useSubjectAppearance();
  const { revealed, pack } = useRevealState();

  const summaries = useMemo(() => {
    if (!grades.data) return [];
    return subjects.subjects
      .filter((s) => s.hasGrades)
      .map((s) => ({ subject: s, ...summarizeSubject(s.id, grades.data, revealed) }));
  }, [grades.data, subjects.subjects, revealed]);

  const overall = overallAverage(summaries);
  const averagedCount = summaries.filter((s) => s.average !== null).length;
  const today = toISODate(new Date());
  const currentPeriod = periods.data?.find((p) => p.start <= today && today <= p.end);

  useEffect(() => {
    if (!focus || summaries.length === 0) return;
    document
      .getElementById(`vak-${focus}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus, summaries.length]);

  const loading = !grades.data || !subjects.isReady || !revealed;

  return (
    <>
      <PageHeader
        eyebrow={currentPeriod ? `${currentPeriod.name} loopt` : "Cijfers"}
        title="Cijfers"
        subtitle={
          overall !== null ? (
            <>
              Gemiddeld <GradeValue value={overall} className="font-semibold" /> over{" "}
              {averagedCount} vakken
            </>
          ) : undefined
        }
      />

      {pack.length > 0 && (
        <GlassPanel className="mb-6 flex flex-wrap items-center gap-4 bg-[color-mix(in_oklab,var(--sm-accent)_10%,transparent)]">
          <span className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent">
            <Gift size={22} strokeWidth={2.2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">
              🔒 {pack.length} {pack.length === 1 ? "nieuw cijfer wacht" : "nieuwe cijfers wachten"}{" "}
              in je pack
            </p>
            <p className="text-sm text-ink-2">Ze tellen pas mee als je ze onthult. Niet spieken.</p>
          </div>
          <Button variant="primary" onClick={openPackToast}>
            Open je pack
          </Button>
        </GlassPanel>
      )}

      {loading ? (
        <>
          <LoadingQuip topic="cijfers" className="mb-3" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <GlassPanel key={i}>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-2xl" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="mt-5 h-12 w-24" />
                <Skeleton className="mt-4 h-7 w-full" />
              </GlassPanel>
            ))}
          </div>
        </>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map(({ subject, average, count, lockedCount, latest }) => {
            const look = subjects.get(subject.id);
            const isFocus = subject.id === focus;
            return (
              <li key={subject.id} id={`vak-${subject.id}`} className="scroll-mt-28">
                <Tilt className="h-full">
                  <GlassPanel
                    className={cn(
                      "relative h-full overflow-hidden",
                      isFocus &&
                        "shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--sm-accent)_60%,transparent),var(--sm-shadow)]",
                    )}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-25 blur-2xl"
                      style={{ background: look.color }}
                    />
                    <div className="relative flex items-center gap-3">
                      <SubjectBadge subject={look} size="lg" />
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-ink">{subject.name}</h2>
                        <p className="text-sm text-ink-3">
                          {count} {count === 1 ? "cijfer" : "cijfers"}
                          {subject.isCore && " · kernvak"}
                        </p>
                      </div>
                    </div>
                    <div className="relative mt-4 flex items-end justify-between gap-3">
                      {average !== null ? (
                        <GradeValue
                          value={average}
                          className="font-display text-5xl leading-none font-semibold tracking-tight"
                        />
                      ) : (
                        <span className="font-display text-3xl leading-none font-semibold text-ink-3">
                          {count > 0 ? "V/G" : "—"}
                        </span>
                      )}
                      <span className="text-xs text-ink-3">
                        {average !== null ? "gemiddeld" : "beoordelingen"}
                      </span>
                    </div>
                    <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
                      {latest.map((grade) => (
                        <GradePill key={grade.id} grade={grade} />
                      ))}
                      {lockedCount > 0 && <LockedPill count={lockedCount} />}
                    </div>
                  </GlassPanel>
                </Tilt>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
