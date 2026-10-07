"use client";

import { ArrowDown, ArrowUp, Lightbulb, Minus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { CopyKey } from "@/content/copy";
import { formatGrade, gradeTone } from "@/lib/calc/average";
import { gradeInsights, gradeTimeline, type Insight, type Milestone } from "@/lib/calc/insights";
import { periodAverages, ranking } from "@/lib/calc/overview";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatShortDate, parseISODate } from "@/lib/date";
import type { Grade, Period } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";
import { GradeValue, TONE_TEXT } from "./GradeValue";
import type { GradeData } from "./useGradeData";

type Lookup = (id: string | null) => SubjectAppearance;

// ——— Inzichten ————————————————————————————————————————————————————————————

const INSIGHT_TONE = {
  good: "bg-good",
  warn: "bg-warn",
  neutral: "bg-[var(--sm-accent)]",
} as const;

function InsightLine({ insight }: { insight: Insight }) {
  const text = useCopy(insight.key as CopyKey, insight.vars);
  return (
    <li className="flex gap-3 text-sm text-ink">
      <span
        aria-hidden
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", INSIGHT_TONE[insight.tone])}
      />
      <span className="first-letter:uppercase">{text}</span>
    </li>
  );
}

/** Fase 4: inzichten in gewone taal, automatisch uit je cijfers. */
export function InsightsPanel({
  data,
  periods,
  subject,
}: {
  data: GradeData;
  periods: readonly Period[];
  subject: Lookup;
}) {
  const insights = useMemo(
    () => gradeInsights(data.visible, { name: (id) => subject(id).name, periods }),
    [data.visible, periods, subject],
  );
  return (
    <GlassPanel as="section" aria-labelledby="inzichten-titel">
      <h2
        id="inzichten-titel"
        className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink"
      >
        <Lightbulb size={18} aria-hidden className="text-accent-ink" />
        Inzichten
      </h2>
      {insights.length === 0 ? (
        <p className="text-sm text-ink-2">Nog te weinig cijfers om iets zinnigs te zeggen.</p>
      ) : (
        <ul className="sensitive space-y-2.5">
          {insights.map((insight) => (
            <InsightLine key={insight.id} insight={insight} />
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}

// ——— Ranglijst ————————————————————————————————————————————————————————————

const DIRECTION = {
  op: { icon: ArrowUp, className: "text-good", label: "omhoog" },
  neer: { icon: ArrowDown, className: "text-bad", label: "omlaag" },
  gelijk: { icon: Minus, className: "text-ink-3", label: "gelijk" },
  nieuw: { icon: Sparkles, className: "text-accent-ink", label: "nieuw" },
} as const;

/** Fase 4: je vakken op gemiddelde, met wat het laatste cijfer deed. */
export function RankingList({ data, subject }: { data: GradeData; subject: Lookup }) {
  const rows = useMemo(
    () =>
      ranking(
        data.visible,
        data.subjects.map((s) => s.id),
      ),
    [data],
  );
  if (rows.length === 0)
    return <p className="text-ink-2">Nog geen gemiddelden om op volgorde te zetten.</p>;
  return (
    <ol className="space-y-2">
      {rows.map((row, i) => {
        const look = subject(row.subjectId);
        const direction = DIRECTION[row.direction];
        const Icon = direction.icon;
        const delta = row.previous === null ? null : row.average - row.previous;
        return (
          <li key={row.subjectId}>
            <Link
              href={`/cijfers/${row.subjectId}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-glass px-3 py-2.5 transition-colors hover:bg-glass-strong"
            >
              <span className="w-6 text-right font-display text-sm font-semibold text-ink-3 tabular-nums">
                {i + 1}
              </span>
              <SubjectBadge subject={look} size="sm" />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{look.name}</span>
              <span
                className={cn("flex items-center gap-1 text-xs tabular-nums", direction.className)}
                title={`Door het laatste cijfer: ${direction.label}`}
              >
                <Icon size={14} aria-hidden />
                <span className="sensitive">
                  {delta !== null && row.direction !== "gelijk"
                    ? `${delta > 0 ? "+" : "−"}${formatGrade(Math.abs(delta), 2)}`
                    : ""}
                </span>
                <span className="sr-only">{direction.label}</span>
              </span>
              <GradeValue value={row.average} className="w-12 text-right text-lg font-semibold" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

// ——— Periodes vergelijken ————————————————————————————————————————————————

/** Eén kleur, van licht (periode 1) naar vol (laatste periode): de volgorde zit in de kleur. */
const PERIOD_FILL = [
  "color-mix(in oklab, var(--sm-accent) 52%, var(--sm-ink-3))",
  "color-mix(in oklab, var(--sm-accent) 78%, var(--sm-ink-3))",
  "var(--sm-accent)",
  "color-mix(in oklab, var(--sm-accent) 80%, var(--sm-ink))",
];

/** Fase 4: periode 1 tegenover 2 tegenover 3, per vak. */
export function PeriodChart({
  data,
  periods,
  subject,
}: {
  data: GradeData;
  periods: readonly Period[];
  subject: Lookup;
}) {
  const rows = useMemo(
    () =>
      data.subjects
        .map((s) => ({
          subjectId: s.id,
          periods: periodAverages(data.bySubject.get(s.id) ?? [], periods),
        }))
        .filter((row) => row.periods.some((p) => p.average !== null)),
    [data, periods],
  );
  if (periods.length === 0 || rows.length === 0)
    return <p className="text-ink-2">Nog geen periodes om te vergelijken.</p>;
  const pct = (value: number) => `${(value / 10) * 100}%`;

  return (
    <figure className="sensitive">
      <figcaption className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
        {periods.map((period, i) => (
          <span key={period.id} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-3 rounded-sm"
              style={{ background: PERIOD_FILL[i % PERIOD_FILL.length] }}
            />
            {period.name}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-ink-3">
          <span aria-hidden className="h-3 border-l-2 border-dashed border-line-strong" />
          5,5
        </span>
      </figcaption>
      <ul className="space-y-4">
        {rows.map((row) => {
          const look = subject(row.subjectId);
          return (
            <li
              key={row.subjectId}
              className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]"
            >
              <span className="truncate pt-0.5 text-sm font-medium text-ink">{look.name}</span>
              <div className="relative space-y-1">
                <span
                  aria-hidden
                  className="absolute inset-y-0 border-l-2 border-dashed border-line-strong"
                  style={{ left: pct(5.5) }}
                />
                {row.periods.map((p, i) => {
                  const name = periods[i]?.name ?? "";
                  return (
                    <div
                      key={p.periodId}
                      className="flex h-3.5 items-center gap-2"
                      title={`${name}: ${p.average === null ? "geen cijfers" : `${formatGrade(p.average)} (${p.count} ${p.count === 1 ? "cijfer" : "cijfers"})`}`}
                    >
                      {p.average === null ? (
                        <span className="text-[0.6875rem] text-ink-3">—</span>
                      ) : (
                        <>
                          <span
                            className="h-full rounded-r-[4px]"
                            style={{
                              width: pct(p.average),
                              background: PERIOD_FILL[i % PERIOD_FILL.length],
                            }}
                          />
                          <span
                            className={cn(
                              "text-[0.6875rem] font-semibold tabular-nums",
                              TONE_TEXT[gradeTone(p.average)],
                            )}
                          >
                            {formatGrade(p.average)}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-ink-2 hover:text-ink">Bekijk als tabel</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-ink-3">
            <tr>
              <th className="py-1 font-medium">Vak</th>
              {periods.map((period) => (
                <th key={period.id} className="py-1 text-right font-medium">
                  {period.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink-2">
            {rows.map((row) => (
              <tr key={row.subjectId} className="border-t border-line">
                <td className="py-1">{subject(row.subjectId).name}</td>
                {row.periods.map((p) => (
                  <td key={p.periodId} className="py-1 text-right">
                    {p.average === null ? "—" : formatGrade(p.average)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

// ——— Cijfertijdlijn ————————————————————————————————————————————————————————

const MILESTONE_KEY: Record<Milestone["kind"], CopyKey> = {
  eerste: "tijdlijn.eerste",
  hoogste: "tijdlijn.hoogste",
  negen: "tijdlijn.negen",
  comeback: "tijdlijn.comeback",
};

function MilestoneLine({
  milestone,
  grade,
  vak,
}: {
  milestone: Milestone;
  grade: Grade;
  vak: string;
}) {
  const text = useCopy(MILESTONE_KEY[milestone.kind], {
    vak,
    cijfer: grade.display,
    vorig: milestone.kind === "comeback" ? formatGrade(milestone.from) : "",
  });
  return <p className="mt-1 text-sm font-medium text-accent-ink">{text}</p>;
}

/** Fase 4: al je cijfers als verhaal, van het eerste tot het laatste. */
export function GradeTimeline({ data, subject }: { data: GradeData; subject: Lookup }) {
  const months = useMemo(() => gradeTimeline(data.visible), [data.visible]);
  if (months.length === 0)
    return <p className="text-ink-2">Je verhaal begint bij je eerste cijfer.</p>;
  return (
    <ol className="sensitive relative ml-2 border-l-2 border-line pl-5">
      {months.map((month) => (
        <li key={month.key} className="mb-6 last:mb-0">
          <h3 className="mb-3 -ml-[1.875rem] flex items-center gap-2 font-display font-semibold text-ink first-letter:uppercase">
            <span
              aria-hidden
              className="size-3 rounded-full border-2 border-line-strong bg-[var(--sm-bg)]"
            />
            <span className="first-letter:uppercase">{month.label}</span>
          </h3>
          <ul className="space-y-2.5">
            {month.entries.map(({ grade, milestone }) => {
              const look = subject(grade.subjectId);
              return (
                <li
                  key={grade.id}
                  className={cn(
                    "rounded-2xl px-3 py-2",
                    milestone
                      ? "border border-[color-mix(in_oklab,var(--sm-accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--sm-accent)_8%,transparent)]"
                      : "bg-glass",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: look.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      <span className="font-semibold">{look.name}</span>
                      <span className="text-ink-3"> · {grade.description}</span>
                    </span>
                    <span className="text-xs text-ink-3">
                      {formatShortDate(parseISODate(grade.date))}
                    </span>
                    {grade.kind === "numeric" ? (
                      <GradeValue value={grade.value} className="w-9 text-right font-semibold" />
                    ) : (
                      <span className="w-9 text-right font-semibold text-ink-2">{grade.value}</span>
                    )}
                  </div>
                  {milestone && (
                    <MilestoneLine milestone={milestone} grade={grade} vak={look.name} />
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
