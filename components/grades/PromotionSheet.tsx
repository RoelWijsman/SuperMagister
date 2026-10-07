"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { formatGrade } from "@/lib/calc/average";
import { NORM_PRESETS, type NormPresetId, type PromotionNorms } from "@/lib/calc/promotion";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { useGradesStore } from "@/stores/grades";
import { NumberStepper } from "./NumberStepper";
import { PromotionMeter } from "./PromotionMeter";
import { usePromotionResult, type GradeData } from "./useGradeData";

type NumberKey = Exclude<keyof PromotionNorms, "minAverageWhenShort" | "minAverage">;

const NUMBER_FIELDS: { key: NumberKey; label: string; min: number; max: number }[] = [
  { key: "freePoints", label: "Tekortpunten die altijd mogen", min: 0, max: 6 },
  { key: "maxPoints", label: "Hooguit tekortpunten", min: 0, max: 10 },
  { key: "maxSubjects", label: "Hooguit vakken met een tekort", min: 0, max: 6 },
  { key: "minGrade", label: "Laagste cijfer dat nog mag", min: 1, max: 6 },
  { key: "coreMaxPoints", label: "Kernvakken: hooguit tekortpunten", min: 0, max: 6 },
  { key: "coreMinGrade", label: "Kernvakken: laagste cijfer", min: 1, max: 6 },
  { key: "discussPoints", label: "Marge voor een bespreekgeval", min: 0, max: 4 },
];

/** Fase 4: de overgangsmeter in detail, met je eigen normen. */
export function PromotionSheet({
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
  const promotion = usePromotionResult(data);
  const setPreset = useGradesStore((s) => s.setPreset);
  const setNorm = useGradesStore((s) => s.setNorm);
  const resetNorms = useGradesStore((s) => s.resetNorms);

  return (
    <Sheet open={open} onClose={onClose} title="Overgangsmeter" size="lg">
      {promotion && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <div>
            <PromotionMeter
              result={promotion.result}
              exam={promotion.exam}
              subjectName={(id) => subject(id).name}
              detailed
            />
            <p className="mt-4 text-xs text-ink-3">
              {promotion.exam
                ? "Een schatting op je SE-cijfers (PTA). Het echte eindcijfer komt pas na het centraal examen. Combinatievakken kies je bij het tabblad Examen."
                : "Op je rapportcijfers: je gemiddelde per vak zoals je het ziet, afgerond op een heel cijfer. Elke school heeft eigen normen; stel ze hiernaast in."}{" "}
              Alleen onthulde cijfers tellen mee.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Normen</span>
              <span className="relative block">
                <select
                  value={promotion.settings.presetId}
                  onChange={(event) => setPreset(event.target.value as NormPresetId)}
                  className="h-11 w-full cursor-pointer appearance-none rounded-full glass pr-10 pl-4 font-medium text-ink"
                >
                  {(Object.keys(NORM_PRESETS) as NormPresetId[]).map((id) => (
                    <option key={id} value={id}>
                      {NORM_PRESETS[id].name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-3"
                />
              </span>
              <span className="mt-1.5 block text-sm text-ink-2">
                {NORM_PRESETS[promotion.settings.presetId].description}
              </span>
            </label>

            <ul className="divide-y divide-line">
              {NUMBER_FIELDS.map((field) => (
                <li key={field.key} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm text-ink">{field.label}</span>
                  <NumberStepper
                    label={field.label}
                    value={promotion.settings.norms[field.key]}
                    onChange={(value) => setNorm(promotion.settings.norms, field.key, value)}
                    min={field.min}
                    max={field.max}
                  />
                </li>
              ))}
              <li className="py-2">
                <Switch
                  label="Gemiddelde eisen bij tekorten"
                  description="Boven de vrije tekortpunten moet je gemiddeld minstens dit staan."
                  checked={promotion.settings.norms.minAverageWhenShort !== null}
                  onCheckedChange={(on) =>
                    setNorm(promotion.settings.norms, "minAverageWhenShort", on ? 6 : null)
                  }
                />
                {promotion.settings.norms.minAverageWhenShort !== null && (
                  <NumberStepper
                    label="Gemiddelde bij tekorten"
                    value={promotion.settings.norms.minAverageWhenShort}
                    onChange={(value) =>
                      setNorm(promotion.settings.norms, "minAverageWhenShort", value)
                    }
                    min={5}
                    max={8}
                    step={0.1}
                    format={(v) => formatGrade(v)}
                    className="mt-1 justify-end"
                  />
                )}
              </li>
            </ul>
            {promotion.settings.isCustom && (
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetNorms}>
                Terug naar &quot;{NORM_PRESETS[promotion.settings.presetId].name}&quot;
              </Button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
