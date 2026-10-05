"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps<T extends string> {
  /** Uniek per Tabs op de pagina; gebruikt voor het glijdende bolletje. */
  id: string;
  value: T;
  onValueChange: (value: T) => void;
  items: readonly TabItem<T>[];
  "aria-label": string;
  size?: "sm" | "md";
  className?: string;
}

/** Gesegmenteerde keuze met een glijdende, verende markering. Pijltjestoetsen werken. */
export function Tabs<T extends string>({
  id,
  value,
  onValueChange,
  items,
  size = "md",
  className,
  ...aria
}: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + items.length) % items.length;
    const item = items[next];
    if (!item) return;
    onValueChange(item.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={aria["aria-label"]}
      className={cn("inline-flex rounded-full glass p-1", className)}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full font-medium transition-colors duration-200",
              size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-[0.9375rem]",
              selected ? "text-on-accent" : "text-ink-2 hover:text-ink",
            )}
          >
            {selected && (
              <motion.span
                layoutId={`tabs-${id}`}
                className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] shadow-[0_6px_18px_-8px_var(--sm-accent)]"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            {Icon && <Icon size={16} strokeWidth={2.2} aria-hidden className="relative" />}
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
