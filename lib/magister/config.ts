import type { LinkMethod } from "@/lib/koppelen/session";
import { getExtensionBridge } from "@/lib/extensie/runtime";
import { createFixtureTransport } from "./fixture-transport";
import {
  createExtensionTransport,
  createProxyTransport,
  type MagisterSession,
  type MagisterTransport,
  type TransportKind,
} from "./transport";

/**
 * De enige plek waar gekozen wordt hoe SuperMagister bij Magister komt.
 * Automatisch: koppelde je via de browserextensie, dan doet de extensie de
 * verzoeken (het token blijft daar); anders gaat alles via de eigen proxy.
 * ("voorbeeld" is alleen voor het testen met de testbestanden.)
 */
export function transportFor(method: LinkMethod | undefined): TransportKind {
  if (method === "voorbeeld") return "voorbeeld";
  return method === "extensie" ? "extensie" : "proxy";
}

type SessionWithMethod = MagisterSession & { method?: LinkMethod };

export function createTransport(
  session: () => SessionWithMethod | null,
  kind?: TransportKind,
): MagisterTransport {
  if (kind === "voorbeeld") return createFixtureTransport({ session });
  const proxy = createProxyTransport({ session });
  const extension = createExtensionTransport({ bridge: getExtensionBridge });
  if (kind === "proxy") return proxy;
  if (kind === "extensie") return extension;
  const current = () => (transportFor(session()?.method) === "extensie" ? extension : proxy);
  return {
    get kind() {
      return current().kind;
    },
    get: (path, query) => current().get(path, query),
  };
}
