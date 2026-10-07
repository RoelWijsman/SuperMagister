"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { CopyKey } from "@/content/copy";
import { formatGrade } from "@/lib/calc/average";
import { COMBINATION_ID, type PromotionResult, type PromotionStatus } from "@/lib/calc/promotion";
import { cn } from "@/lib/cn";
import { useCopy } from "@/lib/use-copy";

const LABELS: Record<PromotionStatus, { normal: string; exam: string }> = {
  over: { normal: "Over ✅", exam: "Geslaagd ✅" },
  bespreek: { normal: "Bespreekgeval ⚠️", exam: "Bespreekgeval ⚠️" },
  gevaar: { normal: "Gevarenzone ❌", exam: "Gevarenzone ❌" },
  onbekend: { normal: "Nog geen oordeel", exam: "Nog geen oordeel" },
};

const TONE: Record<PromotionStatus, string> = {
  over: "text-good",
  bespreek: "text-warn",
  gevaar: "text-bad",
  onbekend: "text-ink-3",
};

/** Waar de wijzer staat (0 = links, 1 = rechts). */
function needle(result: PromotionResult): number {
  if (result.status === "onbekend") return 0;
  if (result.status === "over") return Math.min(0.3, 0.05 + result.points * 0.08);
  if (result.status === "bespreek") return 0.5;
  return Math.min(0.95, 0.72 + (result.points - 3) * 0.04);
}

function lineKey(status: PromotionStatus, exam: boolean): CopyKey {
  if (exam && status === "over") return "examen.over";
  if (exam && status === "gevaar") return "examen.gevaar";
  return `overgang.${status}` as CopyKey;
}

/**
 * Fase 4: de overgangsmeter. Status ("Over ✅", "Bespreekgeval ⚠️",
 * "Gevarenzone ❌"), een wijzer die live meebeweegt, en in de uitgebreide
 * versie de regels en de vakken die het verschil maken.
 */
export function PromotionMeter({
  result,
  exam,
  subjectName,
  detailed = false,
}: {
  result: PromotionResult;
  exam: boolean;
  subjectName: (id: string) => string;
  detailed?: boolean;
}) {
  const reduced = useReducedMotion();
  const line = useCopy(lineKey(result.status, exam));
  const name = (id: string) => (id === COMBINATION_ID ? "Combinatiecijfer" : subjectName(id));
  const label = LABELS[result.status][exam ? "exam" : "normal"];

  return (
    <div>
      <p
        className={cn("font-display text-2xl font-semibold", TONE[result.status])}
        aria-live="polite"
      >
        {label}
      </p>
      <p className="mt-1 text-sm text-ink-2">{line}</p>

      <div className="relative mt-4" aria-hidden>
        <div className="flex h-3 overflow-hidden rounded-full">
          <span className="flex-1 bg-good" />
          <span className="w-0.5 bg-[var(--sm-bg)]" />
          <span className="flex-1 bg-warn" />
          <span className="w-0.5 bg-[var(--sm-bg)]" />
          <span className="flex-1 bg-bad" />
        </div>
        {result.status !== "onbekend" && (
          <motion.span
            className="absolute -top-1.5 h-6 w-1.5 -translate-x-1/2 rounded-full bg-ink shadow-[0_0_0_2px_var(--sm-bg)]"
            initial={false}
            animate={{ left: `${needle(result) * 100}%` }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}
          />
        )}
        <div className="mt-1.5 flex justify-between text-[0.6875rem] text-ink-3">
          <span>{exam ? "Geslaagd" : "Over"}</span>
          <span>Bespreken</span>
          <span>Gevarenzone</span>
        </div>
      </div>

      {result.status !== "onbekend" && (
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-glass px-2 py-2">
            <dt className="text-xs text-ink-3">Tekortpunten</dt>
            <dd className="font-display text-xl font-semibold text-ink tabular-nums">
              {result.points}
            </dd>
          </div>
          <div className="rounded-xl bg-glass px-2 py-2">
            <dt className="text-xs text-ink-3">Onvoldoendes</dt>
            <dd className="font-display text-xl font-semibold text-ink tabular-nums">
              {result.shortSubjects}
            </dd>
          </div>
          <div className="rounded-xl bg-glass px-2 py-2">
            <dt className="text-xs text-ink-3">{exam ? "Gem. SE" : "Gem. rapport"}</dt>
            <dd className="sensitive font-display text-xl font-semibold text-ink tabular-nums">
              {result.average === null ? "—" : formatGrade(result.average)}
            </dd>
          </div>
        </dl>
      )}

      {(result.status === "bespreek" || result.status === "gevaar") &&
        !result.decisive.some((item) => item.kind === "tekort") && (
          <p className="mt-4 text-sm text-ink-2">
            Eén vak omhoog is hier niet genoeg: het moet bij meer vakken tegelijk beter. De
            simulator laat zien welke combinatie werkt.
          </p>
        )}

      {result.decisive.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Wat het verschil maakt</h3>
          <ul className="space-y-1.5">
            {result.decisive.map((item) => (
              <li
                key={`${item.kind}-${item.subjectId}`}
                className="flex items-start gap-2 text-sm text-ink-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    item.kind === "tekort" ? "bg-good" : "bg-warn",
                  )}
                />
                <span>
                  <span className="font-semibold text-ink">{name(item.subjectId)}</span>{" "}
                  {item.kind === "tekort"
                    ? `staat op een ${item.report}. Met een 6 wordt het: ${LABELS[item.wouldBe][exam ? "exam" : "normal"]}`
                    : `staat net op een ${item.report}. Zakt dat naar een ${item.report - 1}, dan wordt het: ${LABELS[item.wouldBe][exam ? "exam" : "normal"]}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detailed && result.status !== "onbekend" && (
        <>
          <ul className="mt-4 divide-y divide-line">
            {result.checks.map((check) => (
              <li key={check.id} className="flex items-center gap-2.5 py-2 text-sm">
                {check.ok ? (
                  <Check size={16} aria-hidden className="shrink-0 text-good" />
                ) : (
                  <X size={16} aria-hidden className="shrink-0 text-bad" />
                )}
                <span className="flex-1 text-ink">{check.label}</span>
                <span className="text-ink-2 tabular-nums">{check.detail}</span>
                <span className="sr-only">{check.ok ? "in orde" : "niet in orde"}</span>
              </li>
            ))}
          </ul>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-ink-2 hover:text-ink">
              Rapportcijfers per vak
            </summary>
            <table className="mt-2 w-full text-left tabular-nums">
              <thead className="text-ink-3">
                <tr>
                  <th className="py-1 font-medium">Vak</th>
                  <th className="py-1 text-right font-medium">Gemiddeld</th>
                  <th className="py-1 text-right font-medium">Rapport</th>
                  <th className="py-1 text-right font-medium">Tekort</th>
                </tr>
              </thead>
              <tbody className="sensitive text-ink-2">
                {result.grades.map((grade) => (
                  <tr key={grade.subjectId} className="border-t border-line">
                    <td className="py-1">
                      {name(grade.subjectId)}
                      {grade.isCore && <span className="text-ink-3"> · kern</span>}
                    </td>
                    <td className="py-1 text-right">{formatGrade(grade.average)}</td>
                    <td className="py-1 text-right">{grade.report}</td>
                    <td className="py-1 text-right">{grade.points || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
}
