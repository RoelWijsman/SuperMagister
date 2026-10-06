"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useState } from "react";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import { Button } from "@/components/ui/Button";
import { playLiveCue } from "@/lib/audio/engine";
import type { CardData } from "@/lib/cards/model";
import { haptic } from "@/lib/haptics";
import { clampGuess, toTenths } from "@/lib/guess/scale";
import { useCopy } from "@/lib/use-copy";
import { GuessSlider } from "./GuessSlider";

interface GuessScreenProps {
  card: CardData;
  onLock: (guess: number) => void;
  onSkip: () => void;
}

/**
 * Feature A: vóór de walkout gok je je cijfer. Het vak en de toets zie je al,
 * de kaart nog niet. De slider begint bij je gemiddelde voor dit vak.
 */
export function GuessScreen({ card, onLock, onSkip }: GuessScreenProps) {
  const [value, setValue] = useState(() => clampGuess(toTenths(card.avgBefore ?? 6)));
  const question = useCopy("gok.vraag");

  const lock = () => {
    playLiveCue({ at: 0, cue: "vastzetten" }, { tier: "zilver" });
    haptic("success");
    onLock(value / 10);
  };

  return (
    <motion.section
      aria-label="Gok je cijfer"
      className="pt-safe pb-safe absolute inset-0 touch-pan-y overflow-y-auto overscroll-contain"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-white/8 shadow-[inset_0_0_0_2px_rgb(255_255_255/0.75),0_0_30px_-6px_rgb(255_255_255/0.5)]">
          <SubjectIcon name={card.icon} size={30} strokeWidth={2} className="text-white" />
        </span>
        <p className="mt-3 font-card text-[2rem] leading-none tracking-[0.12em] text-white">
          {card.subjectName.toUpperCase()}
        </p>
        <p className="mt-1.5 text-sm text-white/60">{card.grade.description}</p>

        <h2 className="mt-8 font-display text-[1.6rem] leading-tight font-semibold tracking-tight text-white">
          Wat denk je dat je hebt?
        </h2>
        <p className="mt-1.5 min-h-6 text-white/60">{question}</p>

        <div className="mt-4 w-full">
          <GuessSlider value={value} onChange={setValue} onSubmit={lock} autoFocus />
        </div>

        <div className="mt-5 flex flex-col items-center gap-2">
          <Button variant="primary" size="lg" icon={Lock} onClick={lock} className="min-w-56">
            Vastzetten
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-white/60 hover:text-white"
          >
            Overslaan, ik ben er klaar voor (ben ik niet)
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
