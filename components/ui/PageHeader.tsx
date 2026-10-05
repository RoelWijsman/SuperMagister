import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  /** Klein regeltje boven de titel, bijv. de datum of het weeknummer. */
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 md:mb-8",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-sm font-medium text-ink-3 first-letter:uppercase">{eyebrow}</p>
        )}
        <h1 className="font-display text-[clamp(1.75rem,1.25rem+2.1vw,2.75rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-2.5 text-[1.0625rem] text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
