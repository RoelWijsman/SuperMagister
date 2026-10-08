"use client";

import { TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Sheet } from "@/components/ui/Sheet";
import { useAverageChecks } from "@/lib/data/hooks";
import type { AverageCheck } from "@/lib/magister/parse/progress";
import { useCopy } from "@/lib/use-copy";
import { GradeValue } from "./GradeValue";
import { usePeriodList } from "./useGradeData";

/**
 * Per vak de perioden waar Magisters eigen gemiddelde (afgerond op één
 * decimaal) anders is dan het onze. Alleen bij een echte koppeling; de demo
 * heeft geen Magister om mee te vergelijken.
 */
export function useAverageWarnings(): ReadonlyMap<string, AverageCheck[]> {
  const checks = useAverageChecks();
  return useMemo(() => {
    const map = new Map<string, AverageCheck[]>();
    for (const check of checks.data ?? [])
      if (check.differs) map.set(check.subjectId, [...(map.get(check.subjectId) ?? []), check]);
    return map;
  }, [checks.data]);
}

const CAUSES = [
  "Magister telt een cijfer niet mee dat wij wel meetellen, of andersom.",
  "Een cijfer heeft bij Magister een andere weging.",
  "Je school rekent met een eigen formule, of rondt tussendoor af.",
];

function Explanation({ checks }: { checks: readonly AverageCheck[] }) {
  const periods = usePeriodList();
  const name = (id: string | null) => periods.find((p) => p.id === id)?.name ?? "Dit schooljaar";
  return (
    <>
      <ul className="space-y-2">
        {checks.map((check) => (
          <li
            key={check.periodId ?? "jaar"}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border border-line px-3 py-2 text-sm"
          >
            <span className="text-ink-2">{name(check.periodId)}</span>
            <span className="flex items-center gap-3">
              <span className="text-ink-3">
                Wij <GradeValue value={check.ours} className="ml-1 font-semibold" />
              </span>
              <span className="text-ink-3">
                Magister <GradeValue value={check.magister} className="ml-1 font-semibold" />
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm font-semibold text-ink">Waar het meestal aan ligt</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink-2">
        {CAUSES.map((cause) => (
          <li key={cause}>{cause}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-3">
        Je cijferoverzicht in Magister is leidend: daar zie je welke cijfers meetellen en hoe zwaar.
      </p>
    </>
  );
}

/** Het kleine waarschuwingsicoon op een vakkaart, met uitleg als je erop tikt. */
export function AverageWarningButton({
  checks,
  subjectName,
}: {
  checks: readonly AverageCheck[];
  subjectName: string;
}) {
  const [open, setOpen] = useState(false);
  const line = useCopy("cijfers.magisterAnders") ?? "";
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={line}
        aria-label={`${subjectName}: ${line}`}
        className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-warn hover:bg-glass"
      >
        <TriangleAlert size={17} strokeWidth={2.4} aria-hidden />
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={line}
        description={subjectName}
        size="sm"
      >
        <Explanation checks={checks} />
      </Sheet>
    </>
  );
}

/** Dezelfde uitleg als paneel, in het vak-detail. */
export function AverageWarningPanel({ checks }: { checks: readonly AverageCheck[] }) {
  const line = useCopy("cijfers.magisterAnders");
  return (
    <GlassPanel
      as="section"
      aria-labelledby="magister-anders"
      className="border-[color-mix(in_oklab,var(--sm-warn)_40%,transparent)]"
    >
      <h2 id="magister-anders" className="mb-3 flex items-start gap-2 font-semibold text-ink">
        <TriangleAlert size={18} aria-hidden className="mt-0.5 shrink-0 text-warn" />
        {line}
      </h2>
      <Explanation checks={checks} />
    </GlassPanel>
  );
}
