/**
 * Het logo voor gegenereerde afbeeldingen (next/og): de deelafbeelding, het
 * apple-touch-icon en de PWA-iconen. Zelfde vorm en kleuren als app/icon.svg.
 */

export const BRAND = {
  violet: "#9b7bff",
  mint: "#46f0c8",
  ink: "#0b0a1a",
  night: "#070816",
  gradient: "linear-gradient(135deg, #9b7bff 0%, #46f0c8 100%)",
} as const;

const STAR =
  "M20 7.5c1.5 7.6 4.9 11 12.5 12.5-7.6 1.5-11 4.9-12.5 12.5C18.5 24.9 15.1 21.5 7.5 20c7.6-1.5 11-4.9 12.5-12.5z";

/** De ster met het stipje, op een transparante achtergrond (viewBox 40 × 40). */
export function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <path d={STAR} fill={BRAND.ink} />
      <circle cx="30.5" cy="9.5" r="2" fill={BRAND.ink} fillOpacity="0.85" />
    </svg>
  );
}

/**
 * Het hele icoon. `bleed`: de verloopkleur tot de rand (voor maskable en
 * apple-touch-icons, die het systeem zelf afrondt), anders met ronde hoeken.
 */
export function AppIcon({ size, bleed = false }: { size: number; bleed?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: BRAND.gradient,
        borderRadius: bleed ? 0 : size * 0.3,
      }}
    >
      {/* Maskable: alles belangrijks binnen de veilige cirkel (80%). */}
      <Star size={bleed ? size * 0.78 : size} />
    </div>
  );
}
