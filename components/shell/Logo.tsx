import { useId } from "react";
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
      <rect width="40" height="40" rx="12" fill={`url(#${id}-bg)`} />
      <rect width="40" height="40" rx="12" fill={`url(#${id}-shine)`} />
      <path
        d="M20 7.5c1.5 7.6 4.9 11 12.5 12.5-7.6 1.5-11 4.9-12.5 12.5C18.5 24.9 15.1 21.5 7.5 20c7.6-1.5 11-4.9 12.5-12.5z"
        fill="var(--sm-on-accent)"
      />
      <circle cx="30.5" cy="9.5" r="2" fill="var(--sm-on-accent)" opacity="0.85" />
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
