import type { LinkMethod } from "@/lib/koppelen/session";
import { createFixtureTransport } from "./fixture-transport";
import {
  createProxyTransport,
  type MagisterSession,
  type MagisterTransport,
  type TransportKind,
} from "./transport";

/**
 * De enige plek waar gekozen wordt hoe SuperMagister bij Magister komt: via
 * de eigen proxy. ("voorbeeld" is alleen voor het testen met de testbestanden.)
 */
export function transportFor(method: LinkMethod | undefined): TransportKind {
  return method === "voorbeeld" ? "voorbeeld" : "proxy";
}

type SessionWithMethod = MagisterSession & { method?: LinkMethod };

export function createTransport(
  session: () => SessionWithMethod | null,
  kind: TransportKind = "proxy",
): MagisterTransport {
  return kind === "voorbeeld"
    ? createFixtureTransport({ session })
    : createProxyTransport({ session });
}
