/** De vitrine (§12): je vijf favoriete kaarten, in de volgorde waarin je ze koos. */
export const SHOWCASE_SIZE = 5;

export type ShowcaseResult = "toegevoegd" | "weg" | "vol";

export function toggleShowcase(
  ids: readonly string[],
  id: string,
): { ids: string[]; result: ShowcaseResult } {
  if (ids.includes(id)) return { ids: ids.filter((other) => other !== id), result: "weg" };
  if (ids.length >= SHOWCASE_SIZE) return { ids: [...ids], result: "vol" };
  return { ids: [...ids, id], result: "toegevoegd" };
}

/** Alleen kaarten die nog in je collectie zitten, zonder dubbele. */
export function cleanShowcase(ids: readonly string[], collection: ReadonlySet<string>): string[] {
  return [...new Set(ids)].filter((id) => collection.has(id));
}
