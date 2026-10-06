"use client";

import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import { gradeTone } from "@/lib/calc/average";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import type { GradeTrend } from "@/lib/today/trend";
import { useCopy } from "@/lib/use-copy";

const TONE_DOT = {
  bad: "bg-[color-mix(in_oklab,var(--sm-bad)_22%,transparent)] text-bad ring-bad/50",
  warn: "bg-[color-mix(in_oklab,var(--sm-warn)_22%,transparent)] text-warn ring-warn/50",
  good: "bg-[color-mix(in_oklab,var(--sm-good)_22%,transparent)] text-good ring-good/50",
} as const;

const ARROWS = { omhoog: TrendingUp, omlaag: TrendingDown, gelijk: ArrowRight } as const;
const ARROW_LABEL = { omhoog: "stijgend", omlaag: "dalend", gelijk: "stabiel" } as const;

/**
 * Fase 3a: je laatste vijf cijfers als bolletjes, met een pijltje. Alleen
 * onthulde cijfers: wat nog in je pack zit, verklappen we hier niet.
 */
export function TrendWidget({
  trend,
  subject,
  isLoading,
}: {
  trend: GradeTrend | null;
  subject: (id: string | null) => SubjectAppearance;
  isLoading: boolean;
}) {
  const line = useCopy(isLoading ? null : trend ? `trend.${trend.direction}` : "trend.leeg");
  const Arrow = trend ? ARROWS[trend.direction] : null;

  return (
    <Widget
      title="Trend"
      icon={TrendingUp}
      action={
        <Link href="/cijfers" className="text-sm font-medium text-accent-ink hover:underline">
          Cijfers
        </Link>
      }
    >
      {isLoading ? (
        <div className="flex gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="size-12 rounded-full" />
          ))}
        </div>
      ) : (
        <>
          {trend && Arrow && (
            <div className="flex items-center gap-2.5 sm:gap-3">
              <ol
                aria-label="Je laatste cijfers, oud naar nieuw"
                className="flex flex-1 gap-2 sm:gap-3"
              >
                {trend.recent.map((grade) => {
                  const look = subject(grade.subjectId);
                  return (
                    <li key={grade.id} className="flex min-w-0 flex-col items-center gap-1">
                      <span
                        className={cn(
                          "sensitive grid size-11 place-items-center rounded-full font-display text-base font-semibold ring-1 sm:size-12",
                          TONE_DOT[gradeTone(grade.value)],
                        )}
                      >
                        {grade.display}
                      </span>
                      <span className="max-w-12 truncate text-xs text-ink-3">
                        {look.code || look.name}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-2xl",
                  trend.direction === "omhoog"
                    ? "bg-good/15 text-good"
                    : trend.direction === "omlaag"
                      ? "bg-bad/15 text-bad"
                      : "bg-glass-strong text-ink-2",
                )}
                role="img"
                aria-label={`Trend: ${ARROW_LABEL[trend.direction]}`}
              >
                <Arrow size={22} aria-hidden />
              </span>
            </div>
          )}
          <p className={cn("text-sm text-ink-2", trend && "mt-3")}>{line}</p>
        </>
      )}
    </Widget>
  );
}
