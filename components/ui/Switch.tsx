"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/cn";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
}

/** Aan/uit-schakelaar met een verende knop. */
export function Switch({ checked, onCheckedChange, label, description, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4 py-2", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-8 w-13 shrink-0 rounded-full border transition-colors duration-300",
          checked
            ? "border-transparent bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))]"
            : "border-line-strong bg-glass-strong",
        )}
      >
        <motion.span
          className="absolute top-1 left-1 block size-5.5 rounded-full bg-white shadow-[0_2px_8px_rgb(0_0_0/0.3)]"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
        />
      </button>
    </div>
  );
}
