import { COPY, type CopyKey } from "@/content/copy";

export type CopyVars = Readonly<Record<string, string | number>>;

/** Vult {variabelen} in en begint met een hoofdletter. Onbekende variabelen blijven staan. */
export function fillCopy(template: string, vars: CopyVars = {}): string {
  const filled = template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
  return filled.charAt(0).toUpperCase() + filled.slice(1);
}

/** Splitst een tekst op de eerste witregel in een titel en een uitleg. */
export function splitCopy(text: string): { title: string; body: string } {
  const index = text.indexOf("\n");
  return index < 0
    ? { title: text, body: "" }
    : { title: text.slice(0, index), body: text.slice(index + 1) };
}

/**
 * Knipt een tekst rond variabelen die als component getoond worden, zoals
 * een cijfer dat in de privacymodus moet kunnen vervagen.
 */
export function splitPlaceholders(
  text: string,
  names: readonly string[],
): (string | { name: string })[] {
  const parts: (string | { name: string })[] = [];
  const pattern = new RegExp(`\\{(${names.join("|")})\\}`, "g");
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push({ name: match[1]! });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

interface PickerOptions {
  random?: () => number;
  /** Laatst gekozen variant per sleutel. */
  memory?: Map<string, number>;
  /** Wordt aangeroepen na elke keuze, bijv. om het geheugen op te slaan. */
  onPick?: (memory: Map<string, number>) => void;
}

/** Kiest een variant, nooit dezelfde als de vorige keer voor die sleutel. */
export function createPicker({
  random = Math.random,
  memory = new Map(),
  onPick,
}: PickerOptions = {}) {
  return (key: CopyKey): string => {
    const variants = COPY[key];
    const last = memory.get(key);
    let index: number;
    if (variants.length <= 1) index = 0;
    else if (last === undefined || last >= variants.length) {
      index = Math.floor(random() * variants.length);
    } else {
      index = Math.floor(random() * (variants.length - 1));
      if (index >= last) index++;
    }
    memory.set(key, index);
    onPick?.(memory);
    return variants[index] ?? variants[0] ?? "";
  };
}

const STORAGE_KEY = "sm-teksten";

function loadMemory(): Map<string, number> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return new Map(raw ? (JSON.parse(raw) as [string, number][]) : []);
  } catch {
    return new Map();
  }
}

/** De picker van de app. Onthoudt binnen een sessie wat er net getoond is. */
export const pickCopy = createPicker({
  memory: loadMemory(),
  onPick: (memory) => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...memory]));
    } catch {
      // Geen opslag: dan alleen in het geheugen.
    }
  },
});

/** Kies en vul in één keer, voor meldingen en andere teksten buiten React om. */
export function copyText(key: CopyKey, vars?: CopyVars): string {
  return fillCopy(pickCopy(key), vars);
}

/** Vaste keuze op basis van een seed, voor deterministische plekken (zoals video's). */
export function seededCopy(key: CopyKey, seed: number, vars?: CopyVars): string {
  const variants = COPY[key];
  return fillCopy(variants[Math.abs(seed) % variants.length] ?? "", vars);
}
