import { FORMATION_IDS, FORMATIONS, type Formation, type Slot } from "./formations";

/**
 * Hoe groot de kaartjes op het veld kunnen. De plekken staan in procenten van
 * het veld; de kaartjes zijn zo groot als kan zonder dat ze elkaar (of de rand)
 * raken, in elke formatie even groot. Zo vallen ook de chemie-bolletjes en de
 * aanvoerdersband nooit over een ander kaartje: die zitten binnen het kaartje.
 */

/** Hoogte van een kaartje gedeeld door de breedte. */
export const CARD_ASPECT = 1.3;
/** Minimale ruimte tussen kaartjes, en tussen kaartje en rand (px). */
export const CARD_GAP = 6;

export interface PitchSize {
  width: number;
  height: number;
}

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function cardBox(slot: Slot, cardWidth: number, size: PitchSize): Box {
  const height = cardWidth * CARD_ASPECT;
  const x = (slot.x / 100) * size.width;
  const y = (slot.y / 100) * size.height;
  return {
    left: x - cardWidth / 2,
    right: x + cardWidth / 2,
    top: y - height / 2,
    bottom: y + height / 2,
  };
}

/** Passen alle kaartjes van deze formatie, met ruimte ertussen en binnen het veld? */
export function cardsFit(
  formation: Formation,
  cardWidth: number,
  size: PitchSize,
  gap = CARD_GAP,
): boolean {
  const boxes = formation.slots.map((slot) => cardBox(slot, cardWidth, size));
  const edge = gap / 2;
  for (const box of boxes)
    if (
      box.left < edge ||
      box.top < edge ||
      box.right > size.width - edge ||
      box.bottom > size.height - edge
    )
      return false;
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      const apart =
        a.right + gap <= b.left ||
        b.right + gap <= a.left ||
        a.bottom + gap <= b.top ||
        b.bottom + gap <= a.top;
      if (!apart) return false;
    }
  return true;
}

/**
 * De grootste kaartbreedte (px, tussen min en max) waarbij geen enkele formatie
 * overlapt. Past zelfs de kleinste niet, dan de kleinste.
 */
export function fitCardWidth(size: PitchSize, { min = 36, max = 112 } = {}): number {
  const fitsAll = (width: number) =>
    FORMATION_IDS.every((id) => cardsFit(FORMATIONS[id], width, size));
  if (fitsAll(max)) return max;
  if (!fitsAll(min)) return min;
  let low = min;
  let high = max;
  while (high - low > 0.5) {
    const mid = (low + high) / 2;
    if (fitsAll(mid)) low = mid;
    else high = mid;
  }
  return Math.floor(low);
}
