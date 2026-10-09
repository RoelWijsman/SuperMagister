"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { statsAllowed } from "@/lib/stats/client";

/**
 * Vercel Web Analytics: cookieloze, anonieme bezoekersaantallen per pagina.
 * Niets als je statistieken uit hebt gezet of je browser Do Not Track / Global
 * Privacy Control aan heeft. Het adres gaat zonder ?… en #… mee (daar kan een
 * token of datum in staan), en een vak in het adres wordt "[vak]".
 */
export function anonymousUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.search = "";
    url.hash = "";
    url.pathname = url.pathname.replace(/^\/cijfers\/[^/]+/, "/cijfers/[vak]");
    return url.toString();
  } catch {
    return "";
  }
}

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (!statsAllowed()) return null;
  const url = anonymousUrl(event.url);
  return url ? { ...event, url } : null;
}

export function VercelAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
