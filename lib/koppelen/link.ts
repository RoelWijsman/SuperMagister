"use client";

import { create } from "zustand";
import { createMagisterClient } from "@/lib/magister/client";
import { createTransport, transportFor } from "@/lib/magister/config";
import { parseAccount } from "@/lib/magister/parse/account";
import { MagisterError, type MagisterSession } from "@/lib/magister/transport";
import { notify } from "@/lib/notify";
import { trackLinked } from "@/lib/stats/client";
import { useConnection } from "@/stores/connection";
import { getSessionStore } from "./runtime";
import type { LinkMethod } from "./session";
import { wipeMagisterData } from "./wipe";

/**
 * Koppelen, op één manier voor alle wegen erheen: de
 * bookmarklet, het plakveld en de voorbeelddata. Eerst kijken of het token
 * werkt en wie je bent, dan pas bewaren. Een ander account dan hiervoor? Dan
 * gaan eerst de gegevens van het vorige account van dit apparaat af.
 *
 * Het welkomstpack volgt vanzelf: een nieuw account heeft nog geen onthulde
 * cijfers, dus bij de eerste keer laden is alles al onthuld behalve de laatste
 * vijf cijfers (zie de bron en useRevealState).
 */

export type LinkFailure =
  "token" | "school" | "verlopen" | "geen-toegang" | "netwerk" | "server" | "te-vaak" | "onbekend";

export interface LinkSuccess {
  isNew: boolean;
  name: string;
  firstName: string;
  school: string;
}

interface LinkFlowState {
  status: "rust" | "bezig" | "gelukt" | "fout";
  method: LinkMethod | null;
  result: LinkSuccess | null;
  failure: LinkFailure | null;
  reset: () => void;
}

/** De stand van de laatste koppelpoging, voor de koppelpagina. */
export const useLinkFlow = create<LinkFlowState>()((set) => ({
  status: "rust",
  method: null,
  result: null,
  failure: null,
  reset: () => set({ status: "rust", method: null, result: null, failure: null }),
}));

function failureOf(error: unknown): LinkFailure {
  if (!(error instanceof MagisterError)) return "onbekend";
  switch (error.code) {
    case "verlopen":
    case "geen-sessie":
      return "verlopen";
    case "geen-toegang":
      return "geen-toegang";
    case "netwerk":
      return "netwerk";
    case "te-vaak":
      return "te-vaak";
    case "server":
      return "server";
    case "ongeldige-school":
      return "school";
    default:
      return "onbekend";
  }
}

export function failLink(method: LinkMethod, failure: LinkFailure) {
  useLinkFlow.setState({ status: "fout", method, result: null, failure });
}

export async function completeLink(
  session: MagisterSession,
  method: LinkMethod,
): Promise<LinkSuccess | null> {
  useLinkFlow.setState({ status: "bezig", method, result: null, failure: null });
  try {
    const client = createMagisterClient(createTransport(() => session, transportFor(method)));
    const account = parseAccount(await client.account(), {
      schoolHost: session.schoolHost,
      enrollment: null,
    });

    const previous = useConnection.getState().account;
    const other =
      previous !== null &&
      (previous.schoolHost !== session.schoolHost || previous.personId !== account.id);
    if (other) await wipeMagisterData();

    getSessionStore().set({ ...session, method });
    const { isNew } = useConnection.getState().link({
      schoolHost: session.schoolHost,
      personId: account.id,
      name: account.fullName || account.firstName,
      linkedAt: new Date().toISOString(),
      ...(method === "voorbeeld" ? { sample: true } : {}),
    });

    const result = {
      isNew,
      name: account.fullName,
      firstName: account.firstName || account.fullName,
      school: account.schoolName,
    };
    useLinkFlow.setState({ status: "gelukt", method, result, failure: null });
    trackLinked(method, isNew);
    if (isNew)
      notify(
        "toast.gekoppeld",
        { school: result.school, naam: result.firstName },
        { emoji: "🔗", tone: "success" },
      );
    else notify("toast.weerGekoppeld", {}, { tone: "success" });
    return result;
  } catch (error) {
    failLink(method, failureOf(error));
    return null;
  }
}
