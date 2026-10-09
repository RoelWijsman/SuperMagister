"use client";

import type { CSSProperties } from "react";
import { CARD_MASK } from "@/components/cards/mask";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import { faceStyleFor } from "@/lib/cards/draw";
import { cardTierLabel, type CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";

/**
 * Een kleine kaart voor op het veld en de bank, zoals in de squad builder: de
 * rating linksboven, de positie eronder, het vak-icoon en de vaknaam, en onder
 * de kaart de spelerschemie als getal en balkje. Kleuren en vorm komen van de
 * echte kaart (faceStyleFor en het kaartmasker).
 */
export function SquadCard({
  card,
  position,
  chemistry,
  captain = false,
  className,
}: {
  card: CardData;
  /** Bijv. "SP"; leeg op de bank. */
  position?: string;
  /** 0–10, of null (op de bank telt chemie niet). */
  chemistry: number | null;
  captain?: boolean;
  className?: string;
}) {
  const style = faceStyleFor(card);
  const [a, b, c, d] = style.stops;
  return (
    <span className={cn("@container relative block w-full select-none", className)}>
      <span
        aria-hidden
        className="relative block aspect-[500/720] w-full overflow-hidden"
        style={
          {
            maskImage: CARD_MASK,
            WebkitMaskImage: CARD_MASK,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
            background: `linear-gradient(160deg, ${a}, ${b} 38%, ${c} 62%, ${d})`,
            color: style.text,
          } as CSSProperties
        }
      >
        <span
          className="absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(circle at 70% 45%, ${card.color}55, transparent 60%)`,
          }}
        />
        <span className="absolute top-[14%] left-[13%] flex flex-col items-center leading-none">
          <span className="sensitive font-card text-[clamp(0.95rem,4.6cqw+0.35rem,1.6rem)] tabular-nums">
            {card.ratingLabel}
          </span>
          {position && (
            <span className="font-card text-[clamp(0.5rem,1.6cqw+0.3rem,0.75rem)] tracking-wider opacity-80">
              {position}
            </span>
          )}
        </span>
        <span
          className="absolute top-[22%] right-[12%] grid aspect-square w-[42%] place-items-center rounded-full"
          style={{ background: `${style.badgeBg}22` }}
        >
          <SubjectIcon name={card.icon} className="size-[70%]" strokeWidth={2.2} />
        </span>
        <span className="absolute inset-x-[8%] bottom-[19%] truncate text-center font-card text-[clamp(0.5rem,1.4cqw+0.32rem,0.78rem)] tracking-wide uppercase">
          {card.subjectName}
        </span>
        <span className="absolute inset-x-0 bottom-[9%] text-center font-card text-[clamp(0.42rem,1cqw+0.25rem,0.6rem)] tracking-[0.15em] opacity-70">
          {cardTierLabel(card)}
        </span>
      </span>
      {captain && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 grid size-[clamp(1rem,28%,1.4rem)] place-items-center rounded-full bg-[#ffd25c] font-card text-[clamp(0.55rem,1.5cqw+0.3rem,0.8rem)] text-[#2b1d03] shadow-[0_2px_6px_rgb(0_0_0/0.5)]"
        >
          C
        </span>
      )}
      {chemistry !== null && <ChemistryBar value={chemistry} />}
    </span>
  );
}

/** Spelerschemie onder een kaart: het getal en tien streepjes. */
export function ChemistryBar({ value, className }: { value: number; className?: string }) {
  const tone = value >= 7 ? "var(--sm-good)" : value >= 4 ? "var(--sm-warn)" : "var(--sm-bad)";
  return (
    <span aria-hidden className={cn("mt-1 flex items-center gap-1", className)}>
      <span className="min-w-[1.1em] text-center font-card text-[0.7rem] leading-none text-white tabular-nums">
        {value}
      </span>
      <span className="flex h-1.5 flex-1 gap-px overflow-hidden rounded-full bg-black/45 p-px">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="flex-1 rounded-[1px] transition-colors duration-500"
            style={{ background: i < value ? tone : "transparent" }}
          />
        ))}
      </span>
    </span>
  );
}
