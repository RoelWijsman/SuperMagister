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

/** Minimale lengte van het pad (zonder slash), het wachtwoord en de sleutel. */
export const MIN_LENGTH = 8;

/** Tekens die zonder gedoe in een adres passen (RFC 3986 "unreserved"). */
const PATH_CHARS = /^[A-Za-z0-9._~-]+$/;

/**
 * Een waarde zoals iemand hem in Vercel plakt: spaties, enters en
 * aanhalingstekens eromheen halen we weg ("abc", 'abc' en ` abc ` worden abc).
 */
export function cleanValue(value: string | undefined): string {
  let text = (value ?? "").trim();
  while (text.length >= 2 && /^(["'`]).*\1$/s.test(text)) text = text.slice(1, -1).trim();
  return text;
}

/**
 * Het pad, netjes: met één slash vooraan, zonder slash aan het eind. Dus
 * `dev-abc`, `/dev-abc`, `/dev-abc/` en `"/dev-abc"` worden allemaal `/dev-abc`.
 */
export function normalizePath(value: string | undefined): string {
  const inner = cleanValue(value).replace(/^\/+|\/+$/g, "");
  return inner ? `/${inner}` : "";
}

export type ConfigCheck = { ok: true; config: DashboardConfig } | { ok: false; reasons: string[] };

/**
 * Controleert de drie variabelen en zegt in gewone taal wat er mis is. De
 * redenen bevatten nooit de waarden zelf, alleen wat er niet klopt.
 */
export function checkDashboardConfig(env: Record<string, string | undefined>): ConfigCheck {
  const path = normalizePath(env.DEV_DASHBOARD_PATH);
  const password = cleanValue(env.DEV_DASHBOARD_PASSWORD);
  const key = cleanValue(env.DEV_DASHBOARD_KEY);
  const reasons: string[] = [];

  const inner = path.slice(1);
  if (!inner) reasons.push("DEV_DASHBOARD_PATH ontbreekt of is leeg");
  else {
    if (inner.length < MIN_LENGTH)
      reasons.push(`DEV_DASHBOARD_PATH is korter dan ${MIN_LENGTH} tekens (zonder de slash)`);
    if (!PATH_CHARS.test(inner))
      reasons.push(
        "DEV_DASHBOARD_PATH mag alleen letters, cijfers en - _ . ~ bevatten (één deel, geen extra /)",
      );
    // Niet over de API, Next.js zelf of het interne adres heen.
    if (/^(api|_next|dev-dashboard-intern)/i.test(inner))
      reasons.push("DEV_DASHBOARD_PATH mag niet beginnen met api, _next of dev-dashboard-intern");
  }
  if (!password) reasons.push("DEV_DASHBOARD_PASSWORD ontbreekt of is leeg");
  else if (password.length < MIN_LENGTH)
    reasons.push(`DEV_DASHBOARD_PASSWORD is korter dan ${MIN_LENGTH} tekens`);
  if (!key) reasons.push("DEV_DASHBOARD_KEY ontbreekt of is leeg");
  else {
    if (key.length < MIN_LENGTH)
      reasons.push(`DEV_DASHBOARD_KEY is korter dan ${MIN_LENGTH} tekens`);
    if (/[\s#&?%]/.test(key))
      reasons.push(
        "DEV_DASHBOARD_KEY bevat een spatie, #, &, ? of %: die breken het adres. Kies een sleutel met alleen letters, cijfers, - en _",
      );
  }
  return reasons.length ? { ok: false, reasons } : { ok: true, config: { path, password, key } };
}

export function dashboardConfigFrom(
  env: Record<string, string | undefined>,
): DashboardConfig | null {
  const result = checkDashboardConfig(env);
  return result.ok ? result.config : null;
}

/** Elke reden maar één keer per serverinstantie loggen. */
let lastWarning = "";

/**
 * De configuratie van deze server, gelezen op het moment zelf (runtime, niet
 * tijdens het bouwen). Is er wel iets ingevuld maar klopt het niet, dan komt
 * er één regel in de serverlogs (Vercel → Logs) met wát er niet klopt, zonder
 * de waarden. Is er niets ingevuld, dan blijft het stil: dan staat het dashboard
 * gewoon uit.
 */
export function dashboardConfig(): DashboardConfig | null {
  const env = {
    DEV_DASHBOARD_PATH: process.env.DEV_DASHBOARD_PATH,
    DEV_DASHBOARD_PASSWORD: process.env.DEV_DASHBOARD_PASSWORD,
    DEV_DASHBOARD_KEY: process.env.DEV_DASHBOARD_KEY,
  };
  const result = checkDashboardConfig(env);
  if (result.ok) return result.config;
  const anySet = Object.values(env).some((value) => cleanValue(value) !== "");
  const warning = result.reasons.join("; ");
  if (anySet && warning !== lastWarning) {
    lastWarning = warning;
    console.warn(`[ontwikkelaarsdashboard] staat uit: ${warning}.`);
  }
  return null;
}

/** Een adres uit de adresbalk, gedecodeerd (%2D wordt -) en zonder slash aan het eind. */
function plainPath(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Kapotte %-codering: dan gewoon zoals hij is.
  }
  return decoded.length > 1 ? decoded.replace(/\/+$/, "") : decoded;
}

/**
 * Valt dit adres onder het geheime adres? Geeft dan het deel erna (bijv. "" of
 * "/export"). Hoofdletters maken niet uit: /Dev-ABC is hetzelfde als /dev-abc.
 */
export function subPath(pathname: string, base: string): string | null {
  const path = plainPath(pathname);
  const lower = path.toLowerCase();
  const target = base.toLowerCase();
  if (lower === target) return "";
  if (lower.startsWith(`${target}/`)) return path.slice(base.length);
  return null;
}

/**
 * De sleutel uit ?key=… zoals hij bedoeld is: spaties eromheen weg, en een
 * spatie in het midden was waarschijnlijk een + (zo leest een adres een +).
 */
export function cleanKeyParam(value: string | null): string | null {
  if (value === null) return null;
  return value.trim().replace(/ /g, "+");
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
