"use client";

import { DataErrorState } from "@/components/koppelen/DataErrorState";
import { ArrowLeft, Calculator, Lock } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useWalkoutActions } from "@/components/walkout/useWalkoutActions";
import { formatGrade } from "@/lib/calc/average";
import { seAverage, seGrade } from "@/lib/calc/exam";
import { periodAverages } from "@/lib/calc/overview";
import { useGrades, useSubjectAppearance } from "@/lib/data/hooks";
import { formatShortDate, parseISODate } from "@/lib/date";
import { useCopyParts } from "@/lib/use-copy";
import { AverageWarningPanel, useAverageWarnings } from "./AverageWarning";
import { CalculatorSheet } from "./CalculatorSheet";
import { GradeChart } from "./GradeChart";
import { GradeValue } from "./GradeValue";
import { GradePill } from "./SubjectCard";
import { useGradeData, usePeriodList } from "./useGradeData";

/** Fase 4: alles over één vak. Grafiek, cijfers, periodes en "Wat moet ik halen?". */
export function SubjectDetailView({ subjectId }: { subjectId: string }) {
  const data = useGradeData();
  const gradesQuery = useGrades();
  const periods = usePeriodList();
  const appearance = useSubjectAppearance();
  const { openPack } = useWalkoutActions();
  const [calculator, setCalculator] = useState(false);

  const subject = data?.subjects.find((s) => s.id === subjectId) ?? null;
  const look = appearance.get(subjectId);
  const grades = useMemo(() => data?.bySubject.get(subjectId) ?? [], [data, subjectId]);
  const average = data?.averages.get(subjectId) ?? null;
  const locked = data?.locked.get(subjectId) ?? 0;
  const warnings = useAverageWarnings().get(subjectId);
  const newestFirst = useMemo(
    () =>
      [...grades].sort(
        (a, b) => b.date.localeCompare(a.date) || b.enteredAt.localeCompare(a.enteredAt),
      ),
    [grades],
  );
  const byPeriod = useMemo(() => periodAverages(grades, periods), [grades, periods]);
  const se = seAverage(grades);
  const empty = useCopyParts(data && subject && grades.length === 0 ? "cijfers.vakLeeg" : null);

  if (gradesQuery.isError && !gradesQuery.data)
    return <DataErrorState error={gradesQuery.error} onRetry={() => void gradesQuery.refetch()} />;

  if (!data) {
    return (
      <>
        <LoadingQuip topic="cijfers" className="mb-3" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-6 h-64 w-full rounded-panel" />
      </>
    );
  }

  if (!subject) {
    return (
      <EmptyState
        illustration="zoeken"
        title="Dit vak kennen we niet"
        description="Misschien heet het anders, of heeft het geen cijfers."
        action={
          <LinkButton href="/cijfers" variant="glass" icon={ArrowLeft}>
            Naar je cijfers
          </LinkButton>
        }
      />
    );
  }

  return (
    <>
      <Link
        href="/cijfers"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden /> Cijfers
      </Link>
      <PageHeader
        eyebrow={subject.isCore ? "Kernvak" : "Vak"}
        title={
          <span className="flex items-center gap-3">
            <SubjectBadge subject={look} size="lg" />
            {subject.name}
          </span>
        }
        actions={
          <Button variant="primary" icon={Calculator} onClick={() => setCalculator(true)}>
            Wat moet ik halen?
          </Button>
        }
      />

      {grades.length === 0 && locked === 0 ? (
        <EmptyState illustration="trofee" title={empty?.title ?? ""} description={empty?.body} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <GlassPanel className="min-w-0">
            <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
              <div>
                <p className="text-sm text-ink-3">Gemiddeld</p>
                {average !== null ? (
                  <GradeValue
                    value={average}
                    className="font-display text-6xl leading-none font-semibold tracking-tight"
                  />
                ) : (
                  <span className="font-display text-4xl font-semibold text-ink-3">—</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                <Chip>
                  {grades.length} {grades.length === 1 ? "cijfer" : "cijfers"}
                </Chip>
                {se !== null && (
                  <Chip tone="accent" title="Schoolexamen: alleen PTA-cijfers">
                    <span className="sensitive">
                      SE {formatGrade(seGrade(se))} ({formatGrade(se, 3)})
                    </span>
                  </Chip>
                )}
              </div>
            </div>
            <GradeChart grades={grades} color={look.color} />
          </GlassPanel>

          <div className="space-y-5">
            {/* Met iets in je pack zou Magisters gemiddelde je nieuwe cijfer verraden. */}
            {warnings && locked === 0 && <AverageWarningPanel checks={warnings} />}
            {periods.length > 0 && (
              <GlassPanel as="section" aria-labelledby="periodes-titel">
                <h2 id="periodes-titel" className="mb-3 font-display font-semibold text-ink">
                  Per periode
                </h2>
                <ul className="space-y-2">
                  {byPeriod.map((p, i) => (
                    <li key={p.periodId} className="flex items-center justify-between text-sm">
                      <span className="text-ink-2">{periods[i]?.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-ink-3">
                          {p.count} {p.count === 1 ? "cijfer" : "cijfers"}
                        </span>
                        {p.average === null ? (
                          <span className="w-10 text-right text-ink-3">—</span>
                        ) : (
                          <GradeValue value={p.average} className="w-10 text-right font-semibold" />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            )}
            {locked > 0 && (
              <GlassPanel className="flex items-center gap-3 bg-[color-mix(in_oklab,var(--sm-accent)_10%,transparent)]">
                <Lock size={18} aria-hidden className="shrink-0 text-accent-ink" />
                <p className="min-w-0 flex-1 text-sm text-ink">
                  {locked} {locked === 1 ? "cijfer zit" : "cijfers zitten"} nog in je pack.
                </p>
                <Button variant="primary" size="sm" onClick={openPack}>
                  Open je pack
                </Button>
              </GlassPanel>
            )}
          </div>

          <GlassPanel as="section" aria-labelledby="lijst-titel" className="lg:col-span-2">
            <h2 id="lijst-titel" className="mb-3 font-display font-semibold text-ink">
              Alle cijfers
            </h2>
            <ul className="divide-y divide-line">
              {newestFirst.map((grade) => {
                const counts =
                  grade.kind === "numeric" && grade.countsTowardAverage && grade.weight > 0;
                return (
                  <li key={grade.id} className="flex items-center gap-3 py-2.5">
                    <GradePill grade={grade} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{grade.description}</p>
                      <p className="text-xs text-ink-3">
                        {formatShortDate(parseISODate(grade.date))}
                        {grade.kind === "numeric" &&
                          (counts ? ` · weging ${grade.weight}` : " · telt niet mee")}
                      </p>
                    </div>
                    {grade.isPTA && <Chip tone="accent">PTA</Chip>}
                  </li>
                );
              })}
            </ul>
          </GlassPanel>
        </div>
      )}

      <CalculatorSheet
        open={calculator}
        onClose={() => setCalculator(false)}
        data={data}
        subject={appearance.get}
        initialSubject={subjectId}
      />
    </>
  );
}
