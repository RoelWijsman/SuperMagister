// @ts-check
/** De popup: hoe de koppeling ervoor staat, je pack, en drie knoppen. */
(function () {
  const SM = /** @type {any} */ (globalThis).SM;
  const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));

  /** @type {any} */
  let current = null;

  const schoolName = (/** @type {string | null} */ host) => {
    const label = (host ?? "").split(".")[0] ?? "";
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : "je school";
  };

  /** @param {string} type @param {unknown} [payload] */
  const ask = (type, payload) => chrome.runtime.sendMessage({ kind: "popup", type, payload });

  /** @param {any} status */
  function render(status) {
    current = status;
    const dot = $("dot");
    const state = $("state");
    const quip = $("quip");
    if (status.linked) {
      dot.className = "dot good";
      state.textContent = `Gekoppeld met ${schoolName(status.schoolHost)} · vernieuwt automatisch`;
      quip.textContent = SM.pickTekst("gekoppeld");
    } else if (status.paused) {
      dot.className = "dot";
      state.textContent = "Ontkoppeld";
      quip.textContent = SM.pickTekst("ontkoppeld");
    } else if (status.needsLogin) {
      dot.className = "dot warn";
      state.textContent = "Log even opnieuw in bij Magister";
      quip.textContent = SM.pickTekst("inloggen");
    } else {
      dot.className = "dot bad";
      state.textContent = "Niet gekoppeld: open Magister en log in";
      quip.textContent = SM.pickTekst("nietGekoppeld");
    }

    const count = Number(status.badge) || 0;
    $("pack").hidden = count === 0;
    $("pack-text").textContent =
      `${count} nieuwe ${count === 1 ? "cijfer" : "cijfers"} · open je pack`;

    $("unlink").hidden = !status.linked && !status.schoolHost;
    $("resume").hidden = !status.paused;
    if (status.paused) $("unlink").hidden = true;
    /** @type {HTMLInputElement} */ ($("melding")).checked = status.melding === true;
  }

  /** @param {string} url */
  async function open(url) {
    await chrome.tabs.create({ url, active: true });
    window.close();
  }

  $("open-app").addEventListener("click", () => open(`${current?.appUrl ?? ""}/vandaag`));
  $("open-pack").addEventListener("click", () => open(`${current?.appUrl ?? ""}/vandaag`));
  $("open-magister").addEventListener("click", () =>
    open(
      current?.schoolHost ? SM.magisterUrl(current.schoolHost) : "https://accounts.magister.net/",
    ),
  );
  $("unlink").addEventListener("click", async () => render(await ask("ontkoppel")));
  $("resume").addEventListener("click", async () => render(await ask("hervat")));
  $("melding").addEventListener("change", async (event) =>
    render(await ask("melding", /** @type {HTMLInputElement} */ (event.target).checked)),
  );

  ask("status").then(render);
})();
