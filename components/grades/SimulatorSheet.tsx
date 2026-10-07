"use client";

import { ArrowRight, ChevronDown, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { formatGrade, weightedAverage } from "@/lib/calc/average";
import { withHypothetical, type Hypothetical } from "@/lib/calc/overview";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { useCopy } from "@/lib/use-copy";
import { GradeValue } from "./GradeValue";
import { NumberStepper } from "./NumberStepper";
import { PromotionMeter } from "./PromotionMeter";
import { usePromotionResult, type GradeData } from "./useGradeData";

let nextId = 0;

function Simulator({
  data,
  subject,
}: {
  data: GradeData;
  subject: (id: string | null) => SubjectAppearance;
}) {
  const intro = useCopy("simulator.intro");
  const [items, setItems] = useState<Hypothetical[]>([]);
  const extra = useMemo(() => withHypothetical([], items), [items]);
  const promotion = usePromotionResult(data, extra);
  const subjectIds = data.subjects.map((s) => s.id);

  const add = () => {
    // Begin bij het vak met het laagste gemiddelde: daar valt het meeste te winnen.
    const lowest = [...data.subjects]
      .filter((s) => data.averages.get(s.id) != null)
      .sort((a, b) => data.averages.get(a.id)! - data.averages.get(b.id)!)[0];
    const subjectId = items.at(-1)?.subjectId ?? lowest?.id ?? subjectIds[0]!;
    nextId += 1;
    setItems((list) => [
      ...list,
      { id: String(nextId), subjectId, value: 7, weight: 1, isPTA: promotion?.exam ?? false },
    ]);
  };
  const update = (id: string, change: Partial<Hypothetical>) =>
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...change } : item)));

  const touched = [...new Set(items.map((item) => item.subjectId))];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="space-y-4">
        <p className="text-ink-2">{intro}</p>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-line bg-glass p-3.5">
              <div className="flex items-center gap-2">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Vak</span>
                  <select
                    value={item.subjectId}
                    onChange={(event) => update(item.id, { subjectId: event.target.value })}
                    className="h-10 w-full cursor-pointer appearance-none rounded-full glass pr-9 pl-4 text-sm font-medium text-ink"
                  >
                    {data.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
                  />
                </label>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  icon={Trash2}
                  aria-label="Dit cijfer weghalen"
                  onClick={() => setItems((list) => list.filter((other) => other.id !== item.id))}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex min-w-48 flex-1 items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.1}
                    value={item.value}
                    onChange={(event) => update(item.id, { value: Number(event.target.value) })}
                    aria-label={`Denkbeeldig cijfer voor ${subject(item.subjectId).name}`}
                    aria-valuetext={formatGrade(item.value)}
                    className="flex-1 accent-[var(--sm-accent)]"
                  />
                  <GradeValue
                    value={item.value}
                    className="w-10 text-right text-lg font-semibold"
                  />
                </div>
                <NumberStepper
                  label="Weging"
                  value={item.weight}
                  onChange={(weight) => update(item.id, { weight })}
                  min={1}
                  max={10}
                  format={(v) => `×${v}`}
                />
                {data.isExamYear && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
                    <input
                      type="checkbox"
                      checked={item.isPTA ?? false}
                      onChange={(event) => update(item.id, { isPTA: event.target.checked })}
                      className="size-4 accent-[var(--sm-accent)]"
                    />
                    Telt voor je SE (PTA)
                  </label>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button variant="glass" icon={Plus} onClick={add}>
            Cijfer toevoegen
          </Button>
          {items.length > 0 && (
            <Button variant="ghost" icon={RotateCcw} onClick={() => setItems([])}>
              Reset
            </Button>
          )}
        </div>

        {touched.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Wat er verandert</h3>
            <ul className="divide-y divide-line">
              {touched.map((subjectId) => {
                const before = data.averages.get(subjectId) ?? null;
                const after = weightedAverage([
                  ...(data.bySubject.get(subjectId) ?? []),
                  ...extra.filter((g) => g.subjectId === subjectId),
                ]);
                return (
                  <li key={subjectId} className="flex items-center gap-2 py-2 text-sm">
                    <span className="flex-1 font-medium text-ink">{subject(subjectId).name}</span>
                    {before !== null ? (
                      <GradeValue value={before} />
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                    <ArrowRight size={14} aria-hidden className="text-ink-3" />
                    {after !== null && <GradeValue value={after} className="font-semibold" />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {promotion && (
        <div className="rounded-panel border border-line bg-glass p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink-2">Overgangsmeter, live</h3>
          <PromotionMeter
            result={promotion.result}
            exam={promotion.exam}
            subjectName={(id) => subject(id).name}
          />
        </div>
      )}
    </div>
  );
}

/** Fase 4: de simulator. Denkbeeldige cijfers, en de meter beweegt live mee. */
export function SimulatorSheet({
  open,
  onClose,
  data,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  data: GradeData | null;
  subject: (id: string | null) => SubjectAppearance;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Simulator" size="lg">
      {data && <Simulator data={data} subject={subject} />}
    </Sheet>
  );
}
