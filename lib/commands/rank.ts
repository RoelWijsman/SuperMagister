import { fuzzyMatch, type MatchRange } from "@/lib/search/fuzzy";

export interface RankableCommand {
  id: string;
  group: string;
  title: string;
  /** Extra zoekwoorden die niet in de titel staan. */
  keywords?: readonly string[];
}

export interface RankedGroup<T extends RankableCommand> {
  group: string;
  items: { command: T; ranges: MatchRange[] }[];
}

/** Groep met slimme suggesties; staat altijd bovenaan. */
const PINNED_GROUP = "Snel";
/** Een treffer op een zoekwoord telt iets minder zwaar dan een treffer in de titel. */
const KEYWORD_PENALTY = 5;

/**
 * Filtert en sorteert commando's voor de command palette. Zonder zoekterm
 * blijft alles in de oorspronkelijke volgorde. Met zoekterm staat binnen een
 * groep de beste treffer bovenaan, en de groep met de beste treffer eerst.
 */
export function rankCommands<T extends RankableCommand>(
  commands: readonly T[],
  query: string,
): RankedGroup<T>[] {
  const q = query.trim();
  const groups = new Map<
    string,
    {
      best: number;
      order: number;
      items: { command: T; ranges: MatchRange[]; score: number; index: number }[];
    }
  >();

  commands.forEach((command, index) => {
    let score = 0;
    let ranges: MatchRange[] = [];
    if (q) {
      const title = fuzzyMatch(q, command.title);
      let keywordScore = -Infinity;
      for (const keyword of command.keywords ?? []) {
        const match = fuzzyMatch(q, keyword);
        if (match) keywordScore = Math.max(keywordScore, match.score - KEYWORD_PENALTY);
      }
      if (!title && keywordScore === -Infinity) return;
      score = Math.max(title?.score ?? -Infinity, keywordScore);
      ranges = title?.ranges ?? [];
    }

    let group = groups.get(command.group);
    if (!group) {
      group = { best: -Infinity, order: groups.size, items: [] };
      groups.set(command.group, group);
    }
    group.best = Math.max(group.best, score);
    group.items.push({ command, ranges, score, index });
  });

  return [...groups.entries()]
    .sort(([nameA, a], [nameB, b]) => {
      if (nameA === PINNED_GROUP) return -1;
      if (nameB === PINNED_GROUP) return 1;
      return q ? b.best - a.best || a.order - b.order : a.order - b.order;
    })
    .map(([name, group]) => ({
      group: name,
      items: group.items
        .sort((a, b) => (q ? b.score - a.score : 0) || a.index - b.index)
        .map(({ command, ranges }) => ({ command, ranges })),
    }));
}
