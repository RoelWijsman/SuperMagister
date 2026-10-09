"use client";

import { DndContext } from "@dnd-kit/core";
import { Trophy, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Crest } from "@/components/squad/Crest";
import { LINK_COLORS, LINK_LABELS, LINK_STYLE, Pitch } from "@/components/squad/Pitch";
import { ChemistryBar, ChemistryDot, SquadCard } from "@/components/squad/SquadCard";
import { SquadStats, SquadToolbar } from "@/components/squad/SquadHeader";
import { Menu } from "@/components/ui/Menu";
import type { CardData } from "@/lib/cards/model";
import { buildBestSquad } from "@/lib/squad/build";
import { CREST_SHAPES, CREST_LABELS } from "@/lib/squad/club";
import { FORMATION_IDS, type FormationId } from "@/lib/squad/formations";
import { fitCardWidth } from "@/lib/squad/layout";
import { toSquadPlayer } from "@/lib/squad/players";
import type { PracticeEntry } from "@/lib/walkout/practice";

const PITCH = { width: 360, height: 487 };
const noop = () => {};

/** Jouw Elftal: de kaartjes, chemie, het wapen, de balk, het menu en een veld met de oefenkaarten. */
export function SquadSamples({ deck }: { deck: readonly PracticeEntry[] }) {
  const [formation, setFormation] = useState<FormationId>("4-3-3");
  const cards = useMemo(
    () => new Map<string, CardData>(deck.map((e) => [e.card.id, e.card])),
    [deck],
  );
  const players = useMemo(
    () =>
      new Map(
        deck.flatMap((e) => {
          const player = toSquadPlayer(e.card);
          return player ? [[player.id, player] as const] : [];
        }),
      ),
    [deck],
  );
  const result = useMemo(
    () => buildBestSquad([...players.values()], formation),
    [players, formation],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        {deck.slice(0, 5).map((entry, i) => (
          <SquadCard
            key={entry.id}
            card={entry.card}
            player={players.get(entry.card.id)}
            position={["SP", "CM", "CV", "K", "LV"][i]}
            chemistry={[10, 7, 3, 0, 9][i] ?? 5}
            captain={i === 0}
            animate={false}
            className={i === 0 ? "w-[110px]" : i === 1 ? "w-[62px]" : "w-20"}
          />
        ))}
        <div className="w-40 space-y-2 text-xs text-ink-3">
          <ChemistryBar value={9} />
          <ChemistryBar value={5} />
          <ChemistryBar value={2} />
          <div className="flex gap-3 pl-1">
            {[9, 5, 2].map((value) => (
              <span key={value} className="relative block w-8">
                <ChemistryDot value={value} className="static w-8 text-base" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="flex flex-wrap gap-4 text-sm text-ink-2">
        {(["groen", "oranje", "rood"] as const).map((strength) => (
          <li key={strength} className="flex items-center gap-2">
            <svg aria-hidden width="40" height="8">
              <line
                x1="3"
                y1="4"
                x2="37"
                y2="4"
                stroke={LINK_COLORS[strength]}
                strokeWidth={LINK_STYLE[strength].width}
                strokeDasharray={LINK_STYLE[strength].dash}
                strokeLinecap="round"
              />
            </svg>
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

      <div className="max-w-2xl space-y-3 rounded-3xl glass p-4">
        <SquadToolbar
          club={{ name: "Atletico Aula", crest: "schild" }}
          squads={[
            { id: "a", name: "Mijn elftal", lineup: result.lineup },
            { id: "b", name: "Chaos XI", lineup: result.lineup },
          ]}
          activeId="a"
          formation={formation}
          actions={{
            onClub: noop,
            onSelectSquad: noop,
            onAddSquad: noop,
            onRenameSquad: noop,
            onRemoveSquad: noop,
            onFormation: setFormation,
            onBuild: noop,
            onMatch: noop,
            onShare: noop,
            onHelp: noop,
            onClear: noop,
          }}
        />
        <SquadStats evaluation={result.evaluation} className="border-t border-line pt-3" />
      </div>

      <Menu
        label="Voorbeeldmenu"
        align="start"
        items={[
          { label: "Bouw beste elftal", icon: Wand2, onSelect: noop },
          { label: "Oefenwedstrijd", icon: Trophy, onSelect: noop },
          { label: "Mijn elftal", checked: true, onSelect: noop, separated: true },
          { label: "Chaos XI", checked: false, onSelect: noop },
        ]}
        buttonClassName="inline-flex h-9 items-center rounded-full glass px-3.5 text-sm font-medium text-ink"
      >
        Menu (pijltjes, Escape)
      </Menu>

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
          <Pitch
            evaluation={result.evaluation}
            cardById={(id) => (id ? (cards.get(id) ?? null) : null)}
            size={PITCH}
            cardWidth={fitCardWidth(PITCH)}
            selected={null}
            draggingKey={null}
            disabled
            onActivate={noop}
          />
        </DndContext>
        <p className="mt-2 text-sm text-ink-3">
          Met de oefenkaarten: rating {result.evaluation.rating}, chemie{" "}
          {result.evaluation.chemistry}.
        </p>
      </div>
    </div>
  );
}
