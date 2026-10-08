import type { SubjectGroup } from "@/lib/types";
import { normalizeText } from "@/lib/search/fuzzy";
import type { SubjectIconName } from "./icons";

/**
 * Kennis over Nederlandse schoolvakken: welk icoon, welke vakgroep, of het een
 * kernvak is en onder welke namen leerlingen het noemen. Magister-vakcodes
 * verschillen per school, dus we herkennen eerst op naam en dan op code.
 */
export interface SubjectInfo {
  key: string;
  icon: SubjectIconName;
  group: SubjectGroup;
  isCore: boolean;
  /** Extra zoekwoorden, bijv. "wis" voor wiskunde. Alleen hele woorden tellen. */
  aliases: readonly string[];
}

interface CatalogEntry extends SubjectInfo {
  codes: readonly string[];
  name: RegExp;
}

const entry = (
  key: string,
  icon: SubjectIconName,
  group: SubjectGroup,
  codes: string[],
  name: RegExp,
  aliases: string[] = [],
  isCore = false,
): CatalogEntry => ({ key, icon, group, codes, name, aliases, isCore });

// Volgorde telt: specifieke namen vóór algemene (beeldende kunst vóór "kunst").
const CATALOG: readonly CatalogEntry[] = [
  // Diatoetsen ("diatoets engels") vóór de talen, anders worden ze gewoon Engels.
  entry(
    "diatoets",
    "ClipboardCheck",
    "overig",
    ["dia", "diasp", "diabl", "diaen", "diare", "diawi"],
    /diatoets|diagnostische toets/,
    ["diatoets"],
  ),
  entry(
    "nederlands",
    "BookOpen",
    "talen",
    ["ne", "net", "netl", "ned", "nl"],
    /nederlands/,
    ["nederlands", "ned"],
    true,
  ),
  entry(
    "engels",
    "MessagesSquare",
    "talen",
    ["en", "entl", "eng", "ent"],
    /engels/,
    ["engels", "eng"],
    true,
  ),
  entry("frans", "Croissant", "talen", ["fa", "fatl", "fr", "fra"], /frans/, ["frans"]),
  entry("duits", "Castle", "talen", ["du", "dutl", "dui"], /duits/, ["duits"]),
  entry("spaans", "Guitar", "talen", ["sp", "sptl", "spa"], /spaans/, ["spaans"]),
  entry("latijn", "Scroll", "talen", ["la", "ltc", "lat"], /latijn/, ["latijn"]),
  entry("grieks", "Amphora", "talen", ["gr", "grtc", "gri"], /grieks/, ["grieks"]),
  entry(
    "wiskunde",
    "Sigma",
    "exact",
    ["wi", "wis", "wisa", "wisb", "wisc", "wisd", "wa", "wb", "wc", "wd", "wsk"],
    /wiskunde/,
    ["wiskunde", "wis", "wi"],
    true,
  ),
  entry("rekenen", "Calculator", "exact", ["rek", "re"], /rekenen/, ["rekenen"]),
  entry("nlt", "Microscope", "exact", ["nlt"], /natuur.?leven|^nlt$/, ["nlt"]),
  entry("anw", "Telescope", "exact", ["anw"], /natuurwetenschappen|^anw$/, ["anw"]),
  entry(
    "natuurkunde",
    "Atom",
    "exact",
    ["na", "nat", "natk", "nask", "nsk1"],
    /natuurkunde|^nask/,
    ["natuurkunde", "nat", "nask"],
  ),
  entry("scheikunde", "FlaskConical", "exact", ["sk", "sch", "schk", "nsk2"], /scheikunde/, [
    "scheikunde",
    "schk",
  ]),
  entry("biologie", "Leaf", "exact", ["bi", "bio", "biol"], /biologie/, [
    "biologie",
    "bio",
    "biol",
  ]),
  entry("informatica", "CodeXml", "exact", ["inf", "info", "ict"], /informatica/, [
    "informatica",
    "info",
  ]),
  entry(
    "techniek",
    "Wrench",
    "exact",
    ["tn", "tech", "oo"],
    /techniek|technologie|onderzoek.*ontwerp|o&o/,
    ["techniek"],
  ),
  entry("aardrijkskunde", "Globe", "mens-maatschappij", ["ak", "aak", "aard"], /aardrijkskunde/, [
    "aardrijkskunde",
    "aard",
  ]),
  entry(
    "geschiedenis",
    "Landmark",
    "mens-maatschappij",
    ["gs", "ges", "gesch", "gsch"],
    /geschiedenis/,
    ["geschiedenis", "gesch"],
  ),
  entry(
    "bedrijfseconomie",
    "BriefcaseBusiness",
    "mens-maatschappij",
    ["beco", "bec", "mo", "m&o"],
    /bedrijfseconomie|management/,
    ["beco", "bedrijfseconomie"],
  ),
  entry("economie", "TrendingUp", "mens-maatschappij", ["ec", "eco", "econ"], /economie/, [
    "economie",
    "eco",
    "econ",
  ]),
  entry(
    "maatschappijwetenschappen",
    "Scale",
    "mens-maatschappij",
    ["maw"],
    /maatschappijwetenschappen/,
    ["maw"],
  ),
  entry(
    "maatschappijleer",
    "Users",
    "mens-maatschappij",
    ["ma", "maat", "mal", "ml"],
    /maatschappijleer|mens (en|&) maatschappij/,
    ["maatschappijleer"],
  ),
  entry("filosofie", "Brain", "mens-maatschappij", ["fi", "fil", "filo"], /filosofie/, [
    "filosofie",
  ]),
  entry(
    "levensbeschouwing",
    "HeartHandshake",
    "overig",
    ["lv", "lev", "levo", "gd", "gods"],
    /levensbeschouwing|godsdienst|religie/,
    ["levensbeschouwing"],
  ),
  entry("ckv", "Theater", "kunst-cultuur", ["ckv"], /^ckv|culturele/, ["ckv"]),
  entry(
    "beeldend",
    "Palette",
    "kunst-cultuur",
    ["tek", "bv", "beo", "kubv", "ha"],
    /tekenen|beeldend|handvaardigheid/,
    ["tekenen", "beeldend"],
  ),
  entry("muziek", "Music", "kunst-cultuur", ["mu", "muz", "kumu"], /muziek/, ["muziek"]),
  entry("drama", "Drama", "kunst-cultuur", ["dr", "dra", "kudr", "dans"], /drama|dans|theater/, [
    "drama",
  ]),
  entry("kunst", "Brush", "kunst-cultuur", ["ku", "kua"], /kunst/, ["kunst"]),
  entry(
    "lo",
    "Dumbbell",
    "bewegen",
    ["lo", "lo1", "lo2", "gym", "bsm"],
    /lichamelijke opvoeding|^gym|sport|bewegen/,
    ["gym", "lo", "sport"],
  ),
  entry("mentor", "Compass", "overig", ["men", "ment", "mentor", "mr"], /mentor/, [
    "mentor",
    "mentoruur",
  ]),
  entry("pws", "NotebookPen", "overig", ["pws"], /profielwerkstuk/, ["pws", "profielwerkstuk"]),
  entry("lob", "Footprints", "overig", ["lob"], /loopbaan/, ["lob"]),
  // Maatschappelijke stage vóór gewone stage.
  entry(
    "maatschappelijke-stage",
    "HeartHandshake",
    "overig",
    ["mast", "mas", "mst"],
    /maatschappelijke stage/,
    ["mas"],
  ),
  entry("stage", "BriefcaseBusiness", "overig", ["stage", "stg"], /stage/, ["stage"]),
  entry("activiteit", "Rocket", "overig", ["act", "acti"], /activiteit|excursie|projectweek/, [
    "activiteit",
  ]),
  entry("project", "Lightbulb", "overig", ["pro", "proj", "prj"], /^project/, ["project"]),
];

const FALLBACK: SubjectInfo = {
  key: "overig",
  icon: "BookText",
  group: "overig",
  isCore: false,
  aliases: [],
};

const cleanCode = (code: string) => normalizeText(code).replace(/[^a-z0-9&]/g, "");

export function matchSubjectInfo(code: string, name?: string): SubjectInfo {
  const normalizedName = name ? normalizeText(name).trim() : "";
  if (normalizedName) {
    const byName = CATALOG.find((item) => item.name.test(normalizedName));
    if (byName) return byName;
  }
  const normalizedCode = cleanCode(code);
  const byCode =
    CATALOG.find((item) => item.codes.includes(normalizedCode)) ??
    CATALOG.find((item) => item.codes.includes(normalizedCode.replace(/\d+$/, "")));
  return byCode ?? FALLBACK;
}

interface NamedSubject {
  id: string;
  code: string;
  name: string;
}

/** Alle woorden waarmee een leerling dit vak kan aanduiden. */
export function subjectSearchTerms(subject: NamedSubject): string[] {
  const info = matchSubjectInfo(subject.code, subject.name);
  const name = normalizeText(subject.name).trim();
  const firstWord = name.split(/\s+/)[0] ?? "";
  return [...new Set([name, firstWord, cleanCode(subject.code), ...info.aliases])].filter(
    (term) => term.length >= 2,
  );
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Zoekt welk vak in een zin genoemd wordt ("wat moet ik halen voor wiskunde"). */
export function findSubjectInText(text: string, subjects: readonly NamedSubject[]): string | null {
  const haystack = normalizeText(text);
  let best: { id: string; length: number } | null = null;
  for (const subject of subjects) {
    for (const term of subjectSearchTerms(subject)) {
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}($|[^a-z0-9])`);
      if (pattern.test(haystack) && (!best || term.length > best.length)) {
        best = { id: subject.id, length: term.length };
      }
    }
  }
  return best?.id ?? null;
}
