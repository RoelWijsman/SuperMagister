"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "glass" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none transition-[background-color,box-shadow,color,opacity] duration-200 disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary:
    "text-on-accent bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] shadow-[0_10px_28px_-10px_color-mix(in_oklab,var(--sm-accent)_75%,transparent),inset_0_1px_0_rgb(255_255_255/0.35)] hover:shadow-[0_14px_34px_-8px_color-mix(in_oklab,var(--sm-accent)_80%,transparent),inset_0_1px_0_rgb(255_255_255/0.4)] font-semibold",
  glass: "glass text-ink hover:bg-glass-hover",
  ghost: "text-ink-2 hover:text-ink hover:bg-glass",
  danger:
    "text-white bg-bad shadow-[0_10px_28px_-12px_color-mix(in_oklab,var(--sm-bad)_80%,transparent)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-6 text-base",
  icon: "size-11",
  "icon-sm": "size-9",
};

const iconSizes: Record<Size, number> = { sm: 16, md: 18, lg: 20, icon: 20, "icon-sm": 18 };

const press = {
  whileTap: { scale: 0.94 },
  whileHover: { y: -1 },
  transition: { type: "spring", stiffness: 520, damping: 28 },
} as const;

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children?: ReactNode;
}

function Content({ icon: Icon, iconRight: IconRight, size = "md", children }: CommonProps) {
  const px = iconSizes[size];
  return (
    <>
      {Icon && <Icon size={px} strokeWidth={2.2} aria-hidden className="shrink-0" />}
      {children}
      {IconRight && <IconRight size={px} strokeWidth={2.2} aria-hidden className="shrink-0" />}
    </>
  );
}

export type ButtonProps = CommonProps & Omit<HTMLMotionProps<"button">, "children">;

/** Knop die licht inveert bij indrukken. */
export function Button({
  variant = "glass",
  size = "md",
  icon,
  iconRight,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...press}
      {...props}
    >
      <Content icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Content>
    </motion.button>
  );
}

const MotionLink = motion.create(Link);

export type LinkButtonProps = CommonProps &
  Omit<ComponentProps<typeof MotionLink>, "children" | "ref">;

/** Dezelfde knop, maar als link naar een andere pagina. */
export function LinkButton({
  variant = "glass",
  size = "md",
  icon,
  iconRight,
  children,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <MotionLink
      className={cn(base, variants[variant], sizes[size], className)}
      {...press}
      {...props}
    >
      <Content icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Content>
    </MotionLink>
  );
}
