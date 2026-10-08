import type { LinkedSession } from "@/lib/koppelen/session";
import type { MagisterSession } from "@/lib/magister/transport";
import type { LinkedAccount } from "@/stores/connection";
import type { ExtensionStatus } from "./protocol";

/**
 * Het token blijft in de extensie. In de sessie van de app staat bij een
 * koppeling via de extensie daarom alleen dit teken; de verzoeken gaan via de
 * extensie, die het echte token erbij doet.
 */
export const EXTENSION_TOKEN = "extensie.het-token-blijft-in-de-extensie";

export type SyncDecision =
  | { action: "niets" }
  | { action: "pauze" }
  | { action: "ontkoppelen" }
  | { action: "sessie"; session: LinkedSession }
  | { action: "koppelen"; session: MagisterSession };

/**
 * Wat de app moet doen met wat de extensie meldt:
 * - koppelen: de extensie heeft een sessie en de app nog niet (of van iemand
 *   anders, of nog via de bladwijzer): koppelen via de extensie, met
 *   welkomstpack als het een nieuw account is;
 * - sessie: alles klopt, alleen het verloopmoment is nieuw;
 * - ontkoppelen: je ontkoppelde in de extensie, na je laatste koppeling hier;
 * - pauze: de extensie staat uit, maar de app is daarna nog zelf gekoppeld.
 */
export function decideSync({
  status,
  account,
  session,
}: {
  status: ExtensionStatus;
  account: LinkedAccount | null;
  session: LinkedSession | null;
}): SyncDecision {
  if (status.paused) {
    const unlinkedAfter =
      account !== null &&
      status.unlinkedAt !== null &&
      status.unlinkedAt > Date.parse(account.linkedAt);
    return unlinkedAfter ? { action: "ontkoppelen" } : { action: "pauze" };
  }
  if (!status.linked || !status.schoolHost) return { action: "niets" };

  const fresh: MagisterSession = {
    token: EXTENSION_TOKEN,
    schoolHost: status.schoolHost,
    expiresAt: status.expiresAt,
  };
  const sameAccount =
    account !== null &&
    account.schoolHost === status.schoolHost &&
    (status.personId === undefined ||
      status.personId === null ||
      status.personId === account.personId);
  if (!sameAccount || session?.method !== "extensie" || session.schoolHost !== status.schoolHost)
    return { action: "koppelen", session: fresh };
  if (session.expiresAt === status.expiresAt) return { action: "niets" };
  return { action: "sessie", session: { ...fresh, method: "extensie" } };
}
