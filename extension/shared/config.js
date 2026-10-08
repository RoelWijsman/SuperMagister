// @ts-check
/**
 * Waar de app draait. Dit is de ontwikkelversie (localhost). `npm run
 * extension:zip` zet hier voor de Web Store het echte adres neer en haalt
 * localhost weg.
 */
(function (root) {
  const SM = (root.SM = root.SM || {});

  SM.CONFIG = Object.freeze({
    appUrl: "http://localhost:3000",
    /** Alleen deze adressen tellen als de app. */
    appOrigins: Object.freeze(["http://localhost:3000", "http://localhost:3100"]),
  });

  /** @param {string | undefined | null} origin */
  SM.isAppOrigin = function (origin) {
    return typeof origin === "string" && SM.CONFIG.appOrigins.includes(origin);
  };
})(globalThis);
