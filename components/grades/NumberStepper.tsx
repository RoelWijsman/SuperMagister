"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** Een getal met − en +, voor doelen, wegingen en normen. */
export function NumberStepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v) => String(v),
  size = "md",
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  size?: "md" | "lg";
  className?: string;
}) {
  const set = (next: number) =>
    onChange(Math.min(max, Math.max(min, Math.round(next / step) * step)));
  return (
    <div className={cn("flex items-center gap-2", className)} role="group" aria-label={label}>
      <Button
        variant="glass"
        size="icon-sm"
        icon={Minus}
        aria-label={`${label}: lager`}
        disabled={value <= min}
        onClick={() => set(value - step)}
      />
      <output
        aria-live="polite"
        className={cn(
          "min-w-14 text-center font-semibold text-ink tabular-nums",
          size === "lg" ? "font-display text-2xl" : "text-base",
        )}
      >
        {format(value)}
      </output>
      <Button
        variant="glass"
        size="icon-sm"
        icon={Plus}
        aria-label={`${label}: hoger`}
        disabled={value >= max}
        onClick={() => set(value + step)}
      />
    </div>
  );
}
