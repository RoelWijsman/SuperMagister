import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Een toets van het toetsenbord, voor sneltoetsen. */
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-line-strong bg-glass-strong px-1.5 font-sans text-[0.6875rem] font-semibold text-ink-2 shadow-[inset_0_-1px_0_var(--sm-line-strong)]",
        className,
      )}
      {...props}
    />
  );
}
