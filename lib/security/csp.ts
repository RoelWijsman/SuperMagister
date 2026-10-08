/**
 * De Content Security Policy van SuperMagister. Als er ooit toch kwaadaardige
 * HTML uit Magister langs DOMPurify zou glippen, kan die hier nog steeds geen
 * script draaien en je token nergens heen sturen.
 *
 * - Scripts: alleen van de app zelf, met een nonce per verzoek (geen inline
 *   scripts, geen eval behalve tijdens het bouwen voor React).
 * - Verbindingen: alleen de eigen server (ook de Magister-proxy en de
 *   schoolvakanties) en Open-Meteo voor het fietsweer. Nooit rechtstreeks naar
 *   Magister. Lettertypes komen van de eigen server (next/font), niet van Google.
 * - Stijlen mogen inline: Framer Motion en React zetten stijlen op elementen.
 * - Plaatjes en video als blob: voor delen en de walkout-video.
 */
export function buildCsp({ nonce, dev }: { nonce: string; dev: boolean }): string {
  const directives: [string, ...string[]][] = [
    ["default-src", "'self'"],
    [
      "script-src",
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["img-src", "'self'", "data:", "blob:"],
    ["font-src", "'self'"],
    ["connect-src", "'self'", "https://api.open-meteo.com", "https://geocoding-api.open-meteo.com"],
    ["media-src", "'self'", "blob:"],
    ["worker-src", "'self'", "blob:"],
    ["manifest-src", "'self'"],
    ["frame-src", "'none'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
  ];
  if (!dev) directives.push(["upgrade-insecure-requests"]);
  return directives.map((parts) => parts.join(" ")).join("; ");
}
