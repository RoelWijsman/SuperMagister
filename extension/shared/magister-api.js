// @ts-check
/**
 * Magister-verzoeken vanuit de extensie (de background), in plaats van via de
 * proxy van de app. Dezelfde regels als de proxy: alleen GET, alleen
 * {school}.magister.net/api/…, paden alleen letters, cijfers, - en _, alleen
 * het token en Accept als headers, geen doorverwijzingen volgen, nooit loggen.
 * Fouten krijgen dezelfde codes als de proxy, zodat de app ze al kent.
 */
(function (root) {
  const SM = (root.SM = root.SM || {});

  SM.SAFE_PATH = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;
  SM.TIMEOUT_MS = 15_000;

  /**
   * @param {unknown} query
   * @returns {string | null} null bij een ongeldige query
   */
  function queryString(query) {
    if (query === undefined || query === null) return "";
    if (typeof query !== "object") return null;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (!/^[A-Za-z0-9_]+$/.test(key)) return null;
      if (!["string", "number", "boolean"].includes(typeof value)) return null;
      params.set(key, String(value));
    }
    const text = params.toString();
    return text ? `?${text}` : "";
  }

  /**
   * @param {{
   *   fetch: typeof fetch,
   *   session: { token: string, schoolHost: string } | null,
   *   path: unknown,
   *   query?: unknown,
   *   timeoutMs?: number,
   * }} request
   * @returns {Promise<{ ok: true, data: unknown } | { ok: false, fout: string, status?: number, opnieuwNa?: number }>}
   */
  SM.magisterGet = async function ({ fetch, session, path, query, timeoutMs = SM.TIMEOUT_MS }) {
    if (!session) return { ok: false, fout: "geen-sessie" };
    if (!SM.isSchoolHost(session.schoolHost)) return { ok: false, fout: "ongeldige-school" };
    if (typeof path !== "string" || !SM.SAFE_PATH.test(path))
      return { ok: false, fout: "ongeldig-pad" };
    const search = queryString(query);
    if (search === null) return { ok: false, fout: "ongeldig-pad" };

    /** @type {Response} */
    let response;
    try {
      response = await fetch(`https://${session.schoolHost}/api/${path}${search}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${session.token}`, Accept: "application/json" },
        credentials: "omit",
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const name = error && typeof error === "object" && "name" in error ? error.name : "";
      return { ok: false, fout: name === "TimeoutError" ? "timeout" : "netwerk" };
    }

    const status = response.status;
    // Een doorverwijzing (naar de inlogpagina) betekent: sessie verlopen.
    if (response.type === "opaqueredirect" || status === 401 || (status >= 300 && status < 400))
      return { ok: false, fout: "verlopen", status: 401 };
    if (status === 403) return { ok: false, fout: "geen-toegang", status };
    if (status === 404) return { ok: false, fout: "niet-gevonden", status };
    if (status === 429) {
      const retry = Number(response.headers.get("retry-after"));
      return {
        ok: false,
        fout: "te-vaak",
        status,
        ...(Number.isFinite(retry) && retry > 0 ? { opnieuwNa: retry } : {}),
      };
    }
    if (!response.ok) return { ok: false, fout: "magister-plat", status: 502 };
    try {
      return { ok: true, data: await response.json() };
    } catch {
      return { ok: false, fout: "ongeldig-antwoord", status: 502 };
    }
  };
})(globalThis);
