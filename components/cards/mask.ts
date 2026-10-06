import { CARD_H, CARD_OUTLINE_SVG, CARD_W } from "@/lib/cards/draw";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" preserveAspectRatio="none"><path d="${CARD_OUTLINE_SVG}"/></svg>`;

/** CSS-masker in de vorm van de kaart, voor folie en glans. */
export const CARD_MASK = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
