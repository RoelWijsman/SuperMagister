import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Zoekmachines mogen alleen de voorkant (/ en Vandaag) en /privacy zien. De
 * rest is je eigen app en hoort niet in zoekresultaten (de pagina's zeggen
 * zelf ook noindex).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/$", "/vandaag$", "/privacy$"], disallow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
