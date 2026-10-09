"use client";

import { DndContext } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { Crest } from "@/components/squad/Crest";
import { LINK_COLORS, LINK_LABELS, Pitch } from "@/components/squad/Pitch";
import { ChemistryBar, SquadCard } from "@/components/squad/SquadCard";
import type { CardData } from "@/lib/cards/model";
import { buildBestSquad } from "@/lib/squad/build";
import { CREST_SHAPES, CREST_LABELS } from "@/lib/squad/club";
import { FORMATION_IDS, type FormationId } from "@/lib/squad/formations";
import { toSquadPlayer } from "@/lib/squad/players";
import type { PracticeEntry } from "@/lib/walkout/practice";

/** Jouw Elftal: de kaartjes, chemie, het wapen en een veld met de oefenkaarten. */
export function SquadSamples({ deck }: { deck: readonly PracticeEntry[] }) {
  const [formation, setFormation] = useState<FormationId>("4-3-3");
  const cards = useMemo(
    () => new Map<string, CardData>(deck.map((e) => [e.card.id, e.card])),
    [deck],
  );
  const result = useMemo(() => {
    const players = deck.flatMap((e) => {
      const player = toSquadPlayer(e.card);
      return player ? [player] : [];
    });
    return buildBestSquad(players, formation);
  }, [deck, formation]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        {deck.slice(0, 5).map((entry, i) => (
          <SquadCard
            key={entry.id}
            card={entry.card}
            position={["SP", "CM", "CV", "K", "LV"][i]}
            chemistry={[10, 7, 3, 0, 9][i] ?? 5}
            captain={i === 0}
            className="w-20"
          />
        ))}
        <div className="w-40 space-y-2 text-xs text-ink-3">
          <ChemistryBar value={9} />
          <ChemistryBar value={5} />
          <ChemistryBar value={2} />
        </div>
      </div>

      <ul className="flex flex-wrap gap-4 text-sm text-ink-2">
        {(["groen", "oranje", "rood"] as const).map((strength) => (
          <li key={strength} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-1 w-8 rounded-full"
              style={{ background: LINK_COLORS[strength] }}
            />
            {strength} ({LINK_LABELS[strength]})
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-4">
        {CREST_SHAPES.map((shape) => (
          <figure key={shape} className="flex flex-col items-center gap-1 text-xs text-ink-3">
            <Crest name="Atletico Aula" shape={shape} size={44} />
            {CREST_LABELS[shape]}
          </figure>
        ))}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Formatie">
          {FORMATION_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === formation}
              onClick={() => setFormation(id)}
              className="rounded-full glass px-3 py-1 font-card tracking-wider aria-pressed:shadow-[inset_0_0_0_1.5px_var(--sm-accent)]"
            >
              {id}
            </button>
          ))}
        </div>
        <DndContext id="stijlgids-elftal">
          <div className="max-w-sm">
            <Pitch
              evaluation={result.evaluation}
              cardById={(id) => (id ? (cards.get(id) ?? null) : null)}
              selected={null}
              draggingKey={null}
              disabled
              onActivate={() => {}}
            />
          </div>
        </DndContext>
        <p className="mt-2 text-sm text-ink-3">
          Met de oefenkaarten: rating {result.evaluation.rating}, chemie{" "}
          {result.evaluation.chemistry}.
        </p>
      </div>
    </div>
  );
}
