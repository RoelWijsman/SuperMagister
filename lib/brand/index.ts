/**
 * HET LOGO VAN SUPERMAGISTER, OP ÉÉN PLEK.
 *
 * Een nieuw logo? Pas alleen dit bestand aan. Alles volgt vanzelf:
 * - het logo in de app (components/shell/Logo.tsx) en de intro van de onboarding;
 * - het favicon (/logo.svg, app/logo.svg/route.ts);
 * - het apple-touch-icon, de PWA-iconen en de deelafbeelding (lib/brand/marks.tsx);
 * - het watermerk in de walkout-video (lib/walkout/video-render.ts).
 *
 * Het beeldmerk is een vorm in een vak van 40 × 40: een tegel met afgeronde
 * hoeken in een verloop, met daarop een fonkelende ster en een stipje.
 */
export const LOGO_SIZE = 40;
export const LOGO_RADIUS = 12;
export const LOGO_SPARK_PATH =
  "M20 7.5c1.5 7.6 4.9 11 12.5 12.5-7.6 1.5-11 4.9-12.5 12.5C18.5 24.9 15.1 21.5 7.5 20c7.6-1.5 11-4.9 12.5-12.5z";
export const LOGO_DOT = { cx: 30.5, cy: 9.5, r: 2 } as const;

/**
 * Vaste merkkleuren, voor plekken zonder thema (favicon, iconen, deelafbeelding).
 * In de app zelf kleurt het logo mee met het gekozen thema.
 */
export const BRAND = {
  violet: "#9b7bff",
  mint: "#46f0c8",
  ink: "#0b0a1a",
  night: "#070816",
  gradient: "linear-gradient(135deg, #9b7bff 0%, #46f0c8 100%)",
} as const;

/** Het beeldmerk als los SVG-bestand (het favicon). */
export function logoSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_SIZE} ${LOGO_SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND.violet}"/>
      <stop offset="1" stop-color="${BRAND.mint}"/>
    </linearGradient>
  </defs>
  <rect width="${LOGO_SIZE}" height="${LOGO_SIZE}" rx="${LOGO_RADIUS}" fill="url(#bg)"/>
  <path d="${LOGO_SPARK_PATH}" fill="${BRAND.ink}"/>
  <circle cx="${LOGO_DOT.cx}" cy="${LOGO_DOT.cy}" r="${LOGO_DOT.r}" fill="${BRAND.ink}" opacity="0.85"/>
</svg>
`;
}
