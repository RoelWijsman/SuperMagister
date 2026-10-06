"use client";

import { useEffect, useRef, useState } from "react";
import {
  CARD_RATIO,
  drawCardBack,
  drawCardFace,
  drawCardSilhouette,
  cardGlow,
  ensureCardFont,
  type CardFaceOptions,
  type CardSide,
} from "@/lib/cards/draw";
import { cardAltText, type CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";

interface CardCanvasProps {
  card: CardData;
  /** Breedte in CSS-pixels; de hoogte volgt (verhouding 1 : 1,44). */
  width: number;
  side?: CardSide;
  options?: CardFaceOptions;
  /** Pas tekenen als de kaart in beeld komt (voor grote albums). */
  lazy?: boolean;
  className?: string;
}

/** Een verzamelkaart in de pagina, getekend met dezelfde code als de walkout. */
export function CardCanvas({
  card,
  width,
  side = "face",
  options,
  lazy = false,
  className,
}: CardCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void ensureCardFont().then(() => {
      const canvas = ref.current;
      if (cancelled || !canvas) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(width * CARD_RATIO * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, width * CARD_RATIO);
      if (side === "face") drawCardFace(ctx, card, width, options);
      else if (side === "back") drawCardBack(ctx, card, width);
      else drawCardSilhouette(ctx, width, cardGlow(card));
    });
    return () => {
      cancelled = true;
    };
  }, [card, width, side, options, visible]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={cardAltText(card)}
      style={{ width, height: width * CARD_RATIO }}
      className={cn("block select-none", className)}
    />
  );
}
