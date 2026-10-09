import { normalizeText } from "@/lib/search/fuzzy";
import { matchSubjectInfo } from "./catalog";

/**
 * Korte vaknamen voor kleine plekken (de kaartjes van Jouw Elftal): "Wis A",
 * "LO", "Ak". De volledige naam blijft in de toegankelijke naam en het detail.
 */
const SHORT: Readonly<Record<string, string>> = {
  diatoets: "Dia",
  nederlands: "Ne",
  engels: "En",
  frans: "Fa",
  duits: "Du",
  spaans: "Sp",
  latijn: "La",
  grieks: "Gr",
  wiskunde: "Wis",
  rekenen: "Rek",
  nlt: "NLT",
  anw: "ANW",
  natuurkunde: "Nat",
  scheikunde: "Sk",
  biologie: "Bio",
  informatica: "Inf",
  techniek: "Tech",
  aardrijkskunde: "Ak",
  geschiedenis: "Gs",
  bedrijfseconomie: "Beco",
  economie: "Econ",
  maatschappijwetenschappen: "Maw",
  maatschappijleer: "Ma",
  filosofie: "Fil",
  levensbeschouwing: "Lev",
  ckv: "CKV",
  muziek: "Mu",
  drama: "Dra",
  kunst: "Ku",
  lo: "LO",
  mentor: "Men",
  pws: "PWS",
  lob: "LOB",
  stage: "Stage",
};

/** Beeldend heeft drie gangbare namen; elk zijn eigen afkorting. */
function beeldend(name: string): string {
  if (/handvaardigheid/.test(name)) return "Hv";
  if (/tekenen/.test(name)) return "Tek";
  return "BV";
}

/** Een letter of cijfer aan het eind ("Wiskunde A", "Engels 2") hoort erbij. */
function suffix(name: string): string {
  const match = /\s([a-d]|[1-9])$/i.exec(name.trim());
  return match ? ` ${match[1]!.toUpperCase()}` : "";
}

export function shortSubjectName(name: string, code = ""): string {
  const normalized = normalizeText(name).trim();
  const info = matchSubjectInfo(code, name);
  const base =
    info.key === "beeldend" ? beeldend(normalized) : (SHORT[info.key] ?? fallback(name));
  return info.key in SHORT || info.key === "beeldend" ? base + suffix(name) : base;
}

/** Onbekend vak: kort genoeg laten staan, anders de eerste vier letters. */
function fallback(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 6) return trimmed;
  const first = trimmed.split(/\s+/)[0]!;
  return first.length <= 6 ? first : first.slice(0, 4);
}
