import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "good" | "warn" | "bad";

const tones: Record<Tone, string> = {
  neutral: "bg-glass-strong text-ink-2 border-line",
  accent:
    "bg-[color-mix(in_oklab,var(--sm-accent)_16%,transparent)] text-accent-ink border-[color-mix(in_oklab,var(--sm-accent)_35%,transparent)]",
  good: "bg-[color-mix(in_oklab,var(--sm-good)_15%,transparent)] text-good border-[color-mix(in_oklab,var(--sm-good)_32%,transparent)]",
  warn: "bg-[color-mix(in_oklab,var(--sm-warn)_15%,transparent)] text-warn border-[color-mix(in_oklab,var(--sm-warn)_32%,transparent)]",
  bad: "bg-[color-mix(in_oklab,var(--sm-bad)_15%,transparent)] text-bad border-[color-mix(in_oklab,var(--sm-bad)_32%,transparent)]",
};

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Klein label, bijv. "Toets", "Lokaal gewijzigd" of "binnenkort". */
export function Chip({ tone = "neutral", className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2.5 font-sans text-xs font-medium tracking-normal whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
