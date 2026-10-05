"use client";

import { useId, type SVGProps } from "react";

export type IllustrationName = "bank" | "kaarten" | "trofee" | "zoeken" | "stekker" | "planeet";

/**
 * Kleine, vrolijke illustraties voor lege staten. Ze kleuren mee met het
 * thema: vlakken in het accentverloop, lijnen in de tekstkleur.
 */
export function Illustration({
  name,
  ...props
}: { name: IllustrationName } & SVGProps<SVGSVGElement>) {
  const id = useId();
  const fill = `url(#${id}-fill)`;
  const soft = `url(#${id}-soft)`;
  // Omlijning voor gevulde vormen, en losse lijnen zonder vulling.
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 2.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  const line = { ...stroke, fill: "none" } as const;

  return (
    <svg viewBox="0 0 160 120" aria-hidden {...props}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--sm-accent)" stopOpacity="0.85" />
          <stop offset="1" stopColor="var(--sm-accent-2)" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`${id}-soft`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sm-accent)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--sm-accent-2)" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="108" rx="58" ry="5" fill="currentColor" opacity="0.1" />

      {name === "bank" && (
        <g>
          <rect x="34" y="34" width="92" height="34" rx="14" fill={soft} {...stroke} />
          <rect x="22" y="58" width="116" height="34" rx="14" fill={fill} />
          <rect x="14" y="50" width="26" height="44" rx="13" fill={fill} {...stroke} />
          <rect x="120" y="50" width="26" height="44" rx="13" fill={fill} {...stroke} />
          <path d="M80 62v26M30 94v8M130 94v8" {...line} />
          <rect
            x="44"
            y="44"
            width="24"
            height="16"
            rx="6"
            fill="currentColor"
            opacity="0.18"
            transform="rotate(-8 56 52)"
          />
          <path d="M101 22c3-4-3-6 0-10M110 22c3-4-3-6 0-10" {...line} opacity="0.6" />
          <rect x="98" y="24" width="16" height="14" rx="4" fill={fill} {...stroke} />
        </g>
      )}

      {name === "kaarten" && (
        <g>
          <rect
            x="34"
            y="26"
            width="48"
            height="68"
            rx="9"
            fill={soft}
            {...stroke}
            transform="rotate(-14 58 60)"
          />
          <rect
            x="78"
            y="26"
            width="48"
            height="68"
            rx="9"
            fill={soft}
            {...stroke}
            transform="rotate(14 102 60)"
          />
          <rect x="56" y="18" width="48" height="72" rx="9" fill={fill} {...stroke} />
          <path d="M80 38l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="white" opacity="0.9" />
          <path d="M128 18v8M124 22h8M30 30v6M27 33h6" {...line} />
        </g>
      )}

      {name === "trofee" && (
        <g>
          <path d="M56 24h48v22a24 24 0 0 1-48 0z" fill={fill} {...stroke} />
          <path d="M56 30H44a12 12 0 0 0 14 16M104 30h12a12 12 0 0 1-14 16" {...line} />
          <path d="M80 70v12M64 96h32l-4-14H68z" fill={soft} {...stroke} />
          <path d="M34 22l4 4M126 22l-4 4M30 52h6M124 52h6" {...line} opacity="0.7" />
          <circle cx="44" cy="80" r="3" fill="var(--sm-accent-2)" />
          <circle cx="118" cy="74" r="3" fill="var(--sm-accent)" />
        </g>
      )}

      {name === "zoeken" && (
        <g>
          <circle cx="70" cy="54" r="30" fill={soft} {...stroke} />
          <path d="M92 76l24 24" {...line} strokeWidth={9} />
          <path d="M62 46a9 9 0 1 1 12 8c-3 2-4 3-4 7" {...line} />
          <circle cx="70" cy="68" r="2.5" fill="currentColor" />
        </g>
      )}

      {name === "stekker" && (
        <g>
          <path d="M20 60h28" {...line} />
          <rect x="46" y="44" width="30" height="32" rx="9" fill={fill} {...stroke} />
          <path d="M76 52h12M76 68h12" {...line} />
          <rect x="98" y="40" width="30" height="40" rx="9" fill={soft} {...stroke} />
          <path d="M128 60h16" {...line} />
          <path d="M92 32l-4 8h7l-4 8" {...line} opacity="0.8" />
        </g>
      )}

      {name === "planeet" && (
        <g>
          <circle cx="80" cy="58" r="30" fill={fill} {...stroke} />
          <ellipse cx="80" cy="60" rx="58" ry="14" {...line} transform="rotate(-12 80 60)" />
          <circle cx="70" cy="48" r="5" fill="white" opacity="0.35" />
          <circle cx="92" cy="66" r="3.5" fill="white" opacity="0.25" />
          <path d="M28 22v6M25 25h6M132 92v6M129 95h6M136 26h.01M22 86h.01" {...line} />
        </g>
      )}
    </svg>
  );
}
