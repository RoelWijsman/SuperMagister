import { beforeEach, describe, expect, it } from "vitest";
import { placeCard } from "@/lib/squad/lineup";
import { activeSquad, defaultSourceSquads, MAX_SQUADS, useSquadStore } from "./squad";

beforeEach(() => {
  useSquadStore.setState({ bySource: {} });
});

const entry = (sourceId: string) =>
  useSquadStore.getState().bySource[sourceId] ?? defaultSourceSquads();

describe("useSquadStore", () => {
  it("houdt elftallen per databron apart (demo en echt lopen nooit door elkaar)", () => {
    const { updateLineup } = useSquadStore.getState();
    updateLineup("demo", (l) => placeCard(l, { kind: "veld", slot: "sp" }, "demo-kaart", () => "wi"));
    expect(activeSquad(entry("demo")).lineup.slots.sp).toBe("demo-kaart");
    expect(activeSquad(entry("magister:x:1")).lineup.slots.sp).toBeNull();
  });

  it("bewaart maximaal drie elftallen, met een eigen naam", () => {
    const { addSquad, renameSquad, setActive } = useSquadStore.getState();
    expect(addSquad("demo", false)).toBe(true);
    expect(addSquad("demo", true)).toBe(true);
    expect(addSquad("demo", false)).toBe(false);
    const squads = entry("demo").squads;
    expect(squads).toHaveLength(MAX_SQUADS);
    expect(squads.map((s) => s.name)).toEqual(["Mijn elftal", "Periode 1", "Beste ooit"]);
    renameSquad("demo", squads[2]!.id, "  Chaos   XI  ");
    expect(entry("demo").squads[2]!.name).toBe("Chaos XI");
    renameSquad("demo", squads[2]!.id, "   ");
    expect(entry("demo").squads[2]!.name).toBe("Chaos XI");
    setActive("demo", squads[0]!.id);
    expect(entry("demo").active).toBe(squads[0]!.id);
  });

  it("houdt altijd minstens één elftal over", () => {
    const { removeSquad, addSquad } = useSquadStore.getState();
    addSquad("demo", false);
    const [first, second] = entry("demo").squads;
    removeSquad("demo", second!.id);
    removeSquad("demo", first!.id);
    expect(entry("demo").squads).toHaveLength(1);
  });

  it("clubnaam: netjes, en nooit een echte club", () => {
    const { setClub } = useSquadStore.getState();
    setClub("demo", { name: "Dynamo Mentoruur", crest: "rond" });
    expect(entry("demo").club).toEqual({ name: "Dynamo Mentoruur", crest: "rond" });
    setClub("demo", { name: "Ajax" });
    expect(entry("demo").club.name).toBe("FC Herkansing");
  });

  it("vergeet bij ontkoppelen alleen de echte databronnen", () => {
    const { addSquad, forgetSources } = useSquadStore.getState();
    addSquad("demo", false);
    addSquad("magister:school:1", false);
    forgetSources((id) => id.startsWith("magister:"));
    expect(Object.keys(useSquadStore.getState().bySource)).toEqual(["demo"]);
  });
});
