"use client";

import type { CopyLine } from "@/lib/greeting";
import { useCopy } from "@/lib/use-copy";

/** Eén regel uit content/copy.ts, met een vaste variant zolang hij in beeld is. */
export function CopyLineText({ line, className }: { line: CopyLine; className?: string }) {
  const text = useCopy(line.key, line.vars);
  if (!text) return null;
  return <p className={className}>{text}</p>;
}
