import type { SlotResult, SquadEvaluation } from "./chemistry";
import { LINES, POSITION_NAMES, type Line } from "./formations";
import type { NaturalLine } from "./players";

/**
 * De analyse onder het elftal: de sterkste linie (met het vak dat hem draagt),
 * de zwakste plek en één tip. Alleen feiten; de grappige zinnen komen uit
 * content/copy.ts.
 */

export type SquadTip =
  | { kind: "leeg"; open: number }
  | { kind: "keeper" }
  | { kind: "positie"; subject: string; natural: NaturalLine; position: string }
  | { kind: "chemie"; red: number }
  | { kind: "aanvoerder" }
  | { kind: "top" };

export interface SquadAnalysis {
  strongest: { line: Line; rating: number; subject: string } | null;
  weakest: { line: Line; rating: number; subject: string } | null;
  /** De plek met de laagste chemie (bij gelijkspel de laagste rating). */
  weakSpot: { slotId: string; position: string; subject: string; chemistry: number } | null;
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

export function analyseSquad(evaluation: SquadEvaluation): SquadAnalysis {
  const { slots, lineRatings, links } = evaluation;
  const rated = LINES.flatMap((line) => {
    const rating = lineRatings[line];
    return rating === null ? [] : [{ line, rating }];
  });
  const byRating = [...rated].sort((a, b) => b.rating - a.rating);
  const top = byRating[0];
  const bottom = byRating.length > 1 ? byRating[byRating.length - 1] : undefined;

  const filled = slots.filter((s) => s.player);
  const weak = [...filled].sort(
    (a, b) => a.chemistry - b.chemistry || a.player!.rating - b.player!.rating,
  )[0];

  const open = slots.length - filled.length;
  const keeper = slots.find((s) => s.line === "keeper");
  const misplaced = filled.find(
    (s) => s.fit === "verkeerd" || (s.fit === "onmogelijk" && s.line !== "keeper"),
  );
  const red = links.filter((l) => l.strength === "rood").length;

  let tip: SquadTip;
  if (open > 0) tip = { kind: "leeg", open };
  else if (keeper && keeper.fit !== "natuurlijk") tip = { kind: "keeper" };
  else if (misplaced)
    tip = {
      kind: "positie",
      subject: misplaced.player!.subjectName,
      natural: misplaced.player!.natural,
      position: POSITION_NAMES[misplaced.slot.position].toLowerCase(),
    };
  else if (red >= 3) tip = { kind: "chemie", red };
  else if (!slots.some((s) => s.captain)) tip = { kind: "aanvoerder" };
  else tip = { kind: "top" };

  return {
    strongest: top ? { ...top, subject: subjectIn(slots, top.line, true) } : null,
    weakest: bottom ? { ...bottom, subject: subjectIn(slots, bottom.line, false) } : null,
    weakSpot: weak
      ? {
          slotId: weak.slot.id,
          position: POSITION_NAMES[weak.slot.position].toLowerCase(),
          subject: weak.player!.subjectName,
          chemistry: weak.chemistry,
        }
      : null,
    tip,
  };
}
