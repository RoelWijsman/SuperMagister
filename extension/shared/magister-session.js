// @ts-check
/**
 * Je Magister-sessie vinden, precies zoals de bookmarklet (fase 5b): eerst de
 * sessionStorage-sleutel die begint met "oidc.user:", anders elke sleutel in
 * sessionStorage en localStorage met een access_token. Alleen op
 * {school}.magister.net, nooit op accounts.magister.net (de inlogpagina).
 * Leest alleen; logt niets.
 */
(function (root) {
  const SM = (root.SM = root.SM || {});

  SM.SCHOOL_HOST = /^[a-z0-9-]+\.magister\.net$/;
  SM.TOKEN_PATTERN = /^[A-Za-z0-9._~+/=-]{20,8192}$/;
  SM.LOGIN_HOST = "accounts.magister.net";

  /** @param {string} host */
  SM.isSchoolHost = function (host) {
    return SM.SCHOOL_HOST.test(host) && host !== SM.LOGIN_HOST;
  };

  /** Magister geeft expires_at in seconden; wij rekenen in milliseconden. */
  SM.toExpiresAt = function (/** @type {unknown} */ value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return null;
    return number < 1e12 ? Math.round(number * 1000) : Math.round(number);
  };

  /**
   * @param {Storage | null | undefined} store
   * @param {boolean} oidcOnly
   */
  function find(store, oidcOnly) {
    if (!store) return null;
    try {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key || (oidcOnly && !key.startsWith("oidc.user:"))) continue;
        try {
          const value = JSON.parse(store.getItem(key) || "null");
          if (value && typeof value.access_token === "string") return value;
        } catch {
          // Geen JSON: volgende sleutel.
        }
      }
    } catch {
      // Opslag niet bereikbaar.
    }
    return null;
  }

  /**
   * @param {{ hostname: string, sessionStorage?: Storage | null, localStorage?: Storage | null, now: number }} env
   * @returns {{ sessie: { token: string, expiresAt: number | null, schoolHost: string } } | { fout: "geen-school" | "geen-sessie" | "ongeldig" | "verlopen" }}
   */
  SM.findMagisterSession = function ({ hostname, sessionStorage, localStorage, now }) {
    if (!SM.isSchoolHost(hostname)) return { fout: "geen-school" };
    const user =
      find(sessionStorage, true) || find(sessionStorage, false) || find(localStorage, false);
    if (!user) return { fout: "geen-sessie" };
    return SM.checkSession(
      {
        token: user.access_token,
        expiresAt: SM.toExpiresAt(user.expires_at),
        schoolHost: hostname,
      },
      now,
    );
  };

  /**
   * Controleert een sessie (ook als die van een content script komt).
   * @param {unknown} value
   * @param {number} now
   */
  SM.checkSession = function (value, now) {
    if (!value || typeof value !== "object") return { fout: /** @type {const} */ ("ongeldig") };
    const { token, expiresAt, schoolHost } = /** @type {Record<string, unknown>} */ (value);
    if (typeof schoolHost !== "string" || !SM.isSchoolHost(schoolHost))
      return { fout: /** @type {const} */ ("geen-school") };
    if (typeof token !== "string" || !SM.TOKEN_PATTERN.test(token))
      return { fout: /** @type {const} */ ("ongeldig") };
    if (expiresAt !== null && (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)))
      return { fout: /** @type {const} */ ("ongeldig") };
    if (expiresAt !== null && expiresAt <= now) return { fout: /** @type {const} */ ("verlopen") };
    return { sessie: { token, expiresAt, schoolHost } };
  };
})(globalThis);
