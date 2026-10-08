// @ts-check
/**
 * Wanneer de extensie het token zelf vernieuwt. Het vernieuwen zelf (een
 * onzichtbaar tabblad met Magister openen) zit in background.js; hier staan
 * alleen de regels, zodat ze te testen zijn:
 * - vernieuwen als het token binnen 5 minuten verloopt, of al verlopen is;
 * - hooguit één poging per 10 minuten, nooit in een lus;
 * - op de inlogpagina van Magister niet opnieuw proberen, maar melden.
 */
(function (root) {
  const SM = (root.SM = root.SM || {});

  SM.RENEW_BEFORE_MS = 5 * 60_000;
  SM.RENEW_INTERVAL_MS = 10 * 60_000;
  /** Zo lang wachten we op het nieuwe token in het onzichtbare tabblad. */
  SM.RENEW_TIMEOUT_MS = 45_000;

  /**
   * @param {{ expiresAt: number | null } | null} session
   * @param {number} now
   */
  SM.needsRenewal = function (session, now) {
    if (!session) return true;
    if (session.expiresAt === null) return false;
    return session.expiresAt - now <= SM.RENEW_BEFORE_MS;
  };

  /**
   * @param {number | null | undefined} lastAttempt
   * @param {number} now
   */
  SM.mayRenew = function (lastAttempt, now) {
    return typeof lastAttempt !== "number" || now - lastAttempt >= SM.RENEW_INTERVAL_MS;
  };

  /** @param {string | undefined} url */
  SM.isLoginPage = function (url) {
    if (!url) return false;
    try {
      return new URL(url).hostname === SM.LOGIN_HOST;
    } catch {
      return false;
    }
  };

  /** De startpagina van je eigen Magister. */
  SM.magisterUrl = function (/** @type {string} */ schoolHost) {
    return `https://${schoolHost}/magister/#/vandaag`;
  };
})(globalThis);
