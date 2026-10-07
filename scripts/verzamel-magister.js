/*
 * SuperMagister: verzamel voorbeelden uit Magister (alleen voor je EIGEN account).
 *
 * Plak dit in de console (F12 > Console) terwijl je bent ingelogd op
 * https://{jouwschool}.magister.net. Het script:
 *
 *  1. zoekt je token in sessionStorage (key met "oidc.user:", of anders een
 *     waarde met access_token) en gebruikt het ALLEEN binnen dit script;
 *  2. haalt account, aanmeldingen, laatste cijfers, cijferoverzicht, perioden,
 *     vakken, afspraken (8 weken terug tot 4 weken vooruit), opdrachten en
 *     absenties op, plus de cijfers per schooljaar (en de links daarin, alleen
 *     binnen /api/), rustig na elkaar, met per endpoint de bekende varianten;
 *  3. noteert bij een mislukking de URL en de status, en gaat gewoon door;
 *  4. downloadt alles als magister-export-<datum>.json, met een rapport.
 *
 * Het token, de refresh/id-tokens en je cookies komen NOOIT in de output: het
 * script leest geen cookies en haalt elk token dat toch in een antwoord staat
 * eruit voordat het bestand wordt gemaakt. Er gaat niets naar SuperMagister of
 * een andere server: alleen naar je eigen school.
 */
(async () => {
  "use strict";

  const STYLE = "color:#8b7bff;font-weight:bold";
  const say = (text) => console.log(`%cSuperMagister%c ${text}`, STYLE, "");
  const host = location.host;
  if (!/^[a-z0-9-]+\.magister\.net$/.test(host)) {
    console.error("Open dit script op je eigen school: https://{jouwschool}.magister.net");
    return;
  }

  // ——— Hulpjes ——————————————————————————————————————————————————————————
  const lookup = (source, name) => {
    if (!source || typeof source !== "object") return undefined;
    if (name in source) return source[name];
    const key = Object.keys(source).find((k) => k.toLowerCase() === name.toLowerCase());
    return key === undefined ? undefined : source[key];
  };
  const pick = (source, ...paths) => {
    for (const path of paths) {
      let current = source;
      for (const part of path.split(".")) current = lookup(current, part);
      if (current !== undefined && current !== null) return current;
    }
    return undefined;
  };
  const pad = (n) => String(n).padStart(2, "0");
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, days) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const countItems = (data) => {
    if (Array.isArray(data)) return data.length;
    const items = pick(data, "Items", "items", "value");
    return Array.isArray(items) ? items.length : null;
  };

  // ——— 1. Het token zoeken (alleen namen gaan in het rapport) ——————————————
  /** Zoekt in een object (ook genest) naar access_token. */
  const findTokenObject = (value, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 3) return null;
    if (typeof lookup(value, "access_token") === "string") return value;
    for (const inner of Object.values(value)) {
      const found = findTokenObject(inner, depth + 1);
      if (found) return found;
    }
    return null;
  };
  const tryParse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  let tokenInfo = null;
  const candidates = [
    ...Object.keys(sessionStorage)
      .filter((k) => k.startsWith("oidc.user:"))
      .map((k) => ["sessionStorage", sessionStorage, k]),
    ...Object.keys(sessionStorage).map((k) => ["sessionStorage", sessionStorage, k]),
    ...Object.keys(localStorage).map((k) => ["localStorage", localStorage, k]),
  ];
  for (const [store, storage, key] of candidates) {
    const raw = storage.getItem(key);
    if (!raw || !raw.includes("access_token")) continue;
    const tokenObject = findTokenObject(tryParse(raw));
    if (!tokenObject) continue;
    tokenInfo = { store, key, tokenObject };
    break;
  }
  if (!tokenInfo) {
    console.error(
      "Geen token gevonden in sessionStorage of localStorage. Ben je ingelogd? Herlaad Magister en probeer opnieuw.",
    );
    return;
  }

  const token = lookup(tokenInfo.tokenObject, "access_token");
  const expiresAt = Number(lookup(tokenInfo.tokenObject, "expires_at"));
  // Alles wat geheim is, om straks uit de output te halen.
  const secrets = ["access_token", "refresh_token", "id_token"]
    .map((name) => lookup(tokenInfo.tokenObject, name))
    .filter((value) => typeof value === "string" && value.length > 8);

  const report = {
    school: host,
    token: {
      opslag: tokenInfo.store,
      key: tokenInfo.key,
      bevatAccessToken: true,
      bevatExpiresAt: Number.isFinite(expiresAt),
      verlooptOverMinuten: Number.isFinite(expiresAt)
        ? Math.round((expiresAt * 1000 - Date.now()) / 60000)
        : null,
      tokenType: lookup(tokenInfo.tokenObject, "token_type") ?? null,
      velden: Object.keys(tokenInfo.tokenObject),
    },
    endpoints: [],
  };
  say(`Token gevonden in ${tokenInfo.store} onder "${tokenInfo.key}". Ophalen begint…`);

  // ——— 2. Ophalen, met varianten per endpoint ————————————————————————————
  const data = {};
  async function fetchFirst(name, paths) {
    const attempts = [];
    for (const path of paths) {
      const url = `https://${host}${path}`;
      let status = 0;
      let body = null;
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        status = response.status;
        if (response.ok) body = tryParse(await response.text());
      } catch {
        status = 0;
      }
      attempts.push({ url, status, items: body === null ? null : countItems(body) });
      await wait(350);
      if (body !== null) {
        data[name] = body;
        report.endpoints.push({
          naam: name,
          gelukt: true,
          url,
          status,
          items: countItems(body),
          pogingen: attempts,
        });
        say(`${name}: ${status} (${countItems(body) ?? "?"} items)`);
        return body;
      }
    }
    report.endpoints.push({ naam: name, gelukt: false, pogingen: attempts });
    console.warn(
      `SuperMagister ${name}: niet gelukt (${attempts.map((a) => a.status).join(", ")})`,
    );
    return null;
  }

  const today = new Date();
  const account = await fetchFirst("account", ["/api/account", "/api/account?noCache=0"]);
  await fetchFirst("sessie", ["/api/sessions/current"]);
  const personId = pick(account, "Persoon.Id", "Id");
  if (personId === undefined) {
    console.warn(
      "SuperMagister: geen persoon-id in het account gevonden; de rest wordt overgeslagen.",
    );
  } else {
    const p = `/api/personen/${personId}`;
    const enrollments = await fetchFirst("aanmeldingen", [
      `${p}/aanmeldingen?geenToekomstige=false`,
      `${p}/aanmeldingen`,
      `/api/leerlingen/${personId}/aanmeldingen`,
    ]);

    // De huidige aanmelding (schooljaar): vandaag tussen start en einde, anders de nieuwste.
    const list = Array.isArray(enrollments)
      ? enrollments
      : (pick(enrollments, "Items", "items") ?? []);
    const now = isoDate(today);
    const startOf = (a) => String(pick(a, "Start", "Begin", "start") ?? "").slice(0, 10);
    const endOf = (a) => String(pick(a, "Einde", "Eind", "einde") ?? "").slice(0, 10);
    const current =
      list.find((a) => startOf(a) <= now && now <= endOf(a)) ??
      [...list].sort((a, b) => startOf(b).localeCompare(startOf(a)))[0];
    const enrollmentId = pick(current, "Id", "id");
    report.huidigeAanmelding = current
      ? { id: enrollmentId ?? null, start: startOf(current), einde: endOf(current) }
      : null;

    await fetchFirst("laatsteCijfers", [
      `${p}/cijfers/laatste?top=50&skip=0`,
      `${p}/cijfers/laatste?top=50`,
      `/api/leerlingen/${personId}/cijfers/laatste?top=50`,
    ]);

    if (enrollmentId !== undefined) {
      const a = `${p}/aanmeldingen/${enrollmentId}`;
      await fetchFirst("cijferoverzicht", [
        `${a}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false`,
        `${a}/cijfers/cijferoverzichtvooraanmelding`,
        `${a}/cijfers?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false`,
      ]);
      await fetchFirst("cijferperioden", [
        `${a}/cijfers/cijferperiodenvooraanmelding`,
        `${a}/cijferperioden`,
      ]);
      await fetchFirst("vakken", [`${a}/vakken`, `/api/aanmeldingen/${enrollmentId}/vakken`]);
    }

    const van = isoDate(addDays(today, -56));
    const tot = isoDate(addDays(today, 28));
    await fetchFirst("afspraken", [
      `${p}/afspraken?van=${van}&tot=${tot}`,
      `${p}/afspraken?status=1&van=${van}&tot=${tot}`,
      `/api/leerlingen/${personId}/afspraken?van=${van}&tot=${tot}`,
    ]);
    await fetchFirst("roosterwijzigingen", [`${p}/roosterwijzigingen?van=${van}&tot=${tot}`]);
    await fetchFirst("opdrachten", [
      `${p}/opdrachten?skip=0&top=50&startdatum=${van}&einddatum=${tot}`,
      `${p}/opdrachten?skip=0&top=50`,
    ]);

    const fallbackStart =
      today.getMonth() >= 7 ? `${today.getFullYear()}-08-01` : `${today.getFullYear() - 1}-08-01`;
    const yearStart = report.huidigeAanmelding?.start || fallbackStart;
    await fetchFirst("absenties", [
      `${p}/absenties?van=${yearStart}&tot=${now}`,
      `/api/leerlingen/${personId}/absenties?van=${yearStart}&tot=${now}`,
    ]);

    // ——— Extra (versie 3): cijfers via de nieuwere API, per schooljaar ———————
    // Het oude cijferoverzicht bleek leeg; /cijfers/laatste verwijst naar
    // /api/aanmeldingen/{id}/cijfers ("voortgangscijfers"). Die proberen we
    // voor elk schooljaar, nieuwste eerst.
    const label = (a) => pick(a, "Lesperiode") ?? pick(a, "Id", "id");
    const newestFirst = [...list].sort((a, b) => startOf(b).localeCompare(startOf(a)));
    let richest = null;
    for (const a of newestFirst) {
      const aid = pick(a, "Id", "id");
      if (aid === undefined) continue;
      const body = await fetchFirst(`voortgangscijfers-${label(a)}`, [
        `/api/aanmeldingen/${aid}/cijfers`,
        `/api/aanmeldingen/${aid}/cijfers?top=500&skip=0`,
      ]);
      const count = countItems(body) ?? 0;
      if (count > (richest?.count ?? 0)) richest = { count, body };
    }

    // Volg de links in het rijkste antwoord (bijv. naar kolominformatie met de
    // weging). Alleen paden onder /api/ op deze school, hooguit twaalf.
    const hrefs = new Set();
    const collect = (value, depth = 0) => {
      if (!value || typeof value !== "object" || depth > 5 || hrefs.size >= 12) return;
      for (const [key, inner] of Object.entries(value)) {
        if (key.toLowerCase() === "href" && typeof inner === "string" && inner.startsWith("/api/"))
          hrefs.add(inner);
        else collect(inner, depth + 1);
      }
    };
    collect(pick(richest?.body, "items", "Items")?.slice(0, 20));
    data.gevolgdeLinks = [];
    for (const href of hrefs) {
      const body = await fetchFirst("link", [href]);
      data.gevolgdeLinks.push({ href, gelukt: body !== null, antwoord: body });
      delete data.link;
    }

    // Het oude overzicht voor de oudste schooljaren, voor de volledigheid.
    for (const a of newestFirst.slice(-2)) {
      const aid = pick(a, "Id", "id");
      if (aid === undefined) continue;
      await fetchFirst(`cijferoverzicht-${label(a)}`, [
        `${p}/aanmeldingen/${aid}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false`,
      ]);
    }
  }

  // ——— 3. Bestand maken, zonder tokens ———————————————————————————————————
  let text = JSON.stringify(
    { gemaakt: new Date().toISOString(), versie: 3, rapport: report, data },
    null,
    2,
  );
  let removed = 0;
  for (const secret of secrets) {
    while (text.includes(secret)) {
      text = text.replace(secret, "[TOKEN VERWIJDERD]");
      removed++;
    }
  }
  if (removed > 0) say(`${removed}× een token uit de antwoorden gehaald.`);

  const blob = new Blob([text], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `magister-export-${isoDate(today)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);

  console.table(
    report.endpoints.map((e) => ({
      endpoint: e.naam,
      gelukt: e.gelukt ? "ja" : "nee",
      status: e.gelukt ? e.status : e.pogingen.map((a) => a.status).join(", "),
      items: e.items ?? "",
    })),
  );
  console.log(
    "%cKlaar! Zet het bestand in de map magister-voorbeelden.",
    "color:#3fd6c4;font-size:16px;font-weight:bold",
  );
})();
