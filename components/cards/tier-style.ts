import type { CardTier } from "@/lib/calc/tiers";

/** Gloedkleur per kaarttier. Fase 2 bouwt hier de volledige kaartstijlen op. */
export const TIER_GLOW: Readonly<Record<CardTier, string>> = {
  brons: "#d08a5c",
  zilver: "#dfe5ef",
  goud: "#ffcf4a",
  toty: "#3d7bff",
  icon: "#fff1c2",
};
