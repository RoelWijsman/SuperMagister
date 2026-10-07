"use client";

import { useEffect, useRef } from "react";
import { useCelebration } from "@/stores/celebration";

const DURATION = 3600;
const PIECES = 150;
const FALLBACK = ["#8b7bff", "#3fd6c4", "#5ee08a", "#ffd36b", "#ff8fb1"];

interface Piece {
  x: number;
  y: number;
  vy: number;
  sway: number;
  phase: number;
  spin: number;
  w: number;
  h: number;
  color: string;
}

function palette(): string[] {
  const style = getComputedStyle(document.documentElement);
  const tokens = ["--sm-accent", "--sm-accent-2", "--sm-good", "--sm-warn"]
    .map((name) => style.getPropertyValue(name).trim())
    .filter(Boolean);
  return tokens.length ? [...tokens, "#ffd36b", "#ff8fb1"] : FALLBACK;
}

/**
 * Fase 3c: confetti die van boven over het hele scherm regent, als alles voor
 * morgen af is. Eén canvas, geen klikken tegenhouden, en niets bij "minder
 * beweging" (de melding komt dan nog wel).
 */
export function ConfettiRain() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const count = useCelebration((s) => s.count);

  useEffect(() => {
    const node = canvas.current;
    if (count === 0 || !node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = node.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = window.innerWidth;
    const height = window.innerHeight;
    node.width = Math.round(width * dpr);
    node.height = Math.round(height * dpr);
    ctx.scale(dpr, dpr);

    const colors = palette();
    const pieces: Piece[] = Array.from({ length: PIECES }, (_, i) => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.6,
      vy: 140 + Math.random() * 160,
      sway: 18 + Math.random() * 30,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 9,
      w: 6 + Math.random() * 5,
      h: 9 + Math.random() * 7,
      color: colors[i % colors.length]!,
    }));

    const start = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      // De laatste halve seconde vervaagt alles.
      ctx.globalAlpha = Math.min(1, Math.max(0, (DURATION - (now - start)) / 500));
      for (const piece of pieces) {
        const y = piece.y + piece.vy * t;
        if (y > height + 20) continue;
        const x = piece.x + Math.sin(piece.phase + t * 2.4) * piece.sway;
        const angle = piece.phase + t * piece.spin;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        // Kantelen: de breedte ademt mee, zoals echte snippers.
        ctx.scale(Math.cos(piece.phase + t * 5), 1);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      }
      if (now - start < DURATION) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, node.width, node.height);
    };
  }, [count]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[95] h-full w-full"
    />
  );
}
