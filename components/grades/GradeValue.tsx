import { cn } from "@/lib/cn";
import { formatGrade, gradeTone, type GradeTone } from "@/lib/calc/average";

export const TONE_TEXT: Readonly<Record<GradeTone, string>> = {
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
};

/**
 * Een cijfer of gemiddelde: met komma, in de juiste kleur, en vervaagd in
 * de privacymodus.
 */
export function GradeValue({
  value,
  decimals = 1,
  colored = true,
  className,
}: {
  value: number;
  decimals?: number;
  colored?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("sensitive tabular-nums", colored && TONE_TEXT[gradeTone(value)], className)}
    >
      {formatGrade(value, decimals)}
    </span>
  );
}
