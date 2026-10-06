"use client";

import { motion } from "framer-motion";
import { Check, GalleryVerticalEnd } from "lucide-react";
import { CardCanvas } from "@/components/cards/CardCanvas";
import { Button } from "@/components/ui/Button";
import { useMediaQuery } from "@/lib/hooks";
import { useCopyParts } from "@/lib/use-copy";
import type { WalkoutEntry } from "@/stores/walkout";

interface WalkoutSummaryProps {
  entries: readonly WalkoutEntry[];
  /** Feature A: XP verdiend met gokken in dit pack. */
  guessXp?: number;
  onCollection: (() => void) | null;
  onDone: () => void;
}

/** Na het pack: alle nieuwe kaarten op een rij. */
export function WalkoutSummary({
  entries,
  guessXp = 0,
  onCollection,
  onDone,
}: WalkoutSummaryProps) {
  const wide = useMediaQuery("(min-width: 768px)");
  const count = entries.length;
  const copy = useCopyParts("walkout.pack.klaar", {
    aantal: count,
    kaarten: count === 1 ? "kaart" : "kaarten",
  });
  const width = wide ? (count > 4 ? 150 : 180) : count > 2 ? 104 : 140;

  return (
    <div className="pointer-events-auto flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-10 text-center">
      {copy && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {copy.title}
          </h2>
          {copy.body && <p className="mt-2 text-white/75">{copy.body}</p>}
          {guessXp > 0 && (
            <p className="mt-3 inline-block rounded-full bg-white/10 px-3 py-0.5 font-card text-lg tracking-wider text-white">
              +{guessXp} XP met gokken
            </p>
          )}
        </motion.div>
      )}
      <ul className="mt-8 flex max-w-4xl flex-wrap justify-center gap-3 sm:gap-5">
        {entries.map(({ card }, i) => (
          <motion.li
            key={card.id}
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.09, type: "spring", stiffness: 260, damping: 22 }}
          >
            <CardCanvas
              card={card}
              width={width}
              className="drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
            />
          </motion.li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {onCollection && (
          <Button variant="primary" icon={GalleryVerticalEnd} onClick={onCollection}>
            Bekijk in collectie
          </Button>
        )}
        <Button variant="glass" icon={Check} onClick={onDone}>
          Klaar
        </Button>
      </div>
    </div>
  );
}
