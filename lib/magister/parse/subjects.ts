import { matchSubjectInfo } from "@/lib/subjects/catalog";
import type { Subject } from "@/lib/types";
import { arr, int, str } from "./fields";

/**
 * Magister zet zijn eigen berekeningen als "vak" in het cijferoverzicht
 * ("gemiddelde over alle vakken", "tekortpunten over alle vakken"). Dat zijn
 * geen echte vakken; we gebruiken ze wel om onze gemiddelden mee te vergelijken.
 */
export const isCalculatedSubject = (name: string | null) => /over alle vakken/i.test(name ?? "");

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Welke vakken een kolom in het cijferoverzicht hebben (dus cijfers kunnen krijgen). */
export function gradedSubjectCodes(overview: unknown): Set<string> {
  const codes = new Set<string>();
  for (const item of arr(overview, "Items")) {
    const code = str(item, "Vak.Afkorting", "Vak.Code");
    if (code && !isCalculatedSubject(str(item, "Vak.Omschrijving"))) codes.add(code.toLowerCase());
  }
  return codes;
}

/** De vakken van een schooljaar (camelCase-lijst van /vakken). */
export function parseSubjects(raw: unknown, graded: ReadonlySet<string>): Subject[] {
  const seen = new Set<string>();
  return arr(raw, "Items").flatMap((item): Subject[] => {
    const code = str(item, "afkorting", "Afkorting", "code");
    const rawName = str(item, "omschrijving", "Omschrijving", "naam");
    if (!code || isCalculatedSubject(rawName)) return [];
    const id = code.toLowerCase();
    if (seen.has(id)) return [];
    seen.add(id);
    const name = capitalize(rawName ?? code);
    const info = matchSubjectInfo(code, name);
    return [{ id, code, name, group: info.group, isCore: info.isCore, hasGrades: graded.has(id) }];
  });
}

/** Vak bij een afspraak: de code vooraan de omschrijving ("ak - DOC - 3h"), anders de naam. */
export function subjectIdFor(
  subjects: readonly Subject[],
  { description, names }: { description: string | null; names: readonly string[] },
): string | null {
  const prefix = description?.split(" - ")[0]?.trim().toLowerCase();
  if (prefix && subjects.some((s) => s.id === prefix)) return prefix;
  for (const name of names) {
    const match = subjects.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
    if (match) return match.id;
  }
  return null;
}

/**
 * Studievak-id → vakcode, uit /vakken van hetzelfde schooljaar. De cijfers uit
 * /aanmeldingen/{id}/cijfers noemen alleen het studievak-id. Magisters
 * rekenvakken ("over alle vakken") staan er niet in.
 */
export function studySubjectMap(raw: unknown): Map<number, string> {
  const map = new Map<number, string>();
  for (const item of arr(raw, "Items")) {
    const id = int(item, "studieVakId", "studievakId", "id");
    const code = str(item, "afkorting", "Afkorting", "code");
    if (id === null || !code || isCalculatedSubject(str(item, "omschrijving", "Omschrijving")))
      continue;
    map.set(id, code.toLowerCase());
  }
  return map;
}
