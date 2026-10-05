import { describe, expect, it } from "vitest";
import { rankCommands, type RankableCommand } from "./rank";

const cmd = (
  id: string,
  group: string,
  title: string,
  keywords: string[] = [],
): RankableCommand => ({
  id,
  group,
  title,
  keywords,
});

const commands = [
  cmd("p-vandaag", "Pagina's", "Vandaag"),
  cmd("p-rooster", "Pagina's", "Rooster", ["lessen"]),
  cmd("a-rooster-morgen", "Acties", "Rooster van morgen"),
  cmd("v-engels", "Vakken", "Engels", ["en"]),
  cmd("v-wiskunde", "Vakken", "Wiskunde A", ["cijfers wiskunde"]),
];

describe("rankCommands", () => {
  it("returns everything in the original order for an empty query", () => {
    const groups = rankCommands(commands, "");
    expect(groups.map((g) => g.group)).toEqual(["Pagina's", "Acties", "Vakken"]);
    expect(groups[0]?.items.map((i) => i.command.id)).toEqual(["p-vandaag", "p-rooster"]);
  });

  it("filters out commands that do not match", () => {
    const ids = rankCommands(commands, "rooster").flatMap((g) => g.items.map((i) => i.command.id));
    expect(ids).toEqual(["p-rooster", "a-rooster-morgen"]);
  });

  it("returns highlight ranges for the title", () => {
    const [group] = rankCommands(commands, "roo");
    expect(group?.items[0]?.ranges).toEqual([[0, 3]]);
  });

  it("also matches keywords, without highlighting the title", () => {
    const groups = rankCommands(commands, "lessen");
    expect(groups[0]?.items[0]?.command.id).toBe("p-rooster");
    expect(groups[0]?.items[0]?.ranges).toEqual([]);
  });

  it("puts the group with the best match first", () => {
    expect(rankCommands(commands, "engels")[0]?.group).toBe("Vakken");
  });

  it("always keeps the 'Snel' group on top", () => {
    const withQuick = [cmd("q", "Snel", "Wat moet ik halen voor Engels?"), ...commands];
    expect(rankCommands(withQuick, "engels")[0]?.group).toBe("Snel");
  });
});
