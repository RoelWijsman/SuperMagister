// @ts-check
/**
 * De brug op de pagina van de SuperMagister-app. Geeft vragen van de app
 * (window.postMessage) door aan de background, en stuurt antwoorden en
 * statuswijzigingen terug. Alleen berichten van dit venster en dit domein, in
 * het vaste formaat (shared/protocol.js). Het token komt hier nooit langs.
 */
(function () {
  const SM = /** @type {any} */ (globalThis).SM;
  const { PROTOCOL } = SM;
  if (window.top !== window) return;

  /** @param {Record<string, unknown>} message */
  function post(message) {
    window.postMessage(
      { source: PROTOCOL.EXTENSION, version: PROTOCOL.VERSION, ...message },
      window.location.origin,
    );
  }

  /** @type {chrome.runtime.Port | null} */
  let port = null;
  let retries = 0;

  function connect() {
    try {
      port = chrome.runtime.connect({ name: "sm-app" });
    } catch {
      return; // De extensie is opnieuw geladen: deze pagina moet herladen.
    }
    retries = 0;
    port.onMessage.addListener((message) => {
      if (message && message.type === "status") post({ type: "status", payload: message.status });
      else if (message && message.type === "ontkoppeld")
        post({ type: "ontkoppeld", payload: message.status });
    });
    port.onDisconnect.addListener(() => {
      port = null;
      // De background slaapt soms in; dan opnieuw verbinden, steeds wat rustiger.
      if (retries < 20) setTimeout(connect, Math.min(30_000, 1000 * 2 ** retries++));
    });
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data;
    if (!SM.isAppMessage(data)) return;
    const answer = (/** @type {unknown} */ payload) =>
      post({ type: "antwoord", id: data.id, payload });
    try {
      chrome.runtime
        .sendMessage({ kind: "app", type: data.type, payload: data.payload })
        .then(answer, () => answer({ ok: false, fout: "geen-extensie" }));
    } catch {
      answer({ ok: false, fout: "geen-extensie" });
    }
  });

  post({ type: "aanwezig", payload: { versie: chrome.runtime.getManifest().version } });
  connect();
})();
