"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { CardCanvas } from "@/components/cards/CardCanvas";
import { CARD_MASK } from "@/components/cards/mask";
import { CARD_RATIO, cardGlow } from "@/lib/cards/draw";
import type { CardData } from "@/lib/cards/model";
import type { FoilId } from "@/lib/collection/goals";

const MAX_TILT = 14;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const MASK: CSSProperties = { maskImage: CARD_MASK, WebkitMaskImage: CARD_MASK };

interface HoloCardProps {
  card: CardData;
  width: number;
  foil: FoilId;
  flipped: boolean;
  /** Kantelen met de gyroscoop van je telefoon. */
  gyro?: boolean;
}

/**
 * Kaart in 3D: kantelt mee met je muis (of telefoon), met een folie die het
 * licht vangt. Omdraaien toont de achterkant met datum en context.
 */
export function HoloCard({ card, width, foil, flipped, gyro = false }: HoloCardProps) {
  const reduced = useReducedMotion();
  const surface = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 170, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 170, damping: 18 });

  /** x en y van 0 tot 1: waar het licht vandaan komt. */
  const aim = useCallback(
    (x: number, y: number) => {
      const element = surface.current;
      if (!element) return;
      const mx = x * 2 - 1;
      const my = y * 2 - 1;
      element.style.setProperty("--px", `${(x * 100).toFixed(1)}%`);
      element.style.setProperty("--py", `${(y * 100).toFixed(1)}%`);
      element.style.setProperty("--mx", mx.toFixed(3));
      element.style.setProperty("--my", my.toFixed(3));
      element.style.setProperty("--hyp", Math.min(1, Math.hypot(mx, my)).toFixed(3));
      if (!reduced) {
        rotateY.set(mx * MAX_TILT);
        rotateX.set(-my * MAX_TILT);
      }
    },
    [reduced, rotateX, rotateY],
  );

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    aim(
      clamp((event.clientX - rect.left) / rect.width),
      clamp((event.clientY - rect.top) / rect.height),
    );
  };

  useEffect(() => {
    if (!gyro) return;
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      // Een telefoon houd je schuin vast (zo'n 40°): dat telt als recht.
      aim(clamp((event.gamma + 25) / 50), clamp((event.beta - 15) / 50));
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [gyro, aim]);

  const height = width * CARD_RATIO;

  return (
    <div className="relative" style={{ width, height, perspective: 1100 }}>
      <span
        aria-hidden
        className="absolute inset-[8%] rounded-[40%] opacity-55 blur-3xl"
        style={{ background: cardGlow(card) }}
      />
      <motion.div
        ref={surface}
        onPointerMove={onPointerMove}
        onPointerLeave={() => aim(0.5, 0.5)}
        className="absolute inset-0 transform-3d"
        style={{ rotateX, rotateY }}
      >
        <motion.div
          className="absolute inset-0 transform-3d"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 18 }}
        >
          <div className="absolute inset-0 backface-hidden">
            <CardCanvas card={card} width={width} className="sensitive" />
            <div className="holo" data-foil={foil} style={MASK} />
          </div>
          <div className="absolute inset-0 [transform:rotateY(180deg)] backface-hidden">
            <CardCanvas card={card} width={width} side="back" className="sensitive" />
            <div className="holo" data-foil="standaard" style={MASK} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
