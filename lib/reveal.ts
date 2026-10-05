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
