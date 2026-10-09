"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import type { LinkStrength, SlotResult, SquadEvaluation } from "@/lib/squad/chemistry";
import { POSITION_NAMES } from "@/lib/squad/formations";
import { spotKey, type Spot } from "@/lib/squad/lineup";
import { SquadCard } from "./SquadCard";

/**
 * Het veld: een getekend grasveld in een donker stadion, de chemie-lijnen tussen
 * de plekken en de elf plekken zelf. Elke plek is een knop (tikken), een
 * sleepdoel en, als er een kaart staat, ook te slepen (alleen met de muis).
 */

export const LINK_COLORS: Readonly<Record<LinkStrength, string>> = {
  groen: "#4fe3a3",
  oranje: "#ffb547",
  rood: "#ff6b81",
};

/** Naast de kleur ook een lijnsoort: zo is het ook zonder kleur te zien. */
const LINK_DASH: Readonly<Record<LinkStrength, string | undefined>> = {
  groen: undefined,
  oranje: "5 3",
  rood: "1.5 3.5",
};

export const LINK_LABELS: Readonly<Record<LinkStrength, string>> = {
  groen: "sterk",
  oranje: "zwak",
  rood: "geen",
};

/** De lijnen van het veld (in een vak van 68 × 100, zoals een echt veld 68 × 105 m). */
function Markings() {
  const line = "rgba(255,255,255,0.2)";
  return (
    <svg
      aria-hidden
      viewBox="0 0 68 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full"
      fill="none"
      stroke={line}
      strokeWidth="0.35"
    >
      <rect x="3" y="3" width="62" height="94" rx="0.6" />
      <line x1="3" y1="50" x2="65" y2="50" />
      <ellipse cx="34" cy="50" rx="8.5" ry="6.2" />
      <circle cx="34" cy="50" r="0.5" fill={line} />
      {/* Strafschopgebieden en doelgebieden, boven en onder. */}
      <rect x="15" y="3" width="38" height="15" />
      <rect x="25" y="3" width="18" height="5.5" />
      <rect x="15" y="82" width="38" height="15" />
      <rect x="25" y="91.5" width="18" height="5.5" />
      <path d="M27.5 18 A8 6 0 0 0 40.5 18" />
      <path d="M27.5 82 A8 6 0 0 1 40.5 82" />
      <circle cx="34" cy="13" r="0.45" fill={line} />
      <circle cx="34" cy="87" r="0.45" fill={line} />
      <rect x="29" y="1.6" width="10" height="1.4" />
      <rect x="29" y="97" width="10" height="1.4" />
    </svg>
  );
}

function SlotButton({
  result,
  card,
  selected,
  disabled,
  dragging,
  onActivate,
}: {
  result: SlotResult;
  card: CardData | null;
  selected: boolean;
  disabled: boolean;
  dragging: boolean;
  onActivate: (spot: Spot) => void;
}) {
  const spot: Spot = { kind: "veld", slot: result.slot.id };
  const key = spotKey(spot);
  const drop = useDroppable({ id: key, data: { spot } });
  const drag = useDraggable({ id: `sleep:${key}`, data: { spot }, disabled: !card || disabled });
  const name = POSITION_NAMES[result.slot.position];
  const label = card
    ? `${name}, ${card.subjectName}, rating ${card.ratingLabel}, chemie ${result.chemistry}${result.captain ? ", aanvoerder" : ""}`
    : `${name}, leeg. Kies een kaart.`;

  return (
    <button
      ref={(node) => {
        drop.setNodeRef(node);
        drag.setNodeRef(node);
      }}
      {...drag.attributes}
      {...drag.listeners}
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onActivate(spot)}
      // dnd-kit zet role="button" en tabIndex; de knop zelf regelt dat al.
      role={undefined}
      aria-disabled={undefined}
      aria-roledescription={undefined}
      tabIndex={0}
      className={cn(
        "absolute w-[13.5%] max-w-[80px] -translate-x-1/2 -translate-y-1/2 rounded-xl outline-offset-4 transition-[transform,filter] duration-200",
        "touch-manipulation focus-visible:outline-2 focus-visible:outline-[var(--sm-accent)]",
        selected && "z-10 scale-110 drop-shadow-[0_0_14px_var(--sm-accent)]",
        drop.isOver && "z-10 scale-110",
        dragging && "opacity-35",
      )}
      style={{ left: `${result.slot.x}%`, top: `${result.slot.y}%` }}
    >
      {card ? (
        <SquadCard
          card={card}
          position={result.slot.position}
          chemistry={result.chemistry}
          captain={result.captain}
          className="drop-shadow-[0_6px_10px_rgb(0_0_0/0.55)]"
        />
      ) : (
        <span
          className={cn(
            "flex aspect-[500/720] w-full flex-col items-center justify-center gap-1 rounded-[22%_22%_30%_30%] border-2 border-dashed bg-black/25 text-white/75 backdrop-blur-[2px]",
            drop.isOver ? "border-[var(--sm-accent)]" : "border-white/30",
          )}
        >
          <Plus aria-hidden className="size-[34%]" strokeWidth={2.2} />
          <span className="font-card text-[clamp(0.6rem,2.2vw,0.85rem)] tracking-wider">
            {result.slot.position}
          </span>
        </span>
      )}
    </button>
  );
}

export function Pitch({
  evaluation,
  cardById,
  selected,
  draggingKey,
  disabled = false,
  onActivate,
  children,
}: {
  evaluation: SquadEvaluation;
  cardById: (id: string | null) => CardData | null;
  selected: Spot | null;
  /** De plek die nu gesleept wordt (die wordt even doorzichtig). */
  draggingKey: string | null;
  disabled?: boolean;
  onActivate: (spot: Spot) => void;
  children?: ReactNode;
}) {
  const position = (slotId: string) => evaluation.formation.slots.find((s) => s.id === slotId)!;
  return (
    <div
      className="relative mx-auto aspect-[68/92] w-full max-w-[560px] overflow-hidden rounded-[1.75rem] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.08)]"
      style={{
        background: [
          // Licht van de stadionlampen, in de kleur van je thema.
          "radial-gradient(120% 55% at 50% -12%, color-mix(in oklab, var(--sm-accent) 32%, transparent), transparent 60%)",
          "radial-gradient(140% 90% at 50% 50%, transparent 55%, rgb(0 0 0 / 0.55))",
          // Gemaaide banen.
          "repeating-linear-gradient(180deg, rgb(255 255 255 / 0.035) 0 8.33%, transparent 8.33% 16.66%)",
          "linear-gradient(180deg, #0f4a2e, #0b3522 55%, #082618)",
        ].join(","),
      }}
    >
      <Markings />
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full"
      >
        {evaluation.links.map((link) => {
          const a = position(link.a);
          const b = position(link.b);
          const strength = link.strength;
          return (
            <line
              key={`${link.a}-${link.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeWidth={strength ? 3 : 1.5}
              stroke={strength ? LINK_COLORS[strength] : "rgba(255,255,255,0.16)"}
              strokeDasharray={strength ? LINK_DASH[strength] : "2 4"}
              style={{ transition: "stroke 0.5s ease, stroke-width 0.3s ease" }}
              opacity={strength ? 0.9 : 1}
            />
          );
        })}
      </svg>
      {evaluation.slots.map((result) => (
        <SlotButton
          key={result.slot.id}
          result={result}
          card={cardById(result.player?.id ?? null)}
          selected={selected?.kind === "veld" && selected.slot === result.slot.id}
          disabled={disabled}
          dragging={draggingKey === spotKey({ kind: "veld", slot: result.slot.id })}
          onActivate={onActivate}
        />
      ))}
      {children}
    </div>
  );
}
