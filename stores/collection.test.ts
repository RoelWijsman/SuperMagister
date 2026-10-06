import { beforeEach, describe, expect, it } from "vitest";
import { useCollectionStore } from "./collection";

beforeEach(() => {
  useCollectionStore.setState({ showcase: {}, foil: "standaard", announced: {} });
});

describe("useCollectionStore", () => {
  it("houdt de vitrine per databron bij", () => {
    const { toggleShowcase } = useCollectionStore.getState();
    expect(toggleShowcase("demo", "a")).toBe("toegevoegd");
    expect(toggleShowcase("echt", "x")).toBe("toegevoegd");
    expect(useCollectionStore.getState().showcase).toEqual({ demo: ["a"], echt: ["x"] });
    expect(toggleShowcase("demo", "a")).toBe("weg");
    expect(useCollectionStore.getState().showcase.demo).toEqual([]);
  });

  it("onthoudt welke doelen al gemeld zijn", () => {
    useCollectionStore.getState().markAnnounced("demo", ["startelftal"]);
    useCollectionStore.getState().markAnnounced("demo", ["goudkoorts", "startelftal"]);
    expect(useCollectionStore.getState().announced.demo).toEqual(["startelftal", "goudkoorts"]);
  });

  it("vergeet de gemelde doelen van één databron bij een demo-reset", () => {
    const { markAnnounced, resetAnnounced } = useCollectionStore.getState();
    markAnnounced("demo", ["exact"]);
    markAnnounced("echt", ["startelftal"]);
    resetAnnounced("demo");
    expect(useCollectionStore.getState().announced).toEqual({ echt: ["startelftal"] });
  });
});
