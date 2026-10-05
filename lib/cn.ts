import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Classnames samenvoegen; latere Tailwind-classes winnen van eerdere. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
