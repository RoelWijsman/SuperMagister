"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Tilt } from "@/components/ui/Tilt";
import { formatGrade, gradeTone } from "@/lib/calc/average";
import { averageHistory } from "@/lib/calc/overview";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import type { AverageCheck } from "@/lib/magister/parse/progress";
import type { Grade, Subject } from "@/lib/types";
import { AverageWarningButton } from "./AverageWarning";
import { GradeValue, TONE_TEXT } from "./GradeValue";

const PILL_TONE = {
  good: "bg-[color-mix(in_oklab,var(--sm-good)_16%,transparent)]",
  warn: "bg-[color-mix(in_oklab,var(--sm-warn)_16%,transparent)]",
  bad: "bg-[color-mix(in_oklab,var(--sm-bad)_16%,transparent)]",
} as const;

const TONE_FILL = {
  good: "var(--sm-good)",
  warn: "var(--sm-warn)",
  bad: "var(--sm-bad)",
} as const;

export function GradePill({ grade }: { grade: Grade }) {
  if (grade.kind === "text") {
    return (
      <span className="sensitive grid h-7 min-w-9 place-items-center rounded-lg bg-glass-strong px-1.5 text-sm font-semibold text-ink-2">
        {grade.display}
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

/** Een geblurd cijfer uit je pack: je ziet dát er iets is, niet wat. */
function LockedPill() {
  return (
    <span
      aria-hidden
      className="grid h-7 min-w-9 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--sm-accent)_18%,transparent)] px-1.5 text-sm font-semibold text-accent-ink blur-[3px]"
    >
      ?,?
    </span>
  );
}

/** Trendlijntje van de laatste cijfers die meetellen, met de 5,5 als stippellijn. */
export function Sparkline({
  grades,
  color,
  className,
}: {
  grades: readonly Grade[];
  color: string;
  className?: string;
}) {
  const points = averageHistory(grades)
    .filter((p) => p.counts)
    .slice(-8);
  if (points.length < 2) return <div className={cn("h-9", className)} />;
  const values = points.map((p) => p.value);
  const low = Math.max(1, Math.min(...values, 5.5) - 0.5);
  const high = Math.min(10, Math.max(...values, 5.5) + 0.5);
  const W = 120;
  const H = 36;
  const x = (i: number) => 3 + (i / (points.length - 1)) * (W - 6);
  const y = (v: number) => 3 + (1 - (v - low) / (high - low)) * (H - 6);
  const last = points.at(-1)!;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("sensitive block h-9 w-full overflow-visible", className)}
      role="img"
      aria-label={`Laatste ${points.length} cijfers: ${values.map((v) => formatGrade(v)).join(", ")}`}
    >
      <line
        x1={0}
        x2={W}
        y1={y(5.5)}
        y2={y(5.5)}
        stroke="var(--sm-line-strong)"
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={x(points.length - 1)}
        cy={y(last.value)}
        r={3.5}
        fill={TONE_FILL[gradeTone(last.value)]}
        stroke="var(--sm-bg)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Fase 4: een vak in het overzicht. Tik voor het vak-detail. */
export function SubjectCard({
  subject,
  look,
  grades,
  average,
  locked,
  focused,
  onOpenPack,
  warning,
}: {
  subject: Subject;
  look: SubjectAppearance;
  grades: readonly Grade[];
  average: number | null;
  locked: number;
  focused?: boolean;
  onOpenPack: () => void;
  /** Perioden waar Magister anders rekent (alleen bij een echte koppeling). */
  warning?: readonly AverageCheck[];
}) {
  const latest = [...grades]
    .sort((a, b) => a.date.localeCompare(b.date) || a.enteredAt.localeCompare(b.enteredAt))
    .slice(-5);
  return (
    <Tilt className="h-full">
      <GlassPanel
        className={cn(
          "relative h-full overflow-hidden",
          focused &&
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
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-ink">
              <Link
                href={`/cijfers/${subject.id}`}
                className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                {subject.name}
              </Link>
            </h2>
            <p className="text-sm text-ink-3">
              {grades.length} {grades.length === 1 ? "cijfer" : "cijfers"}
              {subject.isCore && " · kernvak"}
            </p>
          </div>
          {warning && warning.length > 0 && (
            <AverageWarningButton checks={warning} subjectName={subject.name} />
          )}
        </div>
        <div className="relative mt-4 flex items-end justify-between gap-4">
          {average !== null ? (
            <GradeValue
              value={average}
              className="font-display text-5xl leading-none font-semibold tracking-tight"
            />
          ) : (
            <span className="font-display text-3xl leading-none font-semibold text-ink-3">
              {/* Alleen "inhalen" of een vrijstelling is nog geen beoordeling. */}
              {grades.some((g) => g.kind === "text" && g.value !== "INH" && g.value !== "VR")
                ? "V/G"
                : "—"}
            </span>
          )}
          <Sparkline grades={grades} color={look.color} className="max-w-32" />
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
          {latest.map((grade) => (
            <GradePill key={grade.id} grade={grade} />
          ))}
          {locked > 0 && (
            <>
              {Array.from({ length: Math.min(locked, 3) }, (_, i) => (
                <LockedPill key={i} />
              ))}
              <button
                type="button"
                onClick={onOpenPack}
                className="relative z-10 flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-accent-ink hover:bg-glass"
              >
                <Lock size={12} strokeWidth={2.6} aria-hidden />
                Open je pack
              </button>
            </>
          )}
        </div>
      </GlassPanel>
    </Tilt>
  );
}
