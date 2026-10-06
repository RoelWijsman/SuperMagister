"use client";

import { Share2, Star } from "lucide-react";
import { CardCanvas } from "@/components/cards/CardCanvas";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CARD_OUTLINE_SVG } from "@/lib/cards/draw";
import type { CardData } from "@/lib/cards/model";
import { SHOWCASE_SIZE } from "@/lib/collection/showcase";
import { useCopyParts } from "@/lib/use-copy";

interface ShowcasePanelProps {
  cards: readonly CardData[];
  onOpen: (index: number) => void;
  onShare: () => void;
}

/** De vitrine: je vijf favorieten, straks ook op je profiel. */
export function ShowcasePanel({ cards, onOpen, onShare }: ShowcasePanelProps) {
  const empty = useCopyParts(cards.length === 0 ? "leeg.vitrine" : null);

  return (
    <GlassPanel as="section" aria-labelledby="vitrine-titel" padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="vitrine-titel"
            className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
          >
            <Star size={18} strokeWidth={2.4} aria-hidden className="text-accent-ink" />
            Vitrine
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            {cards.length}/{SHOWCASE_SIZE} · je favoriete kaarten, voor op je profiel
          </p>
        </div>
        <Button
          variant="glass"
          size="sm"
          icon={Share2}
          onClick={onShare}
          disabled={cards.length === 0}
        >
          Deel vitrine
        </Button>
      </div>

      <ul className="mt-5 grid max-w-3xl grid-cols-5 gap-2 sm:gap-4">
        {Array.from({ length: SHOWCASE_SIZE }, (_, i) => {
          const card = cards[i];
          return (
            <li key={card?.id ?? `leeg-${i}`}>
              {card ? (
                <button
                  type="button"
                  onClick={() => onOpen(i)}
                  aria-label={`Bekijk ${card.subjectName} uit je vitrine`}
                  className="block w-full rounded-xl transition-transform hover:-translate-y-1 active:scale-95"
                >
                  <CardCanvas card={card} width={170} className="sensitive !h-auto !w-full" />
                </button>
              ) : (
                <svg
                  viewBox="0 0 500 720"
                  aria-hidden
                  className="block w-full"
                  style={{ color: "var(--sm-line-strong)" }}
                >
                  <path
                    d={CARD_OUTLINE_SVG}
                    fill="currentColor"
                    fillOpacity={0.06}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeDasharray="7 6"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ul>

      {empty && (
        <p className="mt-4 text-sm text-ink-2">
          <span className="font-semibold text-ink">{empty.title}</span> {empty.body}
        </p>
      )}
    </GlassPanel>
  );
}
