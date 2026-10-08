/**
 * Het berichtformaat tussen de app en de browserextensie (fase 5c), via
 * window.postMessage op de eigen pagina. Moet precies gelijk zijn aan
 * extension/shared/protocol.js; een test bewaakt dat.
 */
export const PROTOCOL = {
  VERSION: 1,
  APP: "supermagister-app",
  EXTENSION: "supermagister-extensie",
} as const;

export const APP_REQUESTS = [
  "ping",
  "status",
  "get",
  "vernieuw",
  "ontkoppel",
  "hervat",
  "pack",
] as const;
export type AppRequest = (typeof APP_REQUESTS)[number];

export const EXTENSION_MESSAGES = ["aanwezig", "antwoord", "status", "ontkoppeld"] as const;
export type ExtensionMessageType = (typeof EXTENSION_MESSAGES)[number];

export interface ExtensionMessage {
  source: typeof PROTOCOL.EXTENSION;
  version: typeof PROTOCOL.VERSION;
  type: ExtensionMessageType;
  id?: string;
  payload?: unknown;
}

/** Hoe de extensie ervoor staat. Het token zelf komt nooit in de app. */
export interface ExtensionStatus {
  linked: boolean;
  schoolHost: string | null;
  expiresAt: number | null;
  /** Na ontkoppelen koppelt de extensie niet vanzelf opnieuw. */
  paused: boolean;
  /** Magister vraagt om opnieuw inloggen (de extensie meldt dat zelf). */
  needsLogin: boolean;
  renewing: boolean;
  /** Wanneer je via de extensie ontkoppelde (ms), of null. */
  unlinkedAt: number | null;
  /** Het Magister-persoon-id bij dit token, zodra de extensie het weet. */
  personId?: number | null;
  version: string;
}

export function isExtensionMessage(data: unknown): data is ExtensionMessage {
  if (!data || typeof data !== "object") return false;
  const message = data as Record<string, unknown>;
  return (
    message.source === PROTOCOL.EXTENSION &&
    message.version === PROTOCOL.VERSION &&
    typeof message.type === "string" &&
    (EXTENSION_MESSAGES as readonly string[]).includes(message.type)
  );
}

export function isExtensionStatus(value: unknown): value is ExtensionStatus {
  if (!value || typeof value !== "object") return false;
  const status = value as Record<string, unknown>;
  return (
    typeof status.linked === "boolean" &&
    (status.schoolHost === null || typeof status.schoolHost === "string") &&
    (status.expiresAt === null || typeof status.expiresAt === "number") &&
    typeof status.paused === "boolean" &&
    typeof status.needsLogin === "boolean"
  );
}
