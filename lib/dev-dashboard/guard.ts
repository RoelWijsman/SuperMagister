import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ACCESS_HEADER,
  dashboardConfig,
  SESSION_COOKIE,
  verifySession,
  type Access,
  type DashboardConfig,
} from "./auth";

/**
 * Tweede slot op de deur, in elke pagina en route van het dashboard: de proxy
 * moet ons hierheen hebben gestuurd (de header komt alleen van proxy.ts), en
 * voor het dashboard zelf controleren we de sessie hier nog een keer. Anders:
 * de gewone 404.
 */
export async function requireAccess(kind: Access): Promise<DashboardConfig> {
  const config = dashboardConfig();
  if (!config) notFound();
  const access = (await headers()).get(ACCESS_HEADER);
  if (kind === "inloggen") {
    if (access !== "inloggen" && access !== "dashboard") notFound();
    return config;
  }
  if (access !== "dashboard") notFound();
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySession(config, cookie))) notFound();
  return config;
}
