"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import type { LinkStrength, SlotResult, SquadEvaluation } from "@/lib/squad/chemistry";
import { POSITION_NAMES } from "@/lib/squad/formations";
import { CARD_ASPECT, type PitchSize } from "@/lib/squad/layout";
import { spotKey, type Spot } from "@/lib/squad/lineup";
import { ratingNote } from "@/lib/squad/players";
import { SquadCard } from "./SquadCard";

/**
 * Het veld: een getekend grasveld in een donker stadion, de chemie-lijnen tussen
 * de plekken en de elf plekken zelf. Elke plek is een knop (tikken, Enter), een
 * sleepdoel en, als er een kaart staat, ook te slepen (alleen met de muis). De
 * kaartjes zijn zo groot als past zonder te overlappen (lib/squad/layout.ts).
 */

export const LINK_COLORS: Readonly<Record<LinkStrength, string>> = {
  groen: "#4fe3a3",
  oranje: "#ffb547",
  rood: "#ff6b81",
};

/**
 * Naast de kleur ook een lijnsoort, zodat je het ook zonder kleur ziet:
 * groen doorgetrokken, oranje lange streepjes, rood losse stipjes.
 */
export const LINK_STYLE: Readonly<
  Record<LinkStrength, { dash: string | undefined; width: number }>
> = {
  groen: { dash: undefined, width: 3.5 },
  oranje: { dash: "10 7", width: 3 },
  rood: { dash: "0.1 7", width: 4 },
};

/**
 * Wat er gebeurt als je de gesleepte kaart hier loslaat: plaatsen (groen),
 * wisselen (blauw) of kan niet (gedimd), met wat het met de teamchemie doet.
 */
export interface DropHint {
  kind: "plaatsen" | "wisselen" | "kan-niet";
  /** Verschil in teamchemie, of null als het niet kan. */
  chemistry: number | null;
}

export const DROP_COLORS: Readonly<Record<DropHint["kind"], string>> = {
  plaatsen: "var(--sm-good)",
  wisselen: "#5aa9ff",
  "kan-niet": "var(--sm-bad)",
};

/** Het randje en het getalletje op een plek tijdens het slepen. */
export function DropHintBadge({ hint, over }: { hint: DropHint; over: boolean }) {
  const color = DROP_COLORS[hint.kind];
  const text =
    hint.kind === "kan-niet"
      ? "kan niet"
      : `${hint.kind === "wisselen" ? "wissel" : "plaats"}${
          hint.chemistry
            ? ` · ${hint.chemistry > 0 ? "+" : "−"}${Math.abs(hint.chemistry)} chemie`
            : ""
        }`;
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-1 rounded-[20%] border-[3px] transition-opacity",
          hint.kind === "kan-niet" ? "border-dashed opacity-60" : "opacity-90",
          over && "opacity-100",
        )}
        style={{ borderColor: color, boxShadow: over ? `0 0 18px ${color}` : undefined }}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold whitespace-nowrap text-[#0b0a1a] shadow-[0_2px_8px_rgb(0_0_0/0.5)]",
          !over && hint.kind === "kan-niet" && "opacity-0",
        )}
        style={{ background: color }}
      >
        {text}
      </span>
    </>
  );
}

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

/** Wat een schermlezer hoort bij een plek: "Spits, Wiskunde A, rating 82, chemie 9". */
export function slotLabel(result: SlotResult): string {
  const name = POSITION_NAMES[result.slot.position];
  const player = result.player;
  if (!player) return `${name}, leeg. Kies een kaart.`;
  const note = ratingNote(player);
  const fit = result.fit === "verkeerd" || result.fit === "onmogelijk" ? ", uit positie" : "";
  return `${name}, ${player.subjectName}, rating ${player.rating}${note ? ` (${note})` : ""}, chemie ${result.chemistry}${fit}${result.captain ? ", aanvoerder" : ""}`;
}

function SlotButton({
  result,
  card,
  width,
  selected,
  disabled,
  dragging,
  hint,
  onActivate,
}: {
  result: SlotResult;
  card: CardData | null;
  width: number;
  selected: boolean;
  disabled: boolean;
  dragging: boolean;
  hint: DropHint | null;
  onActivate: (spot: Spot) => void;
}) {
  const spot: Spot = { kind: "veld", slot: result.slot.id };
  const key = spotKey(spot);
  const drop = useDroppable({ id: key, data: { spot } });
  const drag = useDraggable({ id: `sleep:${key}`, data: { spot }, disabled: !card || disabled });

  return (
    <button
      ref={(node) => {
        drop.setNodeRef(node);
        drag.setNodeRef(node);
      }}
      {...drag.attributes}
      {...drag.listeners}
      type="button"
      data-spot={key}
      aria-label={slotLabel(result)}
      aria-pressed={selected}
      onClick={() => onActivate(spot)}
      // dnd-kit zet role="button" en tabIndex; de knop zelf regelt dat al.
      role={undefined}
      aria-disabled={undefined}
      aria-roledescription={undefined}
      tabIndex={0}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 rounded-[18%] outline-offset-4 transition-[transform,filter,opacity] duration-200",
        "touch-manipulation focus-visible:outline-[3px] focus-visible:outline-[var(--sm-accent)]",
        selected && "z-10 scale-110 drop-shadow-[0_0_16px_var(--sm-accent)]",
        drop.isOver && hint?.kind !== "kan-niet" && "z-10 scale-110",
        hint?.kind === "kan-niet" && "opacity-50",
        dragging && "opacity-35",
      )}
      style={{ left: `${result.slot.x}%`, top: `${result.slot.y}%`, width }}
    >
      {hint && <DropHintBadge hint={hint} over={drop.isOver} />}
      {card ? (
        <SquadCard
          card={card}
          player={result.player}
          position={result.slot.position}
          chemistry={result.chemistry}
          captain={result.captain}
          className="drop-shadow-[0_6px_10px_rgb(0_0_0/0.55)]"
        />
      ) : (
        <span
          className={cn(
            "@container flex w-full flex-col items-center justify-center gap-[4cqw] rounded-[20%_20%_28%_28%] border-2 border-dashed bg-black/25 text-white/80 backdrop-blur-[2px]",
            drop.isOver || selected ? "border-[var(--sm-accent)]" : "border-white/35",
          )}
          style={{ aspectRatio: `1 / ${CARD_ASPECT}` }}
        >
          <Plus aria-hidden className="size-[34%]" strokeWidth={2.2} />
          <span className="font-card text-[18cqw] leading-none tracking-wider">
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
  size,
  cardWidth,
  selected,
  draggingKey,
  hints,
  disabled = false,
  onActivate,
  children,
}: {
  evaluation: SquadEvaluation;
  cardById: (id: string | null) => CardData | null;
  size: PitchSize;
  cardWidth: number;
  selected: Spot | null;
  /** De plek die nu gesleept wordt (die wordt even doorzichtig). */
  draggingKey: string | null;
  /** Tijdens het slepen: per plek (spotKey) wat er gebeurt als je loslaat. */
  hints?: ReadonlyMap<string, DropHint> | null;
  disabled?: boolean;
  onActivate: (spot: Spot) => void;
  children?: ReactNode;
}) {
  const position = (slotId: string) => evaluation.formation.slots.find((s) => s.id === slotId)!;
  return (
    <div
      role="group"
      aria-label={`Het veld, formatie ${evaluation.formation.id}`}
      className="relative mx-auto overflow-hidden rounded-[1.75rem] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.08)]"
      style={{
        width: size.width,
        height: size.height,
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
          const style = strength ? LINK_STYLE[strength] : null;
          return (
            <line
              key={`${link.a}-${link.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeWidth={style?.width ?? 1.5}
              stroke={strength ? LINK_COLORS[strength] : "rgba(255,255,255,0.18)"}
              strokeDasharray={style ? style.dash : "2 5"}
              style={{ transition: "stroke 0.5s ease, stroke-width 0.3s ease" }}
              opacity={strength ? 0.92 : 1}
            />
          );
        })}
      </svg>
      {evaluation.slots.map((result) => (
        <SlotButton
          key={result.slot.id}
          result={result}
          card={cardById(result.player?.id ?? null)}
          width={cardWidth}
          selected={selected?.kind === "veld" && selected.slot === result.slot.id}
          disabled={disabled}
          dragging={draggingKey === spotKey({ kind: "veld", slot: result.slot.id })}
          hint={hints?.get(spotKey({ kind: "veld", slot: result.slot.id })) ?? null}
          onActivate={onActivate}
        />
      ))}
      {children}
    </div>
  );
}
