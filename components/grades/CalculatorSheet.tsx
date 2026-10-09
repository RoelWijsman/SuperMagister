"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTrackOpen } from "@/lib/stats/use-track";
import { Sheet } from "@/components/ui/Sheet";
import { formatGrade, gradeTone, roundHalfUp } from "@/lib/calc/average";
import { averageWith, requiredGrade } from "@/lib/calc/whatif";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { useCopy, useCopyParts } from "@/lib/use-copy";
import { GradeValue, TONE_TEXT } from "./GradeValue";
import { NumberStepper } from "./NumberStepper";
import type { GradeData } from "./useGradeData";

const TARGETS = [5.5, 6, 7, 8];

/** Een logisch doel: de 5,5 als je eronder staat, anders een halve punt hoger. */
function defaultTarget(average: number | null): number {
  if (average === null || roundHalfUp(average, 1) < 5.5) return 5.5;
  return Math.min(10, Math.ceil((average + 0.01) * 2) / 2);
}

/** De weging die bij dit vak het vaakst voorkomt. */
function usualWeight(data: GradeData, subjectId: string): number {
  const weights = (data.bySubject.get(subjectId) ?? [])
    .filter((g) => g.kind === "numeric" && g.countsTowardAverage && g.weight > 0)
    .map((g) => g.weight);
  if (weights.length === 0) return 1;
  const counts = new Map<number, number>();
  for (const w of weights) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]![0];
}

function Calculator({
  data,
  subject,
  initialSubject,
}: {
  data: GradeData;
  subject: (id: string | null) => SubjectAppearance;
  initialSubject: string | null;
}) {
  // Vakken met alleen V/G (zoals lo) hebben niets te berekenen.
  const calculable = data.subjects.filter((s) => {
    const own = data.bySubject.get(s.id) ?? [];
    return own.length === 0 || own.some((g) => g.kind === "numeric");
  });
  const withGrades = calculable.filter((s) => (data.bySubject.get(s.id) ?? []).length > 0);
  const fallback = withGrades.find((s) => data.averages.get(s.id) !== null) ?? withGrades[0];
  const [subjectId, setSubjectId] = useState(
    initialSubject && calculable.some((s) => s.id === initialSubject)
      ? initialSubject
      : (fallback?.id ?? calculable[0]?.id ?? ""),
  );
  const average = data.averages.get(subjectId) ?? null;
  const [target, setTarget] = useState(() => defaultTarget(average));
  const [weight, setWeight] = useState(() => usualWeight(data, subjectId));
  const [hypothetical, setHypothetical] = useState(7);

  const grades = data.bySubject.get(subjectId) ?? [];
  const needed = requiredGrade(grades, target, weight);
  const after = averageWith(grades, hypothetical, weight);
  const look = subject(subjectId);

  const mogelijk = useCopy(needed.status === "mogelijk" ? "calc.mogelijk" : null, {
    nodig: needed.grade === null ? "" : formatGrade(needed.grade),
    doel: formatGrade(target),
  });
  const verdict = useCopyParts(
    needed.status === "binnen"
      ? "calc.binnen"
      : needed.status === "onmogelijk"
        ? "calc.onmogelijk"
        : needed.status === "telt-niet"
          ? "calc.teltNiet"
          : null,
    { doel: formatGrade(target), vak: look.name },
  );
  const reverse = useCopy("calc.omgekeerd", {
    cijfer: formatGrade(hypothetical),
    gem: formatGrade(after),
  });

  const changeSubject = (id: string) => {
    setSubjectId(id);
    setTarget(defaultTarget(data.averages.get(id) ?? null));
    setWeight(usualWeight(data, id));
  };

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Vak</span>
        <span className="relative block">
          <select
            value={subjectId}
            onChange={(event) => changeSubject(event.target.value)}
            className="h-11 w-full cursor-pointer appearance-none rounded-full glass pr-10 pl-4 font-medium text-ink"
          >
            {calculable.map((s) => {
              const avg = data.averages.get(s.id);
              return (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {avg !== null && avg !== undefined ? ` (${formatGrade(avg)})` : ""}
                </option>
              );
            })}
          </select>
          <ChevronDown
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-3"
          />
        </span>
        <span className="mt-1.5 block text-sm text-ink-3">
          Nu:{" "}
          {average !== null ? (
            <GradeValue value={average} className="font-semibold" />
          ) : (
            "nog geen gemiddelde"
          )}{" "}
          · {grades.length} {grades.length === 1 ? "cijfer" : "cijfers"}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-ink">Je doel</span>
          <NumberStepper
            label="Doelgemiddelde"
            value={target}
            onChange={setTarget}
            min={1}
            max={10}
            step={0.1}
            format={(v) => formatGrade(v)}
            size="lg"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TARGETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTarget(t)}
                aria-pressed={Math.abs(target - t) < 1e-9}
                className={cn(
                  "h-8 rounded-full px-3 text-sm tabular-nums transition-colors",
                  Math.abs(target - t) < 1e-9
                    ? "bg-glass-strong font-semibold text-ink"
                    : "text-ink-2 hover:bg-glass",
                )}
              >
                {formatGrade(t)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-ink">Weging volgende toets</span>
          <NumberStepper
            label="Weging"
            value={weight}
            onChange={setWeight}
            min={0}
            max={10}
            format={(v) => `×${v}`}
            size="lg"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-glass p-5 text-center" aria-live="polite">
        {needed.status === "mogelijk" && needed.grade !== null ? (
          <>
            <p className="text-sm text-ink-2">Je hebt minimaal nodig</p>
            <p
              className={cn(
                "sensitive font-display text-7xl leading-none font-semibold tabular-nums",
                TONE_TEXT[gradeTone(needed.grade)],
              )}
            >
              {formatGrade(needed.grade)}
            </p>
            <p className="mt-2 text-ink-2">{mogelijk}</p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl font-semibold text-ink">{verdict?.title}</p>
            <p className="mt-1 text-ink-2">{verdict?.body}</p>
          </>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-ink">En andersom</span>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={hypothetical}
            onChange={(event) => setHypothetical(Number(event.target.value))}
            aria-label="Stel je haalt een"
            aria-valuetext={formatGrade(hypothetical)}
            className="flex-1 accent-[var(--sm-accent)]"
          />
          <GradeValue value={hypothetical} className="w-12 text-right text-lg font-semibold" />
        </div>
        <p className="mt-1.5 text-ink-2">{reverse}</p>
      </div>

      <p className="text-xs text-ink-3">
        Alleen onthulde cijfers tellen mee. De calculator gokt niet op afronding: hij rekent tot je
        gemiddelde echt op je doel staat.
      </p>
    </div>
  );
}

/** Fase 4: "Wat moet ik halen?" Kies een vak, een doel en de weging. */
export function CalculatorSheet({
  open,
  onClose,
  data,
  subject,
  initialSubject,
}: {
  open: boolean;
  onClose: () => void;
  data: GradeData | null;
  subject: (id: string | null) => SubjectAppearance;
  initialSubject: string | null;
}) {
  useTrackOpen(open, "calculator-gebruikt");
  return (
    <Sheet open={open} onClose={onClose} title="Wat moet ik halen?" size="md">
      {data && (
        <Calculator
          key={initialSubject ?? "-"}
          data={data}
          subject={subject}
          initialSubject={initialSubject}
        />
      )}
    </Sheet>
  );
}
