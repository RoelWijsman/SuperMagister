import { BRAND, LOGO_DOT, LOGO_SIZE, LOGO_SPARK_PATH } from "./index";

/**
 * Het logo voor gegenereerde afbeeldingen (next/og): de deelafbeelding, het
 * apple-touch-icon en de PWA-iconen. Vorm en kleuren komen uit lib/brand/index.ts.
 */

/** De ster met het stipje, op een transparante achtergrond (viewBox 40 × 40). */
export function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${LOGO_SIZE} ${LOGO_SIZE}`}>
      <path d={LOGO_SPARK_PATH} fill={BRAND.ink} />
      <circle {...LOGO_DOT} fill={BRAND.ink} fillOpacity="0.85" />
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
