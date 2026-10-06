"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calculator, Check, Clapperboard, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { VARIANT_LABELS } from "@/lib/calc/cards";
import { cardLook, cardTierLabel, type CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import { guessReaction, reactionLines } from "@/lib/walkout/reaction";
import { GuessStrip } from "@/components/guess/GuessStrip";
import type { WalkoutEntry } from "@/stores/walkout";
import { CopyLineText } from "./CopyLineText";

interface WalkoutResultProps {
  entry: WalkoutEntry;
  /** Feature A: je gok, of null als je niet gokte. */
  guess: number | null;
  /** Verdiende XP met deze gok (niet bij oefenkaarten). */
  guessXp: number | null;
  /** Onzichtbaar gemount om te meten; zichtbaar zodra de kaart stilligt. */
  visible: boolean;
  /** Knop rechts: "Volgende kaart", "Overzicht" of "Klaar". */
  nextLabel: string;
  onNext: () => void;
  onReplay: () => void;
  onWhatToGet: (card: CardData) => void;
  /** Feature B: deze walkout als video. */
  onMakeVideo: () => void;
  /** Automatisch door na een paar seconden. */
  autoAdvance: boolean;
  /** Even niet automatisch door (bijv. terwijl je een video maakt). */
  hold?: boolean;
}

const AUTO_MS = 4200;

/** Het eindscherm onder een kaart: de droge reactie, en bij een onvoldoende steun en een plan. */
export function WalkoutResult({
  entry,
  guess,
  guessXp,
  visible,
  nextLabel,
  onNext,
  onReplay,
  onWhatToGet,
  onMakeVideo,
  autoAdvance,
  hold = false,
}: WalkoutResultProps) {
  const { card } = entry;
  const lines = useMemo(
    () => reactionLines(card, entry.grades, { subjectName: card.subjectName }),
    [card, entry.grades],
  );
  const guessed =
    guess !== null && card.grade.kind === "numeric" ? guessReaction(card, guess) : null;
  // Met een gok is de reactie op je gok de kop; anders de grap van de tier.
  const [tierLine, ...rest] = lines;
  const first = guessed?.line ?? tierLine;
  const showWhatToGet = card.isFail || Boolean(guessed?.showWhatToGet);
  const [paused, setPaused] = useState(false);

  const waiting = autoAdvance && !paused && !hold;
  useEffect(() => {
    if (!waiting) return;
    const id = setTimeout(onNext, AUTO_MS);
    return () => clearTimeout(id);
  }, [waiting, onNext]);

  return (
    <motion.section
      aria-label="Uitslag"
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onPointerEnter={() => setPaused(true)}
      className="pointer-events-auto mx-auto max-h-[calc(100dvh-6rem)] w-full max-w-lg touch-pan-y overflow-y-auto rounded-panel glass-strong p-5 sm:p-6 naast:mx-0"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 font-card text-lg tracking-wider">
        <span className="rounded-full bg-white/12 px-3 py-0.5 text-white">
          {cardTierLabel(card)}
        </span>
        {card.variants
          // In Form staat al in het tierlabel, behalve bij TOTY en ICON.
          .filter((v) => v !== "inform" || cardLook(card) !== "inform")
          .map((variant) => (
            <span key={variant} className="rounded-full bg-white/8 px-3 py-0.5 text-white/80">
              {VARIANT_LABELS[variant]}
            </span>
          ))}
        {card.isPractice && (
          <span className="ml-auto font-sans text-xs text-white/50">oefenkaart</span>
        )}
      </div>

      {guessed && guess !== null && card.grade.kind === "numeric" && (
        <GuessStrip guess={guess} actual={card.grade.value} xp={guessXp} className="mb-3" />
      )}

      {first && (
        <CopyLineText
          line={first}
          className="font-display text-lg leading-snug font-semibold text-white sm:text-xl"
        />
      )}

      {card.isFail ? (
        <div className="mt-3 space-y-3">
          {rest.map((line) => (
            <CopyLineText key={line.key} line={line} className="text-white/80" />
          ))}
          <div className="rounded-2xl bg-white/6 p-3">
            <p className="font-card text-lg tracking-wider text-white">Comeback-kaart loading…</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 animate-[comeback_1.8s_ease-in-out_infinite] rounded-full bg-[linear-gradient(90deg,var(--sm-accent),var(--sm-accent-2))] motion-reduce:animate-none" />
            </div>
            <CopyLineText
              line={{ key: "walkout.onvoldoende.comeback", vars: {} }}
              className="mt-2 text-sm text-white/70"
            />
          </div>
        </div>
      ) : (
        <>
          {rest.map((line) => (
            <CopyLineText key={line.key} line={line} className="mt-2 text-white/75" />
          ))}
          {guessed?.support && (
            <CopyLineText line={guessed.support} className="mt-2 text-white/80" />
          )}
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {showWhatToGet && (
          <Button variant="primary" icon={Calculator} onClick={() => onWhatToGet(card)}>
            Wat moet ik halen?
          </Button>
        )}
        <Button
          variant="ghost"
          icon={RotateCcw}
          onClick={onReplay}
          className="text-white/70 hover:text-white"
        >
          Nog een keer
        </Button>
        <Button
          variant="ghost"
          icon={Clapperboard}
          onClick={() => {
            setPaused(true);
            onMakeVideo();
          }}
          className="text-white/70 hover:text-white"
        >
          Maak video
        </Button>
        <Button
          variant={showWhatToGet ? "glass" : "primary"}
          iconRight={nextLabel === "Klaar" ? Check : ArrowRight}
          onClick={onNext}
          className={cn("relative ml-auto overflow-hidden")}
        >
          {waiting && (
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 animate-[autoadvance_4.2s_linear_forwards] bg-white/25"
            />
          )}
          <span className="relative">{nextLabel}</span>
        </Button>
      </div>
    </motion.section>
  );
}
