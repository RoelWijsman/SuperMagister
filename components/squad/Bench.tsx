"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import { CARD_ASPECT } from "@/lib/squad/layout";
import { spotKey, type Spot } from "@/lib/squad/lineup";
import { NATURAL_LINE_LABELS, ratingNote, type SquadPlayer } from "@/lib/squad/players";
import { SquadCard } from "./SquadCard";

function BenchSpot({
  index,
  card,
  player,
  selected,
  dragging,
  onActivate,
}: {
  index: number;
  card: CardData | null;
  player: SquadPlayer | null;
  selected: boolean;
  dragging: boolean;
  onActivate: (spot: Spot) => void;
}) {
  const spot: Spot = { kind: "bank", index };
  const key = spotKey(spot);
  const drop = useDroppable({ id: key, data: { spot } });
  const drag = useDraggable({ id: `sleep:${key}`, data: { spot }, disabled: !card });
  const note = player ? ratingNote(player) : null;
  return (
    <li className="min-w-0">
      <button
        ref={(node) => {
          drop.setNodeRef(node);
          drag.setNodeRef(node);
        }}
        {...drag.attributes}
        {...drag.listeners}
        type="button"
        data-spot={key}
        aria-pressed={selected}
        aria-label={
          card && player
            ? `Bank ${index + 1}, ${player.subjectName}, rating ${player.rating}${note ? ` (${note})` : ""}, reserve voor ${NATURAL_LINE_LABELS[player.natural].toLowerCase()}`
            : `Bank ${index + 1}, leeg. Kies een kaart.`
        }
        onClick={() => onActivate(spot)}
        role={undefined}
        aria-disabled={undefined}
        aria-roledescription={undefined}
        tabIndex={0}
        className={cn(
          "block w-full rounded-[18%] outline-offset-4 transition-transform duration-200 focus-visible:outline-[3px] focus-visible:outline-[var(--sm-accent)]",
          (selected || drop.isOver) && "scale-110 drop-shadow-[0_0_12px_var(--sm-accent)]",
          dragging && "opacity-35",
        )}
      >
        {card ? (
          <SquadCard card={card} player={player} chemistry={null} />
        ) : (
          <span
            className={cn(
              "flex w-full items-center justify-center rounded-[20%_20%_28%_28%] border-2 border-dashed text-ink-3",
              drop.isOver || selected ? "border-[var(--sm-accent)]" : "border-line-strong",
            )}
            style={{ aspectRatio: `1 / ${CARD_ASPECT}` }}
          >
            <Plus aria-hidden className="size-[36%]" />
          </span>
        )}
      </button>
    </li>
  );
}

/** De bank: zeven wissels in een rij, zonder invloed op rating of chemie (zoals in FUT). */
export function Bench({
  bench,
  cardById,
  players,
  selected,
  draggingKey,
  onActivate,
}: {
  bench: readonly (string | null)[];
  cardById: (id: string | null) => CardData | null;
  players: ReadonlyMap<string, SquadPlayer>;
  selected: Spot | null;
  draggingKey: string | null;
  onActivate: (spot: Spot) => void;
}) {
  return (
    <section aria-labelledby="bank-titel">
      <h3 id="bank-titel" className="mb-2.5 text-sm font-semibold text-ink-2">
        Bank <span className="font-normal text-ink-3">· telt niet mee voor rating en chemie</span>
      </h3>
      <ul className="mx-auto grid max-w-[640px] grid-cols-7 gap-1.5 sm:gap-2.5">
        {bench.map((id, index) => (
          <BenchSpot
            key={index}
            index={index}
            card={cardById(id)}
            player={id ? (players.get(id) ?? null) : null}
            selected={selected?.kind === "bank" && selected.index === index}
            dragging={draggingKey === spotKey({ kind: "bank", index })}
            onActivate={onActivate}
          />
        ))}
      </ul>
    </section>
  );
}
