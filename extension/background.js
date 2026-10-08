// @ts-check
/**
 * De background van de SuperMagister-extensie (service worker, Manifest V3).
 *
 * - Bewaart je Magister-sessie in chrome.storage.session: alleen in het
 *   geheugen, weg als de browser sluit. Het token gaat nooit naar de app of een
 *   server, en wordt nooit gelogd.
 * - Doet de Magister-verzoeken voor de app (shared/magister-api.js).
 * - Vernieuwt het token zelf: een onzichtbaar tabblad met Magister, hooguit één
 *   poging per 10 minuten. Vraagt Magister om in te loggen, dan een melding.
 * - Elk kwartier (chrome.alarms): token vers houden en nieuwe cijfers tellen
 *   voor het getal op het icoon.
 */
importScripts(
  "shared/protocol.js",
  "shared/config.js",
  "shared/magister-session.js",
  "shared/magister-api.js",
  "shared/renew.js",
  "shared/badge.js",
  "shared/teksten.js",
);

const SM = /** @type {any} */ (globalThis).SM;
const VERSION = chrome.runtime.getManifest().version;
const ALARM = "sm-ververs";
const LOGIN_NOTIFICATION = "sm-inloggen";
const PACK_NOTIFICATION = "sm-pack";

/**
 * @typedef {{ token: string, expiresAt: number | null, schoolHost: string }} Sessie
 * @typedef {{ sessie?: Sessie, persoonId?: number, laatstePoging?: number, inloggenNodig?: boolean, inloggenTab?: number }} SessionState
 * @typedef {{ school?: string | null, gepauzeerd?: boolean, ontkoppeldOp?: number | null, melding?: boolean, appUrl?: string, packAantal?: number, nieuwsteGezien?: string | null, badge?: number, gemeld?: number }} LocalState
 */

// ——— Opslag ————————————————————————————————————————————————————————————

/** @returns {Promise<SessionState>} */
const sessionState = () => chrome.storage.session.get(null);
/** @returns {Promise<LocalState>} */
const localState = () => chrome.storage.local.get(null);

/** De sessie, maar alleen als hij nog bruikbaar is. */
async function usableSession() {
  const { sessie } = await sessionState();
  if (!sessie) return null;
  const checked = SM.checkSession(sessie, Date.now());
  return checked.sessie ? /** @type {Sessie} */ (checked.sessie) : null;
}

async function status() {
  const [session, local] = await Promise.all([sessionState(), localState()]);
  const sessie = session.sessie ?? null;
  const geldig = sessie ? Boolean(SM.checkSession(sessie, Date.now()).sessie) : false;
  return {
    linked: geldig,
    schoolHost: sessie?.schoolHost ?? local.school ?? null,
    expiresAt: geldig ? (sessie?.expiresAt ?? null) : null,
    paused: local.gepauzeerd === true,
    needsLogin: session.inloggenNodig === true,
    renewing: renewing !== null,
    unlinkedAt: local.ontkoppeldOp ?? null,
    personId: geldig ? (session.persoonId ?? null) : null,
    version: VERSION,
  };
}

/** Wie hoort bij dit token? (voor de app, en voor de badge) */
async function ensurePersonId() {
  const { persoonId } = await sessionState();
  if (persoonId) return persoonId;
  const sessie = await usableSession();
  if (!sessie) return null;
  const account = await SM.magisterGet({ fetch, session: sessie, path: "account" });
  const id = account.ok ? Number(account.data?.Persoon?.Id) : NaN;
  if (!Number.isFinite(id)) return null;
  await chrome.storage.session.set({ persoonId: id });
  return id;
}

// ——— Brug naar de app (poorten voor meldingen uit zichzelf) ——————————————

/** @type {Set<chrome.runtime.Port>} */
const ports = new Set();

/** @param {chrome.runtime.MessageSender | undefined} sender */
function originOf(sender) {
  if (!sender) return null;
  if (sender.origin) return sender.origin;
  try {
    return sender.url ? new URL(sender.url).origin : null;
  } catch {
    return null;
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "sm-app" || !SM.isAppOrigin(originOf(port.sender))) {
    port.disconnect();
    return;
  }
  ports.add(port);
  port.onDisconnect.addListener(() => ports.delete(port));
  status().then((current) => port.postMessage({ type: "status", status: current }));
});

/** @param {"status" | "ontkoppeld"} type */
async function broadcast(type = "status") {
  const current = await status();
  for (const port of ports) {
    try {
      port.postMessage({ type, status: current });
    } catch {
      ports.delete(port);
    }
  }
}

// ——— Badge en meldingen ————————————————————————————————————————————————

/** @param {number} count */
async function setBadge(count) {
  await chrome.storage.local.set({ badge: count });
  await chrome.action.setBadgeBackgroundColor({ color: "#9b7bff" });
  if (chrome.action.setBadgeTextColor) await chrome.action.setBadgeTextColor({ color: "#0b0a1a" });
  await chrome.action.setBadgeText({ text: SM.badgeText(count) });
}

async function appUrl() {
  const { appUrl: seen } = await localState();
  return seen && SM.isAppOrigin(seen) ? seen : SM.CONFIG.appUrl;
}

/** @param {string} url */
async function openActive(url) {
  const tab = await chrome.tabs.create({ url, active: true });
  if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
}

chrome.notifications.onClicked.addListener(async (id) => {
  chrome.notifications.clear(id);
  if (id === PACK_NOTIFICATION) {
    await openActive(`${await appUrl()}/vandaag`);
    return;
  }
  if (id === LOGIN_NOTIFICATION) {
    // Het onzichtbare tabblad staat al op de inlogpagina: laat het zien.
    const { inloggenTab } = await sessionState();
    const { school } = await localState();
    try {
      if (inloggenTab === undefined) throw new Error("geen tabblad");
      const tab = await chrome.tabs.update(inloggenTab, { active: true });
      if (tab?.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
    } catch {
      if (school) await openActive(SM.magisterUrl(school));
    }
  }
});

// ——— Vernieuwen ———————————————————————————————————————————————————————

/** @type {Promise<boolean> | null} */
let renewing = null;
/** Tabbladen waarin we op een nieuwe sessie wachten. @type {Map<number, (result: string) => void>} */
const waiters = new Map();

/** @param {number} tabId */
function waitForTab(tabId) {
  return new Promise((resolve) => {
    const done = (/** @type {string} */ result) => {
      clearTimeout(timer);
      clearInterval(keepAlive);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      waiters.delete(tabId);
      resolve(result);
    };
    /** @param {number} id @param {chrome.tabs.TabChangeInfo} change @param {chrome.tabs.Tab} tab */
    const onUpdated = (id, change, tab) => {
      if (id === tabId && SM.isLoginPage(change.url ?? tab.url)) done("inloggen");
    };
    /** @param {number} id */
    const onRemoved = (id) => {
      if (id === tabId) done("dicht");
    };
    const timer = setTimeout(() => done("time-out"), SM.RENEW_TIMEOUT_MS);
    // Houd de service worker wakker zolang we wachten.
    const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(), 20_000);
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    waiters.set(tabId, done);
  });
}

/** Vraag open Magister-tabbladen om hun sessie (Magister ververst die zelf). */
async function askOpenTabs(/** @type {string} */ school) {
  const tabs = await chrome.tabs.query({ url: `https://${school}/*` });
  await Promise.all(
    tabs.map((tab) =>
      tab.id === undefined
        ? undefined
        : chrome.tabs.sendMessage(tab.id, { type: "stuur-sessie" }).catch(() => undefined),
    ),
  );
  // De sessie komt als los bericht binnen; even de tijd geven.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const fresh = await usableSession();
  return fresh !== null && !SM.needsRenewal(fresh, Date.now());
}

async function doRenew() {
  const { school, gepauzeerd } = await localState();
  if (!school || gepauzeerd) return false;
  const now = Date.now();
  const { laatstePoging } = await sessionState();
  if (!SM.mayRenew(laatstePoging, now)) return false;
  await chrome.storage.session.set({ laatstePoging: now });

  if (await askOpenTabs(school)) return true;

  const tab = await chrome.tabs.create({ url: SM.magisterUrl(school), active: false });
  if (tab.id === undefined) return false;
  const result = await waitForTab(tab.id);
  if (result === "inloggen") {
    // Niet opnieuw proberen: melden, en het tabblad laten staan voor als je erop tikt.
    await chrome.storage.session.set({ inloggenNodig: true, inloggenTab: tab.id });
    chrome.notifications.create(LOGIN_NOTIFICATION, {
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: "Log even opnieuw in bij Magister",
      message: SM.pickTekst("inloggen"),
      priority: 1,
    });
    return false;
  }
  if (result !== "dicht") await chrome.tabs.remove(tab.id).catch(() => undefined);
  return result === "gelukt";
}

function renew() {
  if (!renewing) {
    renewing = doRenew()
      .catch(() => false)
      .finally(() => {
        renewing = null;
        broadcast();
      });
    broadcast();
  }
  return renewing;
}

/** Als de sessie (bijna) verlopen is: vernieuwen, binnen de regels. */
async function ensureFresh() {
  const { sessie } = await sessionState();
  if (sessie && !SM.needsRenewal(sessie, Date.now())) return true;
  return renew();
}

// ——— Ontkoppelen ———————————————————————————————————————————————————————

async function unlink() {
  await chrome.storage.session.clear();
  await chrome.storage.local.set({
    school: null,
    gepauzeerd: true,
    ontkoppeldOp: Date.now(),
    packAantal: 0,
    nieuwsteGezien: null,
    gemeld: 0,
  });
  await setBadge(0);
  chrome.notifications.clear(LOGIN_NOTIFICATION);
  chrome.notifications.clear(PACK_NOTIFICATION);
  await broadcast("ontkoppeld");
}

async function resume() {
  await chrome.storage.local.set({ gepauzeerd: false });
  // Staat Magister al open? Dan meteen koppelen.
  const tabs = await chrome.tabs.query({ url: "https://*.magister.net/*" });
  for (const tab of tabs)
    if (tab.id !== undefined)
      chrome.tabs.sendMessage(tab.id, { type: "stuur-sessie" }).catch(() => undefined);
  await broadcast();
}

// ——— Berichten ————————————————————————————————————————————————————————

/** Een sessie uit een content script op Magister. */
async function fromMagister(
  /** @type {any} */ message,
  /** @type {chrome.runtime.MessageSender} */ sender,
) {
  let host = "";
  try {
    host = new URL(sender.url ?? "").hostname;
  } catch {
    return { ok: false };
  }
  const checked = SM.checkSession(message.sessie, Date.now());
  // Alleen een sessie van de school waar het bericht vandaan komt.
  if (!checked.sessie || checked.sessie.schoolHost !== host) return { ok: false };
  const local = await localState();
  if (local.gepauzeerd) return { ok: true, genegeerd: true };

  const { sessie: previous } = await sessionState();
  const otherSchool = local.school && local.school !== host;
  if (otherSchool || (previous && previous.schoolHost !== host))
    await chrome.storage.session.remove("persoonId");
  await chrome.storage.session.set({ sessie: checked.sessie, inloggenNodig: false });
  await chrome.storage.local.set({
    school: host,
    ontkoppeldOp: null,
    ...(otherSchool ? { packAantal: 0, nieuwsteGezien: null, gemeld: 0, badge: 0 } : {}),
  });
  if (otherSchool) await setBadge(0);
  chrome.notifications.clear(LOGIN_NOTIFICATION);

  // Wachtte het vernieuwen op dit tabblad? Dan is het klaar.
  const tabId = sender.tab?.id;
  if (tabId !== undefined) waiters.get(tabId)?.("gelukt");

  if (!previous || previous.token !== checked.sessie.token) {
    await broadcast();
    // Daarna het persoon-id erbij, zodat de app weet of het hetzelfde account is.
    ensurePersonId().then(
      (id) => id && broadcast(),
      () => undefined,
    );
  }
  return { ok: true };
}

/** Een vraag van de app (via content/app.js). */
async function fromApp(/** @type {string} */ type, /** @type {any} */ payload) {
  switch (type) {
    case "ping":
      return { pong: true, versie: VERSION };
    case "status": {
      const current = await status();
      const { school, gepauzeerd } = await localState();
      // De app staat open: een ontbrekende of bijna verlopen sessie alvast vernieuwen
      // (binnen de regels: hooguit één poging per 10 minuten).
      if (school && !gepauzeerd) {
        const { sessie } = await sessionState();
        if (!sessie || SM.needsRenewal(sessie, Date.now())) renew();
      }
      return current;
    }
    case "get": {
      if (!payload || typeof payload !== "object") return { ok: false, fout: "ongeldig-pad" };
      if ((await localState()).gepauzeerd) return { ok: false, fout: "geen-sessie" };
      await ensureFresh();
      const sessie = await usableSession();
      const answer = await SM.magisterGet({
        fetch,
        session: sessie,
        path: payload.path,
        query: payload.query,
      });
      if (!answer.ok && answer.fout === "verlopen") {
        // Magister accepteert dit token niet meer: weggooien en (binnen de regels) vernieuwen.
        await chrome.storage.session.remove("sessie");
        renew();
      }
      return answer;
    }
    case "vernieuw":
      await ensureFresh();
      return status();
    case "ontkoppel":
      await unlink();
      return status();
    case "hervat":
      await resume();
      return status();
    case "pack": {
      const count = Number(payload?.count);
      const newestSeen = typeof payload?.newestSeen === "string" ? payload.newestSeen : null;
      if (!Number.isFinite(count) || count < 0) return { ok: false };
      await chrome.storage.local.set({
        packAantal: count,
        nieuwsteGezien: newestSeen,
        gemeld: count,
      });
      await setBadge(count);
      return { ok: true };
    }
    default:
      return { ok: false, fout: "onbekend" };
  }
}

/** Een vraag van de popup. */
async function fromPopup(/** @type {string} */ type, /** @type {any} */ payload) {
  switch (type) {
    case "status": {
      const local = await localState();
      return {
        ...(await status()),
        badge: local.badge ?? 0,
        melding: local.melding === true,
        appUrl: await appUrl(),
      };
    }
    case "ontkoppel":
      await unlink();
      return fromPopup("status", null);
    case "hervat":
      await resume();
      return fromPopup("status", null);
    case "melding":
      await chrome.storage.local.set({ melding: payload === true });
      return fromPopup("status", null);
    default:
      return { ok: false };
  }
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id || !message || typeof message !== "object") return false;
  /** @type {Promise<unknown>} */
  let answer;
  if (message.kind === "magister" && sender.tab) answer = fromMagister(message, sender);
  else if (message.kind === "app" && sender.tab && SM.isAppOrigin(originOf(sender))) {
    const origin = originOf(sender);
    if (origin) chrome.storage.local.set({ appUrl: origin });
    answer = fromApp(message.type, message.payload);
  } else if (message.kind === "popup" && !sender.tab && originOf(sender) === location.origin)
    answer = fromPopup(message.type, message.payload);
  else return false;
  answer.then(reply, () => reply({ ok: false, fout: "intern" }));
  return true; // Antwoord komt later.
});

// ——— Elk kwartier ———————————————————————————————————————————————————

async function checkGrades() {
  const sessie = await usableSession();
  if (!sessie) return;
  const persoonId = await ensurePersonId();
  if (!persoonId) return;
  const latest = await SM.magisterGet({
    fetch,
    session: sessie,
    path: `personen/${persoonId}/cijfers/laatste`,
    query: { top: 50, skip: 0 },
  });
  if (!latest.ok) {
    if (latest.fout === "verlopen") await chrome.storage.session.remove("sessie");
    return;
  }
  const local = await localState();
  const count = (local.packAantal ?? 0) + SM.countNewGrades(latest.data, local.nieuwsteGezien);
  await setBadge(count);
  if (local.melding && count > (local.gemeld ?? 0)) {
    chrome.notifications.create(PACK_NOTIFICATION, {
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: "Er staat een pack voor je klaar",
      message: SM.pickTekst("pack"),
    });
  }
  await chrome.storage.local.set({ gemeld: count });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;
  // Zonder koppeling in deze browsersessie doen we niets: geen tabbladen uit het niets.
  const { sessie } = await sessionState();
  if (!sessie || (await localState()).gepauzeerd) return;
  if (SM.needsRenewal(sessie, Date.now()) && !(await renew())) return;
  await checkGrades();
});

async function setup() {
  if (!(await chrome.alarms.get(ALARM)))
    await chrome.alarms.create(ALARM, { periodInMinutes: 15, delayInMinutes: 1 });
  const { badge } = await localState();
  await setBadge(badge ?? 0);
}

chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);
setup();
