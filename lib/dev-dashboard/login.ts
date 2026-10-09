import { clientIp, createRateLimiter, type RateLimiter } from "@/lib/security/rate-limit";
import { FIELDS } from "@/lib/stats/fields";
import { counters, type CounterBuffer } from "@/lib/stats/store";
import {
  clearedSessionCookie,
  createSession,
  safeEqual,
  sessionCookie,
  type DashboardConfig,
} from "./auth";

/**
 * Inloggen en uitloggen voor het dashboard. Het formulier post naar
 * `<geheim adres>/sessie?key=…` (de proxy laat dat alleen door met de juiste
 * sleutel). Hooguit 5 pogingen per 15 minuten per IP-adres; die teller staat
 * alleen in het geheugen en verdwijnt vanzelf. Het wachtwoord wordt in
 * constante tijd vergeleken en nergens gelogd.
 */

export const LOGIN_LIMIT = 5;
export const LOGIN_WINDOW_MS = 15 * 60_000;

const LIMITER = createRateLimiter({ limit: LOGIN_LIMIT, windowMs: LOGIN_WINDOW_MS });

const redirect = (location: string, cookie?: string) =>
  new Response(null, {
    status: 303,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });

export async function handleLogin(
  request: Request,
  config: DashboardConfig,
  {
    limiter = LIMITER,
    buffer = counters,
    now = Date.now,
  }: { limiter?: RateLimiter; buffer?: CounterBuffer; now?: () => number } = {},
): Promise<Response> {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  const back = (fout: string) =>
    redirect(`${config.path}?key=${encodeURIComponent(key)}&fout=${fout}`);

  const allowed = limiter.check(clientIp(request.headers));
  if (!allowed.ok) {
    buffer.add(FIELDS.rateLimited("inloggen"));
    return back("te-vaak");
  }

  let password = "";
  try {
    const form = await request.formData();
    const value = form.get("wachtwoord");
    password = typeof value === "string" ? value.slice(0, 512) : "";
  } catch {
    return back("fout");
  }
  if (!(await safeEqual(password, config.password))) return back("fout");

  const session = await createSession(config, now());
  return redirect(config.path, sessionCookie(config, session.value, session.expires));
}

export function handleLogout(config: DashboardConfig): Response {
  return redirect("/", clearedSessionCookie(config));
}
