/**
 * Het vakkenpalet: 12 heldere tinten rond de kleurencirkel plus 4 zachte
 * pasteltinten. Gekozen om op een donkere achtergrond te gloeien en naast
 * elkaar onderscheidbaar te blijven.
 */
export const SUBJECT_PALETTE = [
  { name: "Tomaat", hex: "#ff6b5b" },
  { name: "Mandarijn", hex: "#ff9a3c" },
  { name: "Zon", hex: "#ffd23f" },
  { name: "Limoen", hex: "#b5e853" },
  { name: "Munt", hex: "#3ee69a" },
  { name: "Lagune", hex: "#2ccfc0" },
  { name: "Hemel", hex: "#3db8ff" },
  { name: "Kobalt", hex: "#5b7cff" },
  { name: "Iris", hex: "#8c6bff" },
  { name: "Orchidee", hex: "#c77dff" },
  { name: "Magenta", hex: "#f45bd0" },
  { name: "Kauwgom", hex: "#ff77a9" },
  { name: "Perzik", hex: "#ffb38a" },
  { name: "Zand", hex: "#e3c08d" },
  { name: "Zeeschuim", hex: "#9ef0d8" },
  { name: "Lavendel", hex: "#b8b5ff" },
] as const;

export const PALETTE_SIZE = SUBJECT_PALETTE.length;

/** FNV-1a (32 bit): snel, deterministisch en goed verspreid voor korte codes. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (const char of input) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Stapgrootte bij een botsing: 7 is copriem met 16 en springt ver over de kleurencirkel. */
const PROBE_STEP = 7;

/**
 * Geeft elk vak een vaste paletkleur. Elk vak krijgt de kleur van zijn hash;
 * bij een botsing schuift het met grote stappen door naar een vrije kleur, zodat
 * twee vakken nooit dezelfde (of een naburige) tint krijgen zolang het er
 * maximaal 16 zijn. De uitkomst hangt niet af van de volgorde van de invoer.
 */
export function assignSubjectColors(codes: readonly string[]): Record<string, number> {
  const unique = [...new Set(codes.map((code) => code.toLowerCase()))].sort();
  const used = new Set<number>();
  const result: Record<string, number> = {};

  for (const code of unique) {
    const preferred = hashString(code) % PALETTE_SIZE;
    let index = preferred;
    if (used.size < PALETTE_SIZE) {
      for (let step = 0; used.has(index) && step < PALETTE_SIZE; step++) {
        index = (index + PROBE_STEP) % PALETTE_SIZE;
      }
    }
    used.add(index);
    result[code] = index;
  }
  return result;
}
