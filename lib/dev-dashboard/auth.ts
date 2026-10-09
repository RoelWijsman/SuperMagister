/**
 * Het privé ontwikkelaarsdashboard: wie mag erin? Drie omgevingsvariabelen,
 * niets hardgecodeerd:
 *
 * - DEV_DASHBOARD_PATH      het geheime adres, bijv. /dev-k3v9…
 * - DEV_DASHBOARD_PASSWORD  het wachtwoord
 * - DEV_DASHBOARD_KEY       ?key=… om de inlogpagina überhaupt te zien
 *
 * Ontbreekt er één (of is hij te kort), dan bestaat het dashboard niet: elk
 * adres geeft de gewone 404.
 *
 * De sessie is een ondertekend cookie: `v1.<verloopmoment>.<handtekening>`. De
 * sleutel komt uit het wachtwoord, dus een nieuw wachtwoord maakt alle oude
 * sessies ongeldig. Alles met Web Crypto, zodat het in de proxy én in de
 * routes werkt.
 */

export interface DashboardConfig {
  /** Bijv. `/dev-k3v9x7q2`, zonder slash aan het eind. */
  path: string;
  password: string;
  key: string;
}

/** Het interne adres waar de pagina's echt staan. Rechtstreeks openen geeft altijd een 404. */
export const INTERNAL_PREFIX = "/dev-dashboard-intern";

/** Het geheime adres: een slash, dan minstens 12 tekens (letters, cijfers, - en _). */
const PATH = /^\/[A-Za-z0-9_-]{12,64}$/;
const MIN_SECRET = 12;

export function dashboardConfigFrom(
  env: Record<string, string | undefined>,
): DashboardConfig | null {
  const path = env.DEV_DASHBOARD_PATH?.trim().replace(/\/+$/, "") ?? "";
  const password = env.DEV_DASHBOARD_PASSWORD ?? "";
  const key = env.DEV_DASHBOARD_KEY ?? "";
  // Niet over de API, Next.js zelf of het interne adres heen.
  if (!PATH.test(path) || /^\/(api|_next|dev-dashboard-intern)/i.test(path)) return null;
  if (password.length < MIN_SECRET || key.length < MIN_SECRET) return null;
  return { path, password, key };
}

export function dashboardConfig(): DashboardConfig | null {
  return dashboardConfigFrom(process.env);
}

/** Valt dit adres onder het geheime adres? Geeft dan het deel erna (bijv. "" of "/export"). */
export function subPath(pathname: string, base: string): string | null {
  if (pathname === base) return "";
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length);
  return null;
}

export const SESSION_COOKIE = "sm-dev";
export const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function hmac(secret: string, message: string): Promise<ArrayBuffer> {
  return crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(message));
}

/** Een willekeurige sleutel per serverinstantie, alleen om in constante tijd te vergelijken. */
let compareSecret: string | null = null;

/**
 * Vergelijkt twee geheimen in constante tijd: eerst allebei door HMAC (dan zijn
 * ze even lang en lekt ook de lengte niet), dan byte voor byte zonder vroeg te
 * stoppen.
 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  compareSecret ??= crypto.randomUUID();
  const [x, y] = await Promise.all([hmac(compareSecret, a), hmac(compareSecret, b)]);
  const left = new Uint8Array(x);
  const right = new Uint8Array(y);
  let diff = left.length ^ right.length;
  for (let i = 0; i < left.length; i++) diff |= left[i]! ^ (right[i] ?? 0);
  return diff === 0;
}

const signingSecret = (config: DashboardConfig) => `sm-dev-sessie|${config.password}`;

export async function createSession(
  config: DashboardConfig,
  now = Date.now(),
): Promise<{ value: string; expires: Date }> {
  const expires = now + SESSION_MS;
  const signature = base64url(await hmac(signingSecret(config), `v1.${expires}`));
  return { value: `v1.${expires}.${signature}`, expires: new Date(expires) };
}

export async function verifySession(
  config: DashboardConfig,
  value: string | undefined | null,
  now = Date.now(),
): Promise<boolean> {
  if (!value) return false;
  const match = /^v1\.(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return false;
  const expires = Number(match[1]);
  if (!(expires > now) || expires - now > SESSION_MS) return false;
  const expected = base64url(await hmac(signingSecret(config), `v1.${expires}`));
  return safeEqual(match[2]!, expected);
}

/** De Set-Cookie-header: httpOnly, secure, sameSite=strict, alleen voor het geheime adres. */
export function sessionCookie(config: DashboardConfig, value: string, expires: Date): string {
  return [
    `${SESSION_COOKIE}=${value}`,
    `Path=${config.path}`,
    `Expires=${expires.toUTCString()}`,
    `Max-Age=${Math.floor((expires.getTime() - Date.now()) / 1000)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

export function clearedSessionCookie(config: DashboardConfig): string {
  return [
    `${SESSION_COOKIE}=`,
    `Path=${config.path}`,
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

/** Leest één cookie uit de Cookie-header. */
export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return rest.join("=");
  }
  return null;
}

/** Wat de proxy aan de interne pagina's doorgeeft. Komt nooit van buiten (de proxy wist hem). */
export const ACCESS_HEADER = "x-sm-dev";
export type Access = "dashboard" | "inloggen";
