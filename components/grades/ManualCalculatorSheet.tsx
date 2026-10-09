"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { formatGrade, gradeTone, weightedAverage } from "@/lib/calc/average";
import { manualGrades, type ManualRow } from "@/lib/calc/manual";
import { averageWith, requiredGrade } from "@/lib/calc/whatif";
import { cn } from "@/lib/cn";
import { useCopy, useCopyParts } from "@/lib/use-copy";
import { useCalculator } from "@/stores/calculator";
import { GradeValue, TONE_TEXT } from "./GradeValue";
import { NumberStepper } from "./NumberStepper";

const TARGETS = [5.5, 6, 7, 8];

/** "6,4" of "6.4" wordt 6.4; leeg of onzin wordt NaN (en telt dan niet mee). */
const parseGrade = (text: string) =>
  text.trim() === "" ? Number.NaN : Number(text.replace(",", "."));

function ManualCalculator() {
  const [rows, setRows] = useState<{ text: string; weight: number }[]>([
    { text: "", weight: 1 },
    { text: "", weight: 1 },
  ]);
  const [target, setTarget] = useState(5.5);
  const [weight, setWeight] = useState(1);
  const [hypothetical, setHypothetical] = useState(7);

  const parsed: ManualRow[] = rows.map((row) => ({
    value: parseGrade(row.text),
    weight: row.weight,
  }));
  const grades = manualGrades(parsed);
  const average = weightedAverage(grades);
  const needed = requiredGrade(grades, target, weight);
  const after = averageWith(grades, hypothetical, weight);

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
    { doel: formatGrade(target), vak: "dit vak" },
  );
  const reverse = useCopy("calc.omgekeerd", {
    cijfer: formatGrade(hypothetical),
    gem: formatGrade(after),
  });

  const update = (index: number, change: Partial<{ text: string; weight: number }>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...change } : row)));

  return (
    <div className="space-y-5">
      <div>
        <span className="mb-1.5 block text-sm font-semibold text-ink">Je cijfers tot nu toe</span>
        <ul className="space-y-2">
          {rows.map((row, index) => {
            const value = parseGrade(row.text);
            const invalid = row.text.trim() !== "" && !(value >= 1 && value <= 10);
            return (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <input
                  inputMode="decimal"
                  value={row.text}
                  onChange={(event) => update(index, { text: event.target.value })}
                  placeholder="bijv. 6,4"
                  aria-label={`Cijfer ${index + 1}`}
                  aria-invalid={invalid || undefined}
                  className={cn(
                    "h-11 w-28 rounded-full glass px-4 text-center font-medium text-ink tabular-nums placeholder:text-ink-3",
                    invalid && "ring-2 ring-bad",
                  )}
                />
                <NumberStepper
                  label={`Weging cijfer ${index + 1}`}
                  value={row.weight}
                  onChange={(weightValue) => update(index, { weight: weightValue })}
                  min={1}
                  max={10}
                  format={(v) => `×${v}`}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  icon={Trash2}
                  aria-label={`Cijfer ${index + 1} weghalen`}
                  disabled={rows.length === 1}
                  onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                />
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={Plus}
            onClick={() => setRows((current) => [...current, { text: "", weight: 1 }])}
          >
            Cijfer erbij
          </Button>
          <span className="text-sm text-ink-3">
            Nu:{" "}
            {average !== null ? (
              <GradeValue value={average} className="font-semibold" />
            ) : (
              "nog geen gemiddelde"
            )}
          </span>
        </div>
      </div>

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
            label="Weging volgende toets"
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
                "font-display text-7xl leading-none font-semibold tabular-nums",
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
        Wat je hier invult, blijft alleen in dit venster: het wordt nergens bewaard.
      </p>
    </div>
  );
}

/** "Wat moet ik halen?" met handmatig invullen: voor oefenkaarten, de demo en zonder koppeling. */
export function ManualCalculatorSheet() {
  const open = useCalculator((s) => s.manualOpen);
  const close = useCalculator((s) => s.closeManual);
  return (
    <Sheet
      open={open}
      onClose={close}
      // Boven alles: hij kan ook vanuit de walkout in de onboarding open gaan.
      layer="boven"
      title="Wat moet ik halen?"
      description="Vul je cijfers en hun weging in. Zonder koppeling rekenen we met wat jij invult."
      size="md"
    >
      {open && <ManualCalculator />}
    </Sheet>
  );
}
