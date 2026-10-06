import { describe, expect, it } from "vitest";
import { useReveal } from "./reveal";

// Zonder IndexedDB (zoals hier in Node) werkt de store gewoon in het geheugen.
describe("useReveal", () => {
  it("onthult cijfers en plakt het startpack weer dicht", async () => {
    const all = ["a", "b", "c", "d"];
    const pack = ["c", "d"];
    await useReveal.getState().load("test", all, pack);
    expect([...(useReveal.getState().revealed ?? [])]).toEqual(["a", "b"]);

    useReveal.getState().reveal(["c", "d"]);
    expect(useReveal.getState().revealed?.has("d")).toBe(true);

    useReveal.getState().reset("test", all, pack);
    expect([...(useReveal.getState().revealed ?? [])]).toEqual(["a", "b"]);
  });
});
