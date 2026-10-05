"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { LOADING_QUIPS, type QuipTopic } from "@/lib/loading-quips";

/** Wisselende, grappige laadtekst. */
export function LoadingQuip({
  topic = "algemeen",
  className,
}: {
  topic?: QuipTopic;
  className?: string;
}) {
  const quips = LOADING_QUIPS[topic];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % quips.length), 1800);
    return () => clearInterval(id);
  }, [quips.length]);

  return (
    <p role="status" className={cn("relative h-6 overflow-hidden text-sm text-ink-3", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          className="absolute inset-x-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {quips[index]}
        </motion.span>
      </AnimatePresence>
    </p>
  );
}
