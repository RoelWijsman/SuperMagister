/** Kleine letters, zonder accenten: "Enquête" → "enquete". */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export type MatchRange = [start: number, end: number];

export interface FuzzyResult {
  score: number;
  /** Te markeren stukken in de oorspronkelijke tekst, `[start, end)`. */
  ranges: MatchRange[];
}

const isWordStart = (text: string, index: number) =>
  index === 0 || /[\s\-_/·(.]/.test(text[index - 1] ?? "");

function mergeRanges(positions: number[]): MatchRange[] {
  const ranges: MatchRange[] = [];
  for (const pos of positions) {
    const last = ranges[ranges.length - 1];
    if (last && last[1] === pos) last[1] = pos + 1;
    else ranges.push([pos, pos + 1]);
  }
  return ranges;
}

/**
 * Fuzzy zoeken voor de command palette. Een aaneengesloten treffer scoort
 * altijd hoger dan een verspreide; begin van de tekst en woordbegin geven bonus.
 */
export function fuzzyMatch(query: string, target: string): FuzzyResult | null {
  const q = normalizeText(query).trim();
  if (!q) return { score: 0, ranges: [] };
  const t = normalizeText(target);
  const lengthPenalty = t.length * 0.1;

  const index = t.indexOf(q);
  if (index >= 0) {
    let score = 100;
    if (index === 0) score += 50;
    if (isWordStart(t, index)) score += 25;
    if (q.length === t.length) score += 100;
    return { score: score - lengthPenalty, ranges: [[index, index + q.length]] };
  }

  // Verspreide treffer: zoek elk teken op volgorde, met voorkeur voor woordbegin.
  const chars = q.replace(/\s+/g, "");
  const positions: number[] = [];
  let from = 0;
  let score = 10;
  for (const char of chars) {
    let found = -1;
    let firstAny = -1;
    for (let i = from; i < t.length; i++) {
      if (t[i] !== char) continue;
      if (firstAny < 0) firstAny = i;
      if (isWordStart(t, i)) {
        found = i;
        break;
      }
    }
    if (found < 0) found = firstAny;
    if (found < 0) return null;

    const previous = positions[positions.length - 1];
    if (positions.length === 0 && found === 0) score += 15;
    if (isWordStart(t, found)) score += 10;
    if (previous !== undefined && found === previous + 1) score += 5;
    score -= found - from;
    positions.push(found);
    from = found + 1;
  }
  return { score: Math.min(score, 99) - lengthPenalty, ranges: mergeRanges(positions) };
}
