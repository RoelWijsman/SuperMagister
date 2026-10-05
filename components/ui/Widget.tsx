import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { GlassPanel } from "./GlassPanel";

export type WidgetSize = "sm" | "md" | "lg" | "full";

/** Kolombreedte in het 12-koloms raster van Vandaag. */
const spans: Record<WidgetSize, string> = {
  sm: "md:col-span-6 xl:col-span-4",
  md: "md:col-span-6",
  lg: "md:col-span-12 xl:col-span-8",
  full: "md:col-span-12",
};

interface WidgetProps {
  title: string;
  icon?: LucideIcon;
  /** Kleur van het icoonbolletje, standaard het accent. */
  color?: string;
  action?: ReactNode;
  size?: WidgetSize;
  className?: string;
  children: ReactNode;
}

/**
 * Een blok op Vandaag. In fase 3 krijgen widgets een bewerkmodus
 * (verslepen, aan/uit, groter/kleiner).
 */
export function Widget({
  title,
  icon: Icon,
  color,
  action,
  size = "sm",
  className,
  children,
}: WidgetProps) {
  const titleId = useId();
  return (
    <GlassPanel
      as="section"
      aria-labelledby={titleId}
      className={cn("col-span-12 flex flex-col", spans[size], className)}
      style={color ? ({ "--widget": color } as React.CSSProperties) : undefined}
    >
      <header className="mb-3.5 flex items-center gap-2.5">
        {Icon && (
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--widget,var(--sm-accent))_18%,transparent)] text-[color-mix(in_oklab,var(--widget,var(--sm-accent))_85%,white)] light:text-[color-mix(in_oklab,var(--widget,var(--sm-accent))_70%,black)]"
          >
            <Icon size={17} strokeWidth={2.3} />
          </span>
        )}
        <h2 id={titleId} className="text-[0.9375rem] font-semibold text-ink">
          {title}
        </h2>
        {action && <div className="ml-auto">{action}</div>}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </GlassPanel>
  );
}
