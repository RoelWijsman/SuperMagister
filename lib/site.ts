/**
 * Waar SuperMagister draait: één instelling, NEXT_PUBLIC_SITE_URL (lokaal
 * http://localhost:3000, live https://supermagister.nl). Gebruikt voor de
 * metadata, het manifest, robots.txt en de bladwijzer. Altijd zonder "www.":
 * Vercel stuurt www.supermagister.nl door naar supermagister.nl.
 */

const LOCAL = "http://localhost:3000";

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hostname = url.hostname.replace(/^www\./, "");
    return url.origin;
  } catch {
    return null;
  }
}

export function siteUrlFrom(env: {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
}): string {
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined;
  return originOf(env.NEXT_PUBLIC_SITE_URL) ?? originOf(vercel) ?? LOCAL;
}

/** Het adres van de site. Next.js vult NEXT_PUBLIC_-waarden in tijdens het bouwen. */
export const SITE_URL = siteUrlFrom({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});

export const SITE_NAME = "SuperMagister";
/** Voor vragen over privacy of de app. Staat openbaar op /privacy. */
export const CONTACT_EMAIL = "roelcool3@gmail.com";
export const SITE_DESCRIPTION =
  "Je rooster, huiswerk en cijfers uit Magister. Mooi, supersnel en vooral leuk. Nieuwe cijfers onthul je met een walkout.";
