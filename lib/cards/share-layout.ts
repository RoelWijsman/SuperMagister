/**
 * Indeling van de deelbare afbeeldingen: 1080 × 1350 (4:5), het formaat dat
 * op elke tijdlijn en in elke groepsapp goed past.
 */
export const SHARE_W = 1080;
export const SHARE_H = 1350;

export interface ShowcaseSlot {
  /** Middelpunt van de kaart. */
  x: number;
  y: number;
  /** Breedte; de hoogte volgt uit de kaartverhouding. */
  w: number;
  /** Kanteling in graden. */
  angle: number;
  /** Tekenvolgorde: hoger ligt bovenop. */
  z: number;
}

/** De vitrine als waaier: de middelste kaart vooraan, de rest licht gedraaid erachter. */
export function showcaseSlots(count: number): ShowcaseSlot[] {
  const n = Math.max(0, Math.min(5, count));
  const middle = (n - 1) / 2;
  const spacing = n === 5 ? 180 : n === 4 ? 200 : 260;
  const base = n === 1 ? 480 : n <= 3 ? 420 : 380;
  return Array.from({ length: n }, (_, i) => {
    const d = i - middle;
    return {
      x: SHARE_W / 2 + d * spacing,
      // Midden tussen kop (±290) en voettekst (±1290).
      y: 780 + Math.abs(d) * 28,
      w: base * (1 - 0.12 * Math.abs(d)),
      angle: d * 7,
      z: 10 - Math.abs(d),
    };
  });
}
