"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { CARD_MASK } from "@/components/cards/mask";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import { faceStyleFor } from "@/lib/cards/draw";
import { cardTierLabel, type CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import { CARD_ASPECT } from "@/lib/squad/layout";
import type { SquadPlayer } from "@/lib/squad/players";
import { shortSubjectName } from "@/lib/subjects/short";

/** Kleur van de spelerschemie: groen vanaf 7, oranje vanaf 4, anders rood. */
export const chemistryTone = (value: number) =>
  value >= 7 ? "var(--sm-good)" : value >= 4 ? "var(--sm-warn)" : "var(--sm-bad)";

/**
 * Een klein kaartje voor op het veld en de bank, zoals in de squad builder van
 * Ultimate Team: de rating linksboven met de positie eronder, het vak-icoon, de
 * korte vaknaam ("Wis A"), en rechtsonder de spelerschemie als bolletje. De
 * aanvoerder draagt een band. Kleuren en vorm komen van de echte kaart
 * (faceStyleFor en het kaartmasker). Bij een beoordeling staat de rating die
 * meetelt, met de beoordeling er klein bij ("80 G").
 */
export function SquadCard({
  card,
  player,
  position,
  chemistry,
  captain = false,
  animate = true,
  className,
}: {
  card: CardData;
  /** De speler bij deze kaart (rating zoals hij meetelt, korte naam). */
  player?: SquadPlayer | null;
  /** Bijv. "SP"; leeg op de bank. */
  position?: string;
  /** 0–10, of null (op de bank telt chemie niet). */
  chemistry: number | null;
  captain?: boolean;
  /** Mee-animeren bij plaatsen en wisselen (uit voor kopieën, zoals tijdens het slepen). */
  animate?: boolean;
  className?: string;
}) {
  const style = faceStyleFor(card);
  const [a, b, c, d] = style.stops;
  const rating = player ? String(player.rating) : card.ratingLabel;
  const judged = player?.judged ?? null;
  const name = player?.shortName ?? shortSubjectName(card.subjectName, card.subjectCode);

  return (
    <motion.span
      layoutId={animate ? `elftal-${card.id}` : undefined}
      initial={animate ? { scale: 0.86, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 460, damping: 32 }}
      className={cn("@container relative block w-full select-none", className)}
      style={{ aspectRatio: `1 / ${CARD_ASPECT}` }}
    >
      <span
        aria-hidden
        className="absolute inset-0 overflow-hidden"
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
            background: `radial-gradient(circle at 70% 40%, ${card.color}55, transparent 60%)`,
          }}
        />
        <span className="absolute top-[11%] left-[11%] flex flex-col items-center leading-none">
          <span className="sensitive flex items-start font-card text-[31cqw] tabular-nums">
            {rating}
            {judged && (
              <span className="mt-[2cqw] ml-[3cqw] rounded-[3cqw] bg-black/55 px-[3.5cqw] pt-[2cqw] pb-[0.5cqw] text-[13cqw] leading-none text-white">
                {judged}
              </span>
            )}
          </span>
          {position && (
            <span className="mt-[1cqw] font-card text-[13cqw] tracking-wider opacity-85">
              {position}
            </span>
          )}
        </span>
        <span
          className="absolute top-[14%] right-[10%] grid aspect-square w-[36%] place-items-center rounded-full"
          style={{ background: `${style.badgeBg}22` }}
        >
          <SubjectIcon name={card.icon} className="size-[68%]" strokeWidth={2.2} />
        </span>
        <span className="absolute inset-x-[6%] bottom-[25%] truncate text-center font-card text-[19cqw] leading-none tracking-wide uppercase">
          {name}
        </span>
        <span className="absolute inset-x-0 bottom-[12%] hidden text-center font-card text-[8.5cqw] leading-none tracking-[0.14em] opacity-70 @min-[64px]:block">
          {cardTierLabel(card)}
        </span>
      </span>
      {captain && (
        <span
          aria-hidden
          className="absolute top-[2%] -right-[3%] rounded-[5cqw] border-[1.5px] border-[#7a5400] bg-[#ffd25c] px-[6cqw] pt-[2.5cqw] pb-[1.5cqw] font-card text-[17cqw] leading-none text-[#2b1d03] shadow-[0_2px_8px_rgb(0_0_0/0.55)]"
        >
          C
        </span>
      )}
      {chemistry !== null && <ChemistryDot value={chemistry} />}
    </motion.span>
  );
}

/** Spelerschemie rechtsonder op het kaartje, als bolletje met het getal. */
export function ChemistryDot({ value, className }: { value: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute right-[2%] bottom-[2%] grid aspect-square w-[27%] place-items-center rounded-full border-[1.5px] border-black/40 font-card text-[15cqw] leading-none text-[#0b0a1a] tabular-nums shadow-[0_2px_6px_rgb(0_0_0/0.45)] transition-colors duration-500",
        className,
      )}
      style={{ background: chemistryTone(value) }}
    >
      {value}
    </span>
  );
}

/** Spelerschemie als getal en tien streepjes (voor uitleg en de stijlgids). */
export function ChemistryBar({ value, className }: { value: number; className?: string }) {
  const tone = chemistryTone(value);
  return (
    <span aria-hidden className={cn("flex items-center gap-1.5", className)}>
      <span className="min-w-[1.1em] text-center font-card text-sm leading-none text-ink tabular-nums">
        {value}
      </span>
      <span className="flex h-1.5 flex-1 gap-px overflow-hidden rounded-full bg-black/30 p-px">
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
