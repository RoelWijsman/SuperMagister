import { describe, expect, it } from "vitest";
import { computeCards } from "@/lib/calc/cards";
import { buildDemoDataset } from "@/lib/demo";
import { matchSubjectInfo } from "@/lib/subjects/catalog";
import { collectionGoals, type GoalCard } from "./goals";

/**
 * De demo laat het hele doelensysteem zien: open doelen, gehaalde doelen en
 * één doel dat precies door het startpack wordt afgemaakt (bij de ICON).
 */
describe("verzameldoelen in de demo", () => {
  const data = buildDemoDataset(new Date(2026, 9, 6, 12));
  const cores = computeCards(data.grades);
  const subjects = new Map(data.subjects.map((s) => [s.id, s]));
  const groupOf = (id: string) => {
    const subject = subjects.get(id);
    return matchSubjectInfo(subject?.code ?? "", subject?.name).group;
  };
  const pack = new Set(data.packGradeIds);
  const toGoalCards = (ids: (id: string) => boolean): GoalCard[] =>
    data.grades
      .filter((g) => ids(g.id))
      .map((g) => ({ ...cores.get(g.id)!, subjectId: g.subjectId }));

  const before = collectionGoals(
    toGoalCards((id) => !pack.has(id)),
    groupOf,
  );
  const after = collectionGoals(
    toGoalCards(() => true),
    groupOf,
  );
  const done = (goals: typeof before) => goals.filter((g) => g.done).map((g) => g.id);

  it("laat vóór het pack nog doelen open", () => {
    expect(done(before).length).toBeLessThan(before.length - 1);
  });

  it("maakt met het startpack Exacte toppers af", () => {
    expect(done(before)).not.toContain("exact");
    expect(done(after)).toContain("exact");
  });

  it("houdt Goudkoorts open: Duits heeft nog geen gouden kaart", () => {
    expect(done(after)).not.toContain("goudkoorts");
  });
});
