import {
  assertSession,
  MagisterError,
  type MagisterSession,
  type MagisterTransport,
} from "./transport";

/**
 * Alleen voor het bouwen en testen: doet alsof het Magister is, met de
 * geanonimiseerde testbestanden uit __fixtures__ (Daan Visser, "voorbeeld").
 * Zo is de hele route voor echte data te testen (cache, welkomstpack,
 * verlopen token, ontkoppelen) zonder echt account. Controleert de sessie net
 * als de proxy, zodat ook verlopen en opnieuw koppelen te zien zijn.
 */

type Items = { Items: { Start?: string }[] };

/** De bestanden laden pas als je de voorbeeldkoppeling echt gebruikt. */
const load = async () => ({
  account: (await import("./__fixtures__/account.json")).default,
  aanmeldingen: (await import("./__fixtures__/aanmeldingen.json")).default,
  vakken: (await import("./__fixtures__/vakken.json")).default,
  vakken2526: (await import("./__fixtures__/vakken-2526.json")).default,
  cijfers: (await import("./__fixtures__/cijfers-2627.json")).default,
  cijfers2526: (await import("./__fixtures__/cijfers-2526.json")).default,
  perioden: (await import("./__fixtures__/cijferperioden.json")).default,
  perioden2526: (await import("./__fixtures__/cijferperioden-2526.json")).default,
  overzicht: (await import("./__fixtures__/cijferoverzicht.json")).default,
  laatste: (await import("./__fixtures__/cijfers-laatste.json")).default,
  afspraken: (await import("./__fixtures__/afspraken.json")).default as Items,
  afsprakenExtra: (await import("./__fixtures__/afspraken-extra.json")).default as Items,
  wijzigingen: (await import("./__fixtures__/roosterwijzigingen.json")).default as Items,
  absenties: (await import("./__fixtures__/absenties.json")).default as Items,
});

const CURRENT = "1014";
const LAST_YEAR = "1011";

function inRange(data: Items, query?: Readonly<Record<string, unknown>>): Items {
  const from = String(query?.van ?? "");
  const to = String(query?.tot ?? "9999");
  return {
    ...data,
    Items: data.Items.filter((item) => {
      // Magister zet middernacht als 22:00 UTC de dag ervoor: lokaal rekenen.
      const day = item.Start ? new Date(item.Start).toLocaleDateString("sv-SE") : "";
      return day >= from && day <= to;
    }),
  };
}

export function createFixtureTransport({
  session,
  delayMs = 350,
}: {
  session: () => MagisterSession | null;
  delayMs?: number;
}): MagisterTransport {
  return {
    kind: "voorbeeld",
    async get<T>(path: string, query?: Readonly<Record<string, unknown>>): Promise<T> {
      assertSession(session());
      const [data] = await Promise.all([load(), new Promise((r) => setTimeout(r, delayMs))]);
      const year = /aanmeldingen\/(\d+)/.exec(path)?.[1];
      const pick = (current: unknown, last: unknown) =>
        year === CURRENT ? current : year === LAST_YEAR ? last : undefined;
      let answer: unknown;
      if (path === "account") answer = data.account;
      else if (/^personen\/\d+\/aanmeldingen$/.test(path)) answer = data.aanmeldingen;
      else if (path.endsWith("/vakken")) answer = pick(data.vakken, data.vakken2526);
      else if (/^aanmeldingen\/\d+\/cijfers$/.test(path))
        answer = pick(data.cijfers, data.cijfers2526);
      else if (path.endsWith("cijferperiodenvooraanmelding"))
        answer = pick(data.perioden, data.perioden2526);
      else if (path.endsWith("cijferoverzichtvooraanmelding"))
        answer = pick(data.overzicht, { Items: [] });
      else if (path.endsWith("/cijfers/laatste")) answer = data.laatste;
      else if (path.endsWith("/afspraken"))
        answer = inRange({ Items: [...data.afspraken.Items, ...data.afsprakenExtra.Items] }, query);
      else if (path.endsWith("/roosterwijzigingen")) answer = inRange(data.wijzigingen, query);
      else if (path.endsWith("/absenties")) answer = inRange(data.absenties, query);
      if (answer === undefined)
        throw new MagisterError("niet-gevonden", "Magister kent deze gegevens niet (meer).", 404);
      return structuredClone(answer) as T;
    },
  };
}
