import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_HEADER,
  dashboardConfig,
  INTERNAL_PREFIX,
  readCookie,
  safeEqual,
  SESSION_COOKIE,
  subPath,
  verifySession,
  type Access,
} from "@/lib/dev-dashboard/auth";
import { buildCsp } from "@/lib/security/csp";

/**
 * Zet bij elke pagina een strenge Content Security Policy met een nieuwe
 * nonce. Next.js plakt die nonce zelf op zijn eigen scripts; het themascript
 * in de layout leest hem uit de x-nonce-header. (Niet te verwarren met de
 * Magister-proxy in app/api/magister.)
 *
 * Daarnaast het privé ontwikkelaarsdashboard (lib/dev-dashboard/auth.ts): het
 * geheime adres uit DEV_DASHBOARD_PATH wordt intern doorgestuurd naar
 * /dev-dashboard-intern, maar alleen met een geldige sessie (of, voor de
 * inlogpagina, met de juiste ?key=). Anders gebeurt er niets bijzonders en
 * geeft het adres dezelfde 404 als elke andere pagina die niet bestaat. Het
 * interne adres zelf geeft altijd een 404.
 */

/** Bestaat niet, dus Next.js toont de gewone 404. */
const NOT_FOUND_PATH = "/_niet-gevonden";

async function dashboardAccess(request: NextRequest): Promise<{
  access: Access;
  target: string;
} | null> {
  const config = dashboardConfig();
  if (!config) return null;
  const rest = subPath(request.nextUrl.pathname, config.path);
  if (rest === null) return null;

  const cookie = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (await verifySession(config, cookie)) return { access: "dashboard", target: rest };

  // Zonder sessie: alleen de inlogpagina (en het inloggen zelf), en alleen met de sleutel.
  const key = request.nextUrl.searchParams.get("key");
  if (key === null || !(await safeEqual(key, config.key))) return null;
  if (rest === "" && request.method === "GET") return { access: "inloggen", target: "/inloggen" };
  if (rest === "/sessie" && request.method === "POST")
    return { access: "inloggen", target: "/sessie" };
  return null;
}

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp({ nonce, dev: process.env.NODE_ENV === "development" });

  const headers = new Headers(request.headers);
  // Alleen deze proxy mag zeggen dat iemand het dashboard in mag.
  headers.delete(ACCESS_HEADER);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const { pathname } = request.nextUrl;
  let response: NextResponse;
  if (pathname === INTERNAL_PREFIX || pathname.startsWith(`${INTERNAL_PREFIX}/`)) {
    response = NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url), {
      request: { headers },
    });
  } else {
    const dashboard = await dashboardAccess(request);
    if (dashboard) {
      headers.set(ACCESS_HEADER, dashboard.access);
      const url = new URL(`${INTERNAL_PREFIX}${dashboard.target}`, request.url);
      url.search = request.nextUrl.search;
      response = NextResponse.rewrite(url, { request: { headers } });
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      response.headers.set("Cache-Control", "private, no-store");
    } else {
      response = NextResponse.next({ request: { headers } });
    }
  }
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Niet voor de API-routes en vaste bestanden: die hebben geen scripts.
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    // Het interne adres van het dashboard: altijd langs de proxy, ook bij prefetches.
    "/dev-dashboard-intern/:path*",
  ],
};
