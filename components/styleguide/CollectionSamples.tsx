"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";
import { FoilSwatch } from "@/components/collection/FoilSwatch";
import { HoloCard } from "@/components/collection/HoloCard";
import { Button } from "@/components/ui/Button";
import { FOIL_ORDER, FOILS, type FoilId } from "@/lib/collection/goals";
import type { PracticeEntry } from "@/lib/walkout/practice";

/** Stijlgids: de kaartviewer met alle folies (in de app speel je ze vrij met verzameldoelen). */
export function CollectionSamples({ deck }: { deck: readonly PracticeEntry[] }) {
  const [foil, setFoil] = useState<FoilId>("regenboog");
  const [flipped, setFlipped] = useState(false);
  const card = deck.find((entry) => entry.id === "toty")?.card ?? deck[0]?.card;
  if (!card) return null;

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label="Draai de kaart om"
        className="rounded-3xl"
      >
        <HoloCard card={card} width={220} foil={foil} flipped={flipped} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-2">
          Beweeg je muis over de kaart; op een telefoon kantel je hem. Tik om om te draaien.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FOIL_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={foil === id}
              onClick={() => setFoil(id)}
              className={
                foil === id
                  ? "flex items-center gap-2 rounded-2xl bg-[color-mix(in_oklab,var(--sm-accent)_22%,transparent)] py-1.5 pr-3.5 pl-1.5 text-sm font-medium text-ink shadow-[inset_0_0_0_1.5px_var(--sm-accent)]"
                  : "flex items-center gap-2 rounded-2xl glass py-1.5 pr-3.5 pl-1.5 text-sm font-medium text-ink-2"
              }
            >
              <FoilSwatch foil={id} className="w-6" />
              {FOILS[id].name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <FoilSwatch foil={foil} />
          <FoilSwatch foil={foil} locked />
          <span className="text-sm text-ink-3">Vrijgespeeld en op slot</span>
        </div>
        <Button
          variant="glass"
          size="sm"
          icon={RotateCw}
          className="mt-4"
          onClick={() => setFlipped((f) => !f)}
        >
          Omdraaien
        </Button>
      </div>
    </div>
  );
}
