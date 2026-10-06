"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { CopyKey } from "@/content/copy";
import { cn } from "@/lib/cn";
import { pickCopy } from "@/lib/copy";
import { useCopy } from "@/lib/use-copy";

export type LoadingTopic = "algemeen" | "cijfers" | "rooster" | "huiswerk" | "pack" | "collectie";

/** Wisselende laadtekst uit content/copy.ts (laden.*). */
export function LoadingQuip({
  topic = "algemeen",
  className,
}: {
  topic?: LoadingTopic;
  className?: string;
}) {
  const key: CopyKey = `laden.${topic}`;
  const first = useCopy(key);
  const [next, setNext] = useState<{ key: CopyKey; text: string; round: number } | null>(null);

  useEffect(() => {
    const id = setInterval(
      () => setNext((prev) => ({ key, text: pickCopy(key), round: (prev?.round ?? 0) + 1 })),
      2200,
    );
    return () => clearInterval(id);
  }, [key]);

  const current = next?.key === key ? next : null;
  const text = current?.text ?? first;

  return (
    <p role="status" className={cn("relative h-6 overflow-hidden text-sm text-ink-3", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current?.round ?? 0}
          className="absolute inset-x-0 truncate"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </p>
  );
}
