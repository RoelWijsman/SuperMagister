// @ts-check
/**
 * Teksten van de extensie, volgens de humorbijbel (docs/aanvulling.md): droog,
 * maximaal één emoji, vijf varianten waar het een situatie is, nooit twee keer
 * achter elkaar dezelfde. De vaste regels (status, knoppen) staan in de popup.
 */
(function (root) {
  const SM = (root.SM = root.SM || {});

  SM.TEKSTEN = Object.freeze({
    /** Onder "Gekoppeld met {school} · vernieuwt automatisch". */
    gekoppeld: [
      "Je token wordt vers gehouden. Jij hoeft niks.",
      "Magister ververst, wij kijken mee.",
      "Alles loopt. Zelfs de schoolwifi zou jaloers zijn.",
      "Hier gebeurt niks spannends. Precies de bedoeling.",
      "Gekoppeld. Ga maar huiswerk maken. Of niet, wij zeggen niks.",
    ],
    /** Onder "Niet gekoppeld: open Magister en log in". */
    nietGekoppeld: [
      "Eén keer inloggen bij Magister. De rest doen wij.",
      "We wachten. Net als bij de kopieermachine.",
      "Log in bij Magister, dan koppelt hij vanzelf.",
      "Nog niks. Magister moet eerst weten wie je bent.",
      "Open Magister. Dit is de makkelijkste stap van je dag.",
    ],
    /** Na ontkoppelen. */
    ontkoppeld: [
      "Ontkoppeld. Je token is weg, je wachtwoord was er nooit.",
      "Uit. Hij koppelt pas weer als jij dat zegt.",
      "Ontkoppeld. Rustig hier, hè.",
      "Niks meer gekoppeld. Netjes opgeruimd.",
      "Ontkoppeld. De extensie wacht geduldig. Dat kan hij goed.",
    ],
    /** Melding als Magister je opnieuw wil laten inloggen. */
    inloggen: [
      "Je Magister-sessie is verlopen. Log in, dan koppelt SuperMagister weer vanzelf.",
      "Magister wil je even terugzien. Eén keer inloggen en we kunnen weer.",
      "Ook Magister moet af en toe checken of jij het echt bent. Tik hier.",
      "Sessie op. Log in bij Magister en de rest gaat vanzelf.",
      "Magister is je even vergeten. Gebeurt de beste. Tik om in te loggen.",
    ],
    /** Melding bij een nieuw pack (alleen als je dat aanzet). */
    pack: [
      "Je docent heeft nagekeken. Jij nog niet gekeken.",
      "Er zit iets in. De gloed verraadt het al.",
      "Nieuwe cijfers. Open ze als je er klaar voor bent. Of nu.",
      "Ingevoerd door je docent, ingepakt door ons.",
      "Negeren lukt niemand. Probeer het maar.",
    ],
  });

  /** @type {Record<string, number>} */
  const last = {};

  /**
   * Kiest een variant, nooit dezelfde als de vorige keer.
   * @param {keyof typeof SM.TEKSTEN} key
   * @param {() => number} [random]
   */
  SM.pickTekst = function (key, random = Math.random) {
    const variants = SM.TEKSTEN[key];
    let index = Math.floor(random() * variants.length);
    if (variants.length > 1 && index === last[key]) index = (index + 1) % variants.length;
    last[key] = index;
    return variants[index];
  };
})(globalThis);
