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
 * daar niets van.
 */
export const TRANSPORT: TransportKind = "proxy";

export function createTransport(
  session: () => MagisterSession | null,
  kind: TransportKind = TRANSPORT,
): MagisterTransport {
  return kind === "extensie" ? createExtensionTransport() : createProxyTransport({ session });
}
