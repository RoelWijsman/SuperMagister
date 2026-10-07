"use client";

import { Check } from "lucide-react";
import { useMemo } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatGrade } from "@/lib/calc/average";
import { combinationGrade, examOverview, seAverage, suggestedCombination } from "@/lib/calc/exam";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatShortDate, parseISODate } from "@/lib/date";
import { useGradesStore } from "@/stores/grades";
import { GradePill } from "./SubjectCard";
import { GradeValue } from "./GradeValue";
import { usePromotionSettings, type GradeData } from "./useGradeData";

/**
 * Fase 4, bovenbouw: per vak de PTA-kolommen apart, het SE-gemiddelde
 * afgerond en onafgerond, en het combinatiecijfer.
 */
export function ExamPanel({
  data,
  subject,
}: {
  data: GradeData;
  subject: (id: string | null) => SubjectAppearance;
}) {
  const rows = useMemo(
    () =>
      examOverview(
        data.visible,
        data.subjects.map((s) => s.id),
      ),
    [data],
  );
  const stored = usePromotionSettings(data.isExamYear).combination;
  const setCombination = useGradesStore((s) => s.setCombination);
  const combination = stored ?? suggestedCombination(data.subjects);
  const parts = combinationGrade(combination.map((id) => seAverage(data.bySubject.get(id) ?? [])));
  const toggle = (id: string) =>
    setCombination(
      data.sourceId,
      combination.includes(id) ? combination.filter((other) => other !== id) : [...combination, id],
    );

  return (
    <div className="space-y-6">
      {rows.length === 0 ? (
        <p className="text-ink-2">
          Nog geen PTA-cijfers. Het schoolexamen begint bij de eerste toets uit je PTA.
        </p>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="sensitive w-full min-w-[34rem] text-left text-sm tabular-nums">
            <thead className="text-ink-3">
              <tr>
                <th className="py-2 pr-3 font-medium">Vak</th>
                <th className="py-2 pr-3 font-medium">PTA-cijfers</th>
                <th className="py-2 pr-3 text-right font-medium">Onafgerond</th>
                <th className="py-2 pr-3 text-right font-medium">SE</th>
                <th
                  className="py-2 text-right font-medium"
                  title="Je SE afgerond op een heel cijfer: zo telt het bij vakken zonder centraal examen"
                >
                  Heel cijfer
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.subjectId} className="border-t border-line align-middle">
                  <td className="py-2.5 pr-3 font-medium text-ink">
                    {subject(row.subjectId).name}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="flex flex-wrap gap-1.5">
                      {row.pta.map((grade) => (
                        <span
                          key={grade.id}
                          title={`${grade.description} · ${formatShortDate(parseISODate(grade.date))} · weging ${grade.weight}`}
                          className="flex items-center gap-0.5"
                        >
                          <GradePill grade={grade} />
                          <span className="text-[0.625rem] text-ink-3">×{grade.weight}</span>
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right text-ink-2">
                    {row.seRaw === null ? "—" : formatGrade(row.seRaw, 3)}
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    {row.se === null ? (
                      "—"
                    ) : (
                      <GradeValue value={row.se} className="font-semibold" />
                    )}
                  </td>
                  <td className="py-2.5 text-right text-ink-2">{row.final ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-3">
            Alleen de PTA-kolommen tellen voor je SE. Het SE-cijfer heeft één decimaal; een vak
            zonder centraal examen krijgt dat cijfer, afgerond op een heel cijfer, als eindcijfer.
          </p>
        </div>
      )}

      <GlassPanel as="section" aria-labelledby="combinatie-titel">
        <h3 id="combinatie-titel" className="font-display text-lg font-semibold text-ink">
          Combinatiecijfer
        </h3>
        <p className="mt-1 text-sm text-ink-2">
          Het gemiddelde van de afgeronde eindcijfers van een paar kleine vakken (bijvoorbeeld
          maatschappijleer en het profielwerkstuk). Geen onderdeel mag lager zijn dan een 4. Kies
          welke vakken er bij jou in zitten.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.subjects.map((s) => {
            const on = combination.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s.id)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
                  on
                    ? "border-transparent bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] font-medium text-on-accent"
                    : "border-line bg-glass text-ink-2 hover:bg-glass-strong",
                )}
              >
                {on && <Check size={14} aria-hidden />}
                {s.name}
              </button>
            );
          })}
        </div>
        {combination.length === 0 ? (
          <p className="mt-3 text-sm text-ink-3">
            Nog geen vakken gekozen. In deze demo heeft Daan geen maatschappijleer of
            profielwerkstuk; kies er zelf een paar om het te proberen.
          </p>
        ) : (
          <div className="sensitive mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
            <p>
              <span className="block text-xs text-ink-3">Combinatiecijfer</span>
              <span
                className={cn(
                  "font-display text-4xl font-semibold tabular-nums",
                  parts.valid ? "text-ink" : "text-bad",
                )}
              >
                {parts.grade ?? "—"}
              </span>
            </p>
            <p className="text-sm text-ink-2">
              {combination.map((id, i) => (
                <span key={id}>
                  {i > 0 && " · "}
                  {subject(id).name} {parts.finals[i] ?? "—"}
                </span>
              ))}
            </p>
            {!parts.valid && (
              <p className="w-full text-sm text-bad">
                Een onderdeel staat onder de 4. Dan tel je niet mee voor slagen.
              </p>
            )}
            {parts.grade === null && parts.valid && (
              <p className="w-full text-sm text-ink-3">
                Nog niet elk onderdeel heeft een SE-cijfer.
              </p>
            )}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
