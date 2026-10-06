import { describe, expect, it } from "vitest";
import type { GuessRecord } from "@/lib/guess/outcome";
import { useGuessStore } from "./guesses";

const record = (gok: number): GuessRecord => ({
  gok,
  at: "2026-10-06T10:00:00.000Z",
  verschil: 0,
  xp: 50,
});

// Zonder IndexedDB (zoals hier in Node) werkt de store in het geheugen.
describe("useGuessStore", () => {
  it("laadt de begingokken en bewaart nieuwe gokken", async () => {
    await useGuessStore.getState().load("test", { a: record(7) });
    useGuessStore.getState().record("b", record(6.2));
    expect(useGuessStore.getState().guesses).toEqual({ a: record(7), b: record(6.2) });
  });

  it("laat een gok staan: je gokt maar één keer per cijfer", () => {
    useGuessStore.getState().record("b", record(9.9));
    expect(useGuessStore.getState().guesses?.b?.gok).toBe(6.2);
  });

  it("zet bij een demo-reset de begingokken terug", () => {
    useGuessStore.getState().reset("test", { a: record(7) });
    expect(useGuessStore.getState().guesses).toEqual({ a: record(7) });
  });
});
