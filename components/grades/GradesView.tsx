"use client";

import { DataErrorState } from "@/components/koppelen/DataErrorState";
import { Calculator, Gauge, Gift, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { GuesserPanel } from "@/components/guess/GuesserPanel";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useWalkoutActions } from "@/components/walkout/useWalkoutActions";
import type { CopyKey } from "@/content/copy";
import { overallAverage } from "@/lib/calc/summary";
import { useGrades, useRevealState, useSubjectAppearance } from "@/lib/data/hooks";
import { toISODate } from "@/lib/date";
import { useIsClient } from "@/lib/hooks";
import { useCopy, useCopyNodes } from "@/lib/use-copy";
import { useGradesStore, type GradesTab } from "@/stores/grades";
import { useUi } from "@/stores/ui";
import { CalculatorSheet } from "./CalculatorSheet";
import { ExamPanel } from "./ExamPanel";
import { GradeValue } from "./GradeValue";
import { GradeTimeline, InsightsPanel, PeriodChart, RankingList } from "./OverviewParts";
import { PromotionMeter } from "./PromotionMeter";
import { PromotionSheet } from "./PromotionSheet";
import { SimulatorSheet } from "./SimulatorSheet";
import { useAverageWarnings } from "./AverageWarning";
import { SubjectCard } from "./SubjectCard";
import { useGradeData, usePeriodList, usePromotionResult } from "./useGradeData";

export type GradesTool = "calculator" | "simulator" | "overgang";
const TOOLS: readonly GradesTool[] = ["calculator", "simulator", "overgang"];

function subtitleKey(average: number | null, privacy: boolean): CopyKey | null {
  if (average === null) return null;
  if (privacy) return "cijfers.subtitel.privacy";
  if (average >= 6.5) return "cijfers.subtitel.goed";
  return average >= 5.5 ? "cijfers.subtitel.krap" : "cijfers.subtitel.zwaar";
}

/**
 * Fase 4: Cijfers. Vakken, ranglijst, periodes, tijdlijn en (in de bovenbouw)
 * het examen, met bovenaan de overgangsmeter en inzichten. De calculator, de
 * simulator en de overgangsmeter openen via `?tool=`, zodat de walkout en de
 * command palette er direct naartoe kunnen (`?tool=calculator&vak=wisa`).
 */
export function GradesView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tool = params.get("tool") as GradesTool | null;
  const toolSubject = params.get("vak");
  const focus = tool ? null : toolSubject;
  const isClient = useIsClient();

  const data = useGradeData();
  const gradesQuery = useGrades();
  const warnings = useAverageWarnings();
  const periods = usePeriodList();
  const subjects = useSubjectAppearance();
  const { pack } = useRevealState();
  const { openPack } = useWalkoutActions();
  const privacy = useUi((s) => s.privacy);
  const storedTab = useGradesStore((s) => s.tab);
  const setTab = useGradesStore((s) => s.setTab);
  const promotion = usePromotionResult(data);

  const hasPta = Boolean(data?.visible.some((grade) => grade.isPTA));
  const showExam = Boolean(data?.isExamYear || hasPta);
  const tabs = useMemo<TabItem<GradesTab>[]>(
    () => [
      { value: "vakken", label: "Vakken" },
      { value: "ranglijst", label: "Ranglijst" },
      { value: "periodes", label: "Periodes" },
      { value: "tijdlijn", label: "Tijdlijn" },
      ...(showExam ? [{ value: "examen" as const, label: "Examen" }] : []),
    ],
    [showExam],
  );
  const wanted = isClient ? storedTab : "vakken";
  const tab = tabs.some((t) => t.value === wanted) ? wanted : "vakken";
  const showTab = focus ? "vakken" : tab;

  const summaries = useMemo(
    () => data?.subjects.map((s) => ({ average: data.averages.get(s.id) ?? null })) ?? [],
    [data],
  );
  const overall = overallAverage(summaries);
  const averagedCount = summaries.filter((s) => s.average !== null).length;
  const today = toISODate(new Date());
  const currentPeriod = periods.find((p) => p.start <= today && today <= p.end);
  const subtitle = useCopyNodes(
    subtitleKey(overall, privacy),
    { aantal: String(averagedCount) },
    { gem: overall !== null && <GradeValue value={overall} className="font-semibold" /> },
  );
  const locked = useCopy(pack.length > 0 ? "pack.slot" : null);

  useEffect(() => {
    if (!focus || !data) return;
    document
      .getElementById(`vak-${focus}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus, data]);

  const openTool = (next: GradesTool, subjectId?: string) =>
    router.replace(`${pathname}?tool=${next}${subjectId ? `&vak=${subjectId}` : ""}`, {
      scroll: false,
    });
  const closeTool = () => router.replace(pathname, { scroll: false });
  const activeTool = tool && TOOLS.includes(tool) ? tool : null;

  return (
    <>
      <PageHeader
        eyebrow={currentPeriod ? `${currentPeriod.name} loopt` : "Cijfers"}
        title="Cijfers"
        subtitle={subtitle ?? undefined}
        actions={
          <>
            <Button variant="primary" icon={Calculator} onClick={() => openTool("calculator")}>
              Wat moet ik halen?
            </Button>
            <Button variant="glass" icon={SlidersHorizontal} onClick={() => openTool("simulator")}>
              Simulator
            </Button>
          </>
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
            <p className="text-sm text-ink-2">{locked}</p>
          </div>
          <Button variant="primary" onClick={openPack}>
            Open je pack
          </Button>
        </GlassPanel>
      )}

      {gradesQuery.isError && !gradesQuery.data ? (
        <DataErrorState error={gradesQuery.error} onRetry={() => void gradesQuery.refetch()} />
      ) : !data ? (
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
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            {promotion && (
              <GlassPanel as="section" aria-labelledby="meter-titel">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <h2
                    id="meter-titel"
                    className="flex items-center gap-2 font-display text-lg font-semibold text-ink"
                  >
                    <Gauge size={18} aria-hidden className="text-accent-ink" />
                    {promotion.exam ? "Slaagmeter" : "Overgangsmeter"}
                    {promotion.exam && (
                      <span className="font-sans text-sm font-normal whitespace-nowrap text-ink-3">
                        op je SE
                      </span>
                    )}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => openTool("overgang")}>
                    Details en normen
                  </Button>
                </div>
                <PromotionMeter
                  result={promotion.result}
                  exam={promotion.exam}
                  subjectName={(id) => subjects.get(id).name}
                />
              </GlassPanel>
            )}
            <InsightsPanel data={data} periods={periods} subject={subjects.get} />
          </div>

          <Tabs
            id="cijfers-weergave"
            value={showTab}
            onValueChange={setTab}
            items={tabs}
            aria-label="Weergave"
            className="mb-5 max-w-full overflow-x-auto"
          />

          {showTab === "vakken" && (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.subjects.map((subject) => (
                <li key={subject.id} id={`vak-${subject.id}`} className="scroll-mt-28">
                  <SubjectCard
                    subject={subject}
                    look={subjects.get(subject.id)}
                    grades={data.bySubject.get(subject.id) ?? []}
                    average={data.averages.get(subject.id) ?? null}
                    locked={data.locked.get(subject.id) ?? 0}
                    focused={subject.id === focus}
                    onOpenPack={openPack}
                    // Met iets in je pack zou Magisters gemiddelde je nieuwe cijfer verraden.
                    warning={data.locked.get(subject.id) ? undefined : warnings.get(subject.id)}
                  />
                </li>
              ))}
            </ul>
          )}
          {showTab === "ranglijst" && <RankingList data={data} subject={subjects.get} />}
          {showTab === "periodes" && (
            <GlassPanel>
              <PeriodChart data={data} periods={periods} subject={subjects.get} />
            </GlassPanel>
          )}
          {showTab === "tijdlijn" && <GradeTimeline data={data} subject={subjects.get} />}
          {showTab === "examen" && <ExamPanel data={data} subject={subjects.get} />}

          <div className="mt-6">
            <GuesserPanel />
          </div>
        </>
      )}

      <CalculatorSheet
        open={activeTool === "calculator"}
        onClose={closeTool}
        data={data}
        subject={subjects.get}
        initialSubject={activeTool === "calculator" ? toolSubject : null}
      />
      <SimulatorSheet
        open={activeTool === "simulator"}
        onClose={closeTool}
        data={data}
        subject={subjects.get}
      />
      <PromotionSheet
        open={activeTool === "overgang"}
        onClose={closeTool}
        data={data}
        subject={subjects.get}
      />
    </>
  );
}
