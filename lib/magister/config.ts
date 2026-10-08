import { createFixtureTransport } from "./fixture-transport";
import {
  createExtensionTransport,
  createProxyTransport,
  type MagisterSession,
  type MagisterTransport,
  type TransportKind,
} from "./transport";

/**
 * De enige plek waar je kiest hoe SuperMagister bij Magister komt. Wissel dit
 * naar "extensie" zodra de browserextensie er is; de rest van de app merkt
 * daar niets van. ("voorbeeld" is alleen voor het testen met de testbestanden.)
 */
export const TRANSPORT: TransportKind = "proxy";

export function createTransport(
  session: () => MagisterSession | null,
  kind: TransportKind = TRANSPORT,
): MagisterTransport {
  if (kind === "voorbeeld") return createFixtureTransport({ session });
  return kind === "extensie" ? createExtensionTransport() : createProxyTransport({ session });
}
