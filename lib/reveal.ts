/**
 * Welke cijfers zijn al onthuld? Nieuwe cijfers vormen samen een "pack" dat je
 * met een walkout opent (fase 2). Hier alleen de pure logica; de opslag in
 * IndexedDB zit in stores/reveal.ts.
 */

/** Bij de allereerste keer: alles is al gezien, behalve het startpack. */
export function initialRevealedIds(
  allGradeIds: readonly string[],
  packIds: readonly string[],
): string[] {
  const pack = new Set(packIds);
  return allGradeIds.filter((id) => !pack.has(id));
}

/** Het welkomstpack bij de eerste koppeling: zoveel cijfers. */
export const WELCOME_PACK_SIZE = 5;

/**
 * De laatste vijf ingevoerde cijfers, nieuwste eerst. Inhalen en
 * vrijstellingen zijn geen cijfers en tellen niet mee.
 */
export function welcomePackIds(
  grades: readonly { id: string; enteredAt: string; kind: string; value: unknown }[],
  size = WELCOME_PACK_SIZE,
): string[] {
  return grades
    .filter((g) => !(g.kind === "text" && (g.value === "INH" || g.value === "VR")))
    .sort((a, b) => b.enteredAt.localeCompare(a.enteredAt))
    .slice(0, size)
    .map((g) => g.id);
}

/**
 * Cijfers uit eerdere schooljaren zijn nooit een nieuw pack (ook niet als ze
 * pas later binnenkomen), behalve als ze in het welkomstpack zitten.
 */
export function withHistoryRevealed(
  revealed: ReadonlySet<string> | null,
  historyIds: readonly string[],
  packIds: readonly string[],
): ReadonlySet<string> | null {
  if (!revealed) return null;
  if (historyIds.length === 0) return revealed;
  const pack = new Set(packIds);
  const effective = new Set(revealed);
  for (const id of historyIds) if (!pack.has(id)) effective.add(id);
  return effective;
}

/** Nog niet onthulde cijfers, oudste eerst. Leeg zolang de opslag nog laadt. */
export function unrevealedGrades<T extends { id: string; enteredAt: string }>(
  grades: readonly T[],
  revealed: ReadonlySet<string> | null,
): T[] {
  if (!revealed) return [];
  return grades
    .filter((grade) => !revealed.has(grade.id))
    .sort((a, b) => a.enteredAt.localeCompare(b.enteredAt));
}
