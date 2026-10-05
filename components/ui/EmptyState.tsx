import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Illustration, type IllustrationName } from "./illustrations";

interface EmptyStateProps {
  illustration: IllustrationName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Lege staat met een illustratie en een knipoog. */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-10 text-center", className)}>
      <Illustration
        name={illustration}
        className="mb-5 h-auto w-44 animate-[float_6s_ease-in-out_infinite] text-ink-3 motion-reduce:animate-none"
      />
      <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-ink-2">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
