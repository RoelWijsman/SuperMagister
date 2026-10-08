import { SCHOOL_HOST } from "@/lib/magister/transport";
import { checkSession, parseLinkFragment, toExpiresAt, type LinkParse } from "./fragment";

/**
 * Het plakveld (reserve als de bookmarklet niet werkt). Je plakt één van:
 * - de waarde van de sessionStorage-sleutel `oidc.user:…` (een JSON-object);
 * - een link van de bookmarklet (met het koppel-fragment);
 * - alleen het token (eventueel met "Bearer " ervoor).
 * Nooit een wachtwoord: daar vraagt de app ook nergens om.
 */

export type PasteParse =
  | Exclude<LinkParse, { kind: "geen" }>
  | { kind: "ongeldig"; reason: "leeg" | "onbekend" | "school-nodig" };

/** "voorbeeld", "voorbeeld.magister.net" of een hele Magister-link → de schoolhost. */
export function normalizeSchool(input: string): string | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  let host = text;
  if (/^https?:\/\//.test(text)) {
    try {
      host = new URL(text).hostname;
    } catch {
      return null;
    }
  } else if (!text.includes(".")) {
    host = `${text}.magister.net`;
  }
  if (!SCHOOL_HOST.test(host) || host === "accounts.magister.net") return null;
  return host;
}

/** De inhoud van een JWT, zonder controle (alleen om exp en de school te vinden). */
function jwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), (c) =>
        c.charCodeAt(0),
      ),
    );
    const value: unknown = JSON.parse(json);
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Zoekt een schoolhost ergens in een object (bijv. een tenant-claim). */
function findSchool(value: unknown, depth = 0): string | null {
  if (depth > 4) return null;
  if (typeof value === "string") {
    const match = /(?:^|\/\/)([a-z0-9-]+\.magister\.net)(?:$|[/:#?])/i.exec(value.trim());
    return match ? normalizeSchool(match[1]!) : null;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = findSchool(item, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function parseJson(text: string): unknown {
  try {
    let value: unknown = JSON.parse(text);
    // Uit de console komt de waarde soms nog een keer tussen aanhalingstekens.
    if (typeof value === "string") value = JSON.parse(value);
    return value;
  } catch {
    return undefined;
  }
}

const TOKEN_LIKE = /^[A-Za-z0-9._~+/=-]+$/;

export function parsePasted(
  input: string,
  { school, now }: { school?: string; now: number },
): PasteParse {
  const text = input.trim();
  if (!text) return { kind: "ongeldig", reason: "leeg" };

  // Een link van de bookmarklet: alles staat al in het fragment.
  const hashIndex = text.indexOf("#");
  if (/^https?:\/\//i.test(text) && hashIndex >= 0) {
    const parsed = parseLinkFragment(text.slice(hashIndex), now);
    if (parsed.kind !== "geen") return parsed;
  }

  let token: string | null = null;
  let expiresAt: number | null = null;
  let found: string | null = null;

  const json = text.startsWith("{") || text.startsWith('"') ? parseJson(text) : undefined;
  if (json && typeof json === "object") {
    const record = json as Record<string, unknown>;
    if (typeof record.access_token === "string") token = record.access_token.trim();
    expiresAt = toExpiresAt(record.expires_at);
    found = findSchool(record);
  } else {
    const bare = text.replace(/^bearer\s+/i, "");
    if (TOKEN_LIKE.test(bare)) token = bare;
  }
  if (!token) return { kind: "ongeldig", reason: "onbekend" };

  const payload = jwtPayload(token);
  if (expiresAt === null && payload) expiresAt = toExpiresAt(payload.exp);
  found ??= payload ? findSchool(payload) : null;

  const typed = school?.trim() ? normalizeSchool(school) : undefined;
  if (typed === null) return { kind: "ongeldig", reason: "school" };
  const schoolHost = typed ?? found;
  if (!schoolHost) return { kind: "ongeldig", reason: "school-nodig" };

  return checkSession({ token, schoolHost, expiresAt }, now);
}
