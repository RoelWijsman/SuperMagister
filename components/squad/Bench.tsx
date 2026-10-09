"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import { spotKey, type Spot } from "@/lib/squad/lineup";
import { SquadCard } from "./SquadCard";

function BenchSpot({
  index,
  card,
  selected,
  dragging,
  onActivate,
}: {
  index: number;
  card: CardData | null;
  selected: boolean;
  dragging: boolean;
  onActivate: (spot: Spot) => void;
}) {
  const spot: Spot = { kind: "bank", index };
  const key = spotKey(spot);
  const drop = useDroppable({ id: key, data: { spot } });
  const drag = useDraggable({ id: `sleep:${key}`, data: { spot }, disabled: !card });
  return (
    <li className="w-[clamp(52px,12vw,76px)] shrink-0">
      <button
        ref={(node) => {
          drop.setNodeRef(node);
          drag.setNodeRef(node);
        }}
        {...drag.attributes}
        {...drag.listeners}
        type="button"
        aria-pressed={selected}
        aria-label={
          card
            ? `Bank ${index + 1}, ${card.subjectName}, rating ${card.ratingLabel}`
            : `Bank ${index + 1}, leeg. Kies een kaart.`
        }
        onClick={() => onActivate(spot)}
        role={undefined}
        aria-disabled={undefined}
        aria-roledescription={undefined}
        tabIndex={0}
        className={cn(
          "block w-full rounded-xl outline-offset-4 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-[var(--sm-accent)]",
          (selected || drop.isOver) && "scale-110 drop-shadow-[0_0_12px_var(--sm-accent)]",
          dragging && "opacity-35",
        )}
      >
        {card ? (
          <SquadCard card={card} chemistry={null} />
        ) : (
          <span
            className={cn(
              "flex aspect-[500/720] w-full items-center justify-center rounded-[22%_22%_30%_30%] border-2 border-dashed text-ink-3",
              drop.isOver ? "border-[var(--sm-accent)]" : "border-line-strong",
            )}
          >
            <Plus aria-hidden className="size-[36%]" />
          </span>
        )}
      </button>
    </li>
  );
}

/** De bank: zeven wissels, zonder invloed op rating of chemie (zoals in FUT). */
export function Bench({
  bench,
  cardById,
  selected,
  draggingKey,
  onActivate,
}: {
  bench: readonly (string | null)[];
  cardById: (id: string | null) => CardData | null;
  selected: Spot | null;
  draggingKey: string | null;
  onActivate: (spot: Spot) => void;
}) {
  return (
    <section aria-labelledby="bank-titel">
      <h3 id="bank-titel" className="mb-2 text-sm font-semibold text-ink-2">
        Bank <span className="font-normal text-ink-3">· telt niet mee voor rating en chemie</span>
      </h3>
      <ul className="flex gap-2 overflow-x-auto pt-2 pb-1">
        {bench.map((id, index) => (
          <BenchSpot
            key={index}
            index={index}
            card={cardById(id)}
            selected={selected?.kind === "bank" && selected.index === index}
            dragging={draggingKey === spotKey({ kind: "bank", index })}
            onActivate={onActivate}
          />
        ))}
      </ul>
    </section>
  );
}
