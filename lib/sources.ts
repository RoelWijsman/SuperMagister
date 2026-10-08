/**
 * Alles wat per databron wordt opgeslagen, staat onder het id van die bron:
 * "magister:{school}:{persoon}" (met ":{schooljaar}" voor een ouder jaar).
 * Zo lopen accounts en jaren nooit door elkaar en kan ontkoppelen precies
 * je echte gegevens wissen.
 */
export const isMagisterSource = (sourceId: string) => sourceId.startsWith("magister:");

/** Een kopie zonder de bronnen die `match` aanwijst. */
export function withoutSources<T>(
  record: Readonly<Record<string, T>>,
  match: (sourceId: string) => boolean,
): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([sourceId]) => !match(sourceId)));
}
