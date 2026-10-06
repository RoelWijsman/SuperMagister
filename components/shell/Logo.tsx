import { useId } from "react";
import { LOGO_DOT, LOGO_RADIUS, LOGO_SIZE, LOGO_SPARK_PATH } from "@/lib/brand";
import { cn } from "@/lib/cn";

/** Het beeldmerk: een fonkelende ster op een aurora-tegel. */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-9 shrink-0", className)}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--sm-accent)" />
          <stop offset="1" stopColor="var(--sm-accent-2)" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.3" cy="0.2" r="0.8">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={LOGO_SIZE} height={LOGO_SIZE} rx={LOGO_RADIUS} fill={`url(#${id}-bg)`} />
      <rect width={LOGO_SIZE} height={LOGO_SIZE} rx={LOGO_RADIUS} fill={`url(#${id}-shine)`} />
      <path d={LOGO_SPARK_PATH} fill="var(--sm-on-accent)" />
      <circle {...LOGO_DOT} fill="var(--sm-on-accent)" opacity="0.85" />
    </svg>
  );
}

/** Beeldmerk plus woordmerk "SuperMagister". */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-[1.0625rem] leading-none font-bold tracking-[-0.04em]">
          <span className="text-gradient">Super</span>
          <span className="text-ink">Magister</span>
        </span>
      )}
    </span>
  );
}
