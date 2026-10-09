import type { SlotResult, SquadEvaluation } from "./chemistry";
import { LINES, type Line } from "./formations";
import type { MoveAdvice } from "./suggest";

/**
 * De analyse naast het elftal: de sterkste linie (met het vak dat hem draagt),
 * de zwakste linie en één tip. Een tip stelt alleen een zet voor die echt kan
 * en de score echt verbetert (zie bestMove); anders een aanvoerder, of niets
 * op aan te merken. Alleen feiten; de grappige zinnen komen uit content/copy.ts.
 */

export type SquadTip =
  | { kind: "leeg"; open: number }
  | { kind: "zet"; advice: MoveAdvice }
  | { kind: "aanvoerder" }
  | { kind: "top" };

export interface SquadAnalysis {
  strongest: { line: Line; rating: number; subject: string } | null;
  weakest: { line: Line; rating: number; subject: string } | null;
  tip: SquadTip;
}

/** Het vak met de hoogste (of laagste) rating in een linie. */
function subjectIn(slots: readonly SlotResult[], line: Line, best: boolean): string {
  const inLine = slots.filter((s) => s.line === line && s.player);
  inLine.sort((a, b) =>
    best ? b.player!.rating - a.player!.rating : a.player!.rating - b.player!.rating,
  );
  return inLine[0]?.player?.subjectName ?? "";
}

/**
 * `move` is de beste zet die er nog is (of null). `canFill`: zijn er kaarten om
 * lege plekken mee te vullen?
 */
export function analyseSquad(
  evaluation: SquadEvaluation,
  move: MoveAdvice | null = null,
  canFill = true,
): SquadAnalysis {
  const { slots, lineRatings } = evaluation;
  const rated = LINES.flatMap((line) => {
    const rating = lineRatings[line];
    return rating === null ? [] : [{ line, rating }];
  });
  const byRating = [...rated].sort((a, b) => b.rating - a.rating);
  const top = byRating[0];
  const bottom = byRating.length > 1 ? byRating[byRating.length - 1] : undefined;

  const open = slots.filter((s) => !s.player).length;

  let tip: SquadTip;
  if (open > 0 && canFill) tip = { kind: "leeg", open };
  else if (move) tip = { kind: "zet", advice: move };
  else if (evaluation.placed > 0 && !slots.some((s) => s.captain)) tip = { kind: "aanvoerder" };
  else tip = { kind: "top" };

  return {
    strongest: top ? { ...top, subject: subjectIn(slots, top.line, true) } : null,
    weakest: bottom ? { ...bottom, subject: subjectIn(slots, bottom.line, false) } : null,
    tip,
  };
}
