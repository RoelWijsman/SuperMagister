import { SCHOOL_HOST, type MagisterSession } from "@/lib/magister/transport";

/**
 * Het koppel-fragment: zo geeft de bookmarklet je
 * sessie door. Alles staat achter het # van de link, nooit in de query
 * string: het fragment gaat niet mee naar een server en komt niet in logs.
 * De app leest het meteen uit en wist het (zie LinkIntake).
 *
 *   https://app/koppelen#koppel=1&token=…&expires_at=1791374400&school=jouwschool.magister.net
 */

/** Tekens die in een Bearer-token mogen; hetzelfde als de proxy toelaat. */
export const TOKEN_PATTERN = /^[A-Za-z0-9._~+/=-]{20,8192}$/;

export type LinkParse =
  | { kind: "geen" }
  | { kind: "ongeldig"; reason: "token" | "school" | "verlopen" }
  | { kind: "ok"; session: MagisterSession };

/** Magister geeft `expires_at` in seconden; wij rekenen in milliseconden. */
export function toExpiresAt(value: unknown): number | null {
  const number = typeof value === "string" && value.trim() ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number) || number <= 0) return null;
  return number < 1e12 ? Math.round(number * 1000) : Math.round(number);
}

export const normalizeHost = (host: string) => host.trim().toLowerCase();

/** Controleert een sessie van buiten (bookmarklet of plakveld). */
export function checkSession(
  input: { token: string; schoolHost: string; expiresAt: number | null },
  now: number,
): Exclude<LinkParse, { kind: "geen" }> {
  const schoolHost = normalizeHost(input.schoolHost);
  if (!SCHOOL_HOST.test(schoolHost)) return { kind: "ongeldig", reason: "school" };
  if (!TOKEN_PATTERN.test(input.token)) return { kind: "ongeldig", reason: "token" };
  if (input.expiresAt !== null && input.expiresAt <= now)
    return { kind: "ongeldig", reason: "verlopen" };
  return { kind: "ok", session: { token: input.token, schoolHost, expiresAt: input.expiresAt } };
}

export function buildLinkFragment({
  token,
  expiresAt,
  schoolHost,
}: {
  token: string;
  /** Seconden of milliseconden, of null als onbekend. */
  expiresAt: number | null;
  schoolHost: string;
}): string {
  const params = new URLSearchParams({ koppel: "1", token });
  if (expiresAt !== null) params.set("expires_at", String(expiresAt));
  params.set("school", schoolHost);
  return `#${params.toString()}`;
}

export function parseLinkFragment(hash: string, now: number): LinkParse {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (!params.has("koppel") && !params.has("token")) return { kind: "geen" };
  return checkSession(
    {
      token: params.get("token") ?? "",
      schoolHost: params.get("school") ?? "",
      expiresAt: toExpiresAt(params.get("expires_at")),
    },
    now,
  );
}
