// @ts-check
/**
 * Het berichtformaat tussen de SuperMagister-app en de extensie (via
 * window.postMessage op de pagina van de app). Vast formaat met een
 * versienummer; alles wat er niet precies zo uitziet, wordt genegeerd.
 *
 * App → extensie: { source: "supermagister-app", version: 1, id, type, payload }
 * Extensie → app: { source: "supermagister-extensie", version: 1, type, id?, payload? }
 *
 * Dezelfde waarden staan in lib/extensie/protocol.ts; een test bewaakt dat.
 */
(function (root) {
  const SM = (root.SM = root.SM || {});

  SM.PROTOCOL = Object.freeze({
    VERSION: 1,
    APP: "supermagister-app",
    EXTENSION: "supermagister-extensie",
  });

  /** Wat de app mag vragen. */
  SM.APP_REQUESTS = Object.freeze([
    "ping",
    "status",
    "get",
    "vernieuw",
    "ontkoppel",
    "hervat",
    "pack",
  ]);

  /** Wat de extensie de app kan sturen. */
  SM.EXTENSION_MESSAGES = Object.freeze(["aanwezig", "antwoord", "status", "ontkoppeld"]);

  /** @param {unknown} data */
  SM.isAppMessage = function (data) {
    if (!data || typeof data !== "object") return false;
    const message = /** @type {Record<string, unknown>} */ (data);
    return (
      message.source === SM.PROTOCOL.APP &&
      message.version === SM.PROTOCOL.VERSION &&
      typeof message.id === "string" &&
      message.id.length > 0 &&
      message.id.length <= 64 &&
      typeof message.type === "string" &&
      SM.APP_REQUESTS.includes(message.type)
    );
  };
})(globalThis);
