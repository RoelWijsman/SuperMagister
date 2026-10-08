// @ts-check
/**
 * Op je eigen Magister ({school}.magister.net): leest je sessie op dezelfde
 * manier als de bookmarklet (shared/magister-session.js) en geeft hem aan de
 * background, zodra Magister opent en elke keer dat Magister het token
 * ververst. Leest alleen; verandert niets aan Magister en logt niets.
 */
(function () {
  const SM = /** @type {any} */ (globalThis).SM;
  if (window.top !== window) return;

  let lastKey = "";
  let stopped = false;
  /** @type {ReturnType<typeof setInterval>[]} */
  const timers = [];

  function stop() {
    stopped = true;
    for (const timer of timers) clearInterval(timer);
  }

  /** @param {boolean} force */
  function send(force) {
    if (stopped) return false;
    const found = SM.findMagisterSession({
      hostname: window.location.hostname,
      sessionStorage: window.sessionStorage,
      localStorage: window.localStorage,
      now: Date.now(),
    });
    if (!found.sessie) return false;
    // Alleen bij een nieuw token (of op verzoek) iets sturen.
    const key = `${found.sessie.token.slice(-24)}:${found.sessie.expiresAt}`;
    if (!force && key === lastKey) return true;
    lastKey = key;
    try {
      chrome.runtime
        .sendMessage({ kind: "magister", type: "sessie", sessie: found.sessie })
        .catch(() => undefined);
    } catch {
      stop(); // De extensie is opnieuw geladen of verwijderd.
    }
    return true;
  }

  // Na het inloggen staat het token er pas na een paar tellen: eerst vaak kijken, daarna rustig.
  let checks = 0;
  timers.push(
    setInterval(() => {
      send(false);
      if (++checks >= 30) clearInterval(timers[0]);
    }, 2000),
  );
  timers.push(setInterval(() => send(false), 30_000));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") send(false);
  });

  // De background kan om een verse sessie vragen (bij het vernieuwen of na "weer koppelen").
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== chrome.runtime.id || !message || message.type !== "stuur-sessie") return;
    reply({ gevonden: send(true) });
  });

  send(false);
})();
