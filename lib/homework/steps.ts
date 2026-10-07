/**
 * Fase 3c, "ik heb geen zin": een taak opknippen in mini-stapjes. Wat uit de
 * tekst van Magister komt ("Lees § 3.2", "Maak opdracht 4") staat er letterlijk;
 * de algemene stapjes komen uit content/copy.ts.
 */

export type StepKey =
  | "stapjes.begin"
  | "stapjes.einde"
  | "stapjes.lezen"
  | "stapjes.eerste"
  | "stapjes.toetsStof"
  | "stapjes.toetsSamenvatting"
  | "stapjes.toetsOefenen";

export type Step = { kind: "copy"; key: StepKey } | { kind: "tekst"; text: string };

/** Zinnen en losse opdrachten ("… en maak …"), maar niet "§ 3.2" of "blz. 45". */
const CLAUSES =
  /(?<!\b(?:blz|bl|p|pag|nr|bijv|ca|zgn|hfst|par))\.(?=\s|$)|[;\n]+|\s+en\s+(?=(?:lees|maak|leer|schrijf|bekijk|herhaal|zoek|neem|kijk)\b)/i;
const TASK_WORD = /\b(opdracht(?:en)?|opgave(?:n)?|som(?:men)?)\b/i;
const RANGE = /(\d+)\s*(?:t\/m|tm|tot en met|-|–)\s*(\d+)/i;
const PARAGRAPH = /§\s*(\d+(?:\.\d+)*)/g;
const MAX_STEPS = 10;
const PER_BLOCK = 4;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const copy = (key: StepKey): Step => ({ kind: "copy", key });

function clauseSteps(clause: string): string[] {
  const text = clause.trim().replace(/\s+/g, " ");
  if (!text) return [];

  const paragraphs = [...text.matchAll(PARAGRAPH)].map((match) => match[1]!);
  if (/\b(lees|lezen)\b/i.test(text) && paragraphs.length > 0) {
    return paragraphs.map((paragraph) => `Lees § ${paragraph}`);
  }

  const word = TASK_WORD.exec(text);
  if (word || /\bmaak\b/i.test(text)) {
    const noun =
      word && /opgave/i.test(word[1]!)
        ? "opgave"
        : word && /som/i.test(word[1]!)
          ? "som"
          : "opdracht";
    const range = RANGE.exec(text);
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      const count = to - from + 1;
      if (count > 0 && count <= 100) {
        if (count <= 8) return Array.from({ length: count }, (_, i) => `Maak ${noun} ${from + i}`);
        const size = Math.max(PER_BLOCK, Math.ceil(count / 8));
        const blocks: string[] = [];
        for (let start = from; start <= to; start += size) {
          blocks.push(`Maak ${noun} ${start} t/m ${Math.min(to, start + size - 1)}`);
        }
        return blocks;
      }
    }
    const after = word
      ? text.slice(word.index + word[0].length)
      : text.replace(/^.*?\bmaak\b/i, "");
    const numbers = after.match(/\b\d+[a-z]?\b/gi) ?? [];
    if (numbers.length > 0) return numbers.map((number) => `Maak ${noun} ${number}`);
  }

  return [capitalize(text)];
}

export function miniSteps(homework: { text: string; isTest: boolean }): Step[] {
  if (homework.isTest) {
    return [
      copy("stapjes.begin"),
      copy("stapjes.toetsStof"),
      copy("stapjes.toetsSamenvatting"),
      copy("stapjes.toetsOefenen"),
      copy("stapjes.einde"),
    ];
  }
  const parsed = homework.text
    .split(CLAUSES)
    .flatMap((clause) => (clause ? clauseSteps(clause) : []))
    .slice(0, MAX_STEPS);
  if (parsed.length === 0) {
    return [
      copy("stapjes.begin"),
      copy("stapjes.lezen"),
      copy("stapjes.eerste"),
      copy("stapjes.einde"),
    ];
  }
  return [
    copy("stapjes.begin"),
    ...parsed.map((text): Step => ({ kind: "tekst", text })),
    copy("stapjes.einde"),
  ];
}
