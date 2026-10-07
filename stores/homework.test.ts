import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY_PREFS, useHomeworkStore } from "./homework";

beforeEach(() => {
  useHomeworkStore.setState({ bySource: {}, celebrated: [], view: "lijst" });
});

describe("useHomeworkStore", () => {
  it("houdt de status per databron bij, met het moment", () => {
    const { setStatus } = useHomeworkStore.getState();
    setStatus("demo", "hw-1", "klaar", new Date("2026-10-07T16:00:00Z"));
    setStatus("echt", "hw-1", "bezig", new Date("2026-10-07T16:01:00Z"));
    const { bySource } = useHomeworkStore.getState();
    expect(bySource.demo?.status["hw-1"]).toEqual({
      status: "klaar",
      at: "2026-10-07T16:00:00.000Z",
    });
    expect(bySource.echt?.status["hw-1"]?.status).toBe("bezig");
  });

  it("bewaart eigen tijden per item en per vak, en vergeet ze met null", () => {
    const { setMinutes, setSubjectMinutes } = useHomeworkStore.getState();
    setMinutes("demo", "hw-1", 35);
    setSubjectMinutes("demo", "wisa", 40);
    expect(useHomeworkStore.getState().bySource.demo).toMatchObject({
      items: { "hw-1": 35 },
      subjects: { wisa: 40 },
    });
    setMinutes("demo", "hw-1", null);
    setSubjectMinutes("demo", "wisa", null);
    expect(useHomeworkStore.getState().bySource.demo).toMatchObject({ items: {}, subjects: {} });
  });

  it("vinkt mini-stapjes aan en uit", () => {
    const { toggleStep } = useHomeworkStore.getState();
    toggleStep("demo", "hw-1", 2);
    toggleStep("demo", "hw-1", 0);
    expect(useHomeworkStore.getState().bySource.demo?.steps["hw-1"]).toEqual([0, 2]);
    toggleStep("demo", "hw-1", 2);
    expect(useHomeworkStore.getState().bySource.demo?.steps["hw-1"]).toEqual([0]);
  });

  it("viert alles-af maar één keer per dag", () => {
    const { celebrate } = useHomeworkStore.getState();
    expect(celebrate("demo:2026-10-08")).toBe(true);
    expect(celebrate("demo:2026-10-08")).toBe(false);
    expect(celebrate("demo:2026-10-09")).toBe(true);
  });

  it("heeft een vaste lege stand", () => {
    expect(EMPTY_PREFS).toEqual({ status: {}, items: {}, subjects: {}, steps: {} });
  });
});
