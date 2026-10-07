"use client";

import { useMemo, useState } from "react";
import { GradeChart } from "@/components/grades/GradeChart";
import { NumberStepper } from "@/components/grades/NumberStepper";
import { PromotionMeter } from "@/components/grades/PromotionMeter";
import { Sparkline } from "@/components/grades/SubjectCard";
import { formatGrade } from "@/lib/calc/average";
import { evaluatePromotion, NORM_PRESETS, type PromotionSubject } from "@/lib/calc/promotion";
import { useSubjectAppearance } from "@/lib/data/hooks";
import type { Grade } from "@/lib/types";

/** Verzonnen cijfers, alleen voor de stijlgids. */
const GRADES: Grade[] = [
  [5.9, 2, "2026-09-03", "Reading test"],
  [6.3, 1, "2026-09-17", "SO Vocabulary"],
  [4.2, 0, "2026-09-24", "Oefentoets"],
  [6.8, 2, "2026-10-01", "Writing"],
  [7.4, 3, "2026-10-15", "Kijk- en luistertoets"],
  [7.9, 1, "2026-10-29", "SO Idioms"],
].map(([value, weight, date, description], i) => ({
  id: `stijl-cijfer-${i}`,
  subjectId: "en",
  description: description as string,
  weight: weight as number,
  date: date as string,
  enteredAt: `${date as string}T15:00:00Z`,
  periodId: "p1",
  countsTowardAverage: (weight as number) > 0,
  isPTA: false,
  kind: "numeric",
  value: value as number,
  display: formatGrade(value as number),
  isSufficient: (value as number) >= 5.5,
}));

const meter = (...averages: number[]): PromotionSubject[] =>
  averages.map((average, i) => ({
    subjectId: ["ne", "en", "wisa", "biol", "gs", "du"][i]!,
    average,
    isCore: i < 3,
  }));

const EXAMPLES = [
  { title: "Over", subjects: meter(6.8, 7.2, 6.4, 7.5, 6.9, 5.3) },
  { title: "Bespreekgeval", subjects: meter(6, 6, 6, 5.2, 5.1, 6.1) },
  { title: "Gevarenzone", subjects: meter(5.3, 6.4, 4.4, 4.8, 6.2, 5.1) },
];

/** Stijlgids: de bouwstenen van Cijfers (fase 4). */
export function GradeSamples() {
  const subjects = useSubjectAppearance();
  const [target, setTarget] = useState(5.5);
  const results = useMemo(
    () => EXAMPLES.map((e) => evaluatePromotion(e.subjects, NORM_PRESETS.standaard.norms)),
    [],
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-8">
        <div>
          <p className="mb-2 text-sm text-ink-2">Stapper (doel, weging, normen)</p>
          <NumberStepper
            label="Doel"
            value={target}
            onChange={setTarget}
            min={1}
            max={10}
            step={0.1}
            format={(v) => formatGrade(v)}
            size="lg"
          />
        </div>
        <div className="w-40">
          <p className="mb-2 text-sm text-ink-2">Trendlijntje op een vakkaart</p>
          <Sparkline grades={GRADES} color={subjects.get("en").color} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {results.map((result, i) => (
          <div key={EXAMPLES[i]!.title} className="rounded-panel border border-line bg-glass p-4">
            <PromotionMeter
              result={result}
              exam={false}
              subjectName={(id) => subjects.get(id).name}
            />
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-2">
          Vakgrafiek: grotere stip is een zwaardere toets, een open ring telt niet mee.
        </p>
        <GradeChart grades={GRADES} color={subjects.get("en").color} />
      </div>
    </div>
  );
}
