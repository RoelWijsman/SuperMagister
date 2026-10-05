import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "strong" | "subtle";
type Padding = "none" | "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  default: "glass",
  strong: "glass-strong",
  subtle: "glass-subtle",
};

const paddings: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-7",
};

export interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "aside" | "header" | "nav" | "li";
  variant?: Variant;
  padding?: Padding;
}

/** Glazen paneel: wazige achtergrond, lichte rand en een zachte binnengloed. */
export function GlassPanel({
  as: Tag = "div",
  variant = "default",
  padding = "md",
  className,
  ...props
}: GlassPanelProps) {
  return (
    <Tag
      className={cn("rounded-panel", variants[variant], paddings[padding], className)}
      {...props}
    />
  );
}
