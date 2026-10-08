import { describe, expect, it } from "vitest";
import { migrateScheduleUi, scheduleKey, useScheduleUi } from "./schedule";

describe("useScheduleUi", () => {
  it("zet notities en stempels van vóór 5b bij de demo (daar kwamen ze vandaan)", () => {
    const migrated = migrateScheduleUi(
      {
        view: "week",
        stamped: ["101"],
        cheered: ["2026-10-06:uitslapen"],
        notes: { "101": "Hoofdstuk 4 herhalen" },
      },
      1,
    );
    expect(migrated).toMatchObject({
      view: "week",
      stamped: [scheduleKey("demo", "101")],
      cheered: [scheduleKey("demo", "2026-10-06:uitslapen")],
      notes: { [scheduleKey("demo", "101")]: "Hoofdstuk 4 herhalen" },
    });
  });

  it("vergeet bij ontkoppelen alleen de gekozen bronnen", () => {
    const real = "magister:voorbeeld.magister.net:1002";
    useScheduleUi.setState({
      stamped: [scheduleKey("demo", "1"), scheduleKey(real, "2")],
      cheered: [],
      notes: { [scheduleKey(real, "2")]: "echt", [scheduleKey("demo", "1")]: "demo" },
    });
    useScheduleUi.getState().forgetSources((id) => id.startsWith("magister:"));
    expect(useScheduleUi.getState()).toMatchObject({
      stamped: [scheduleKey("demo", "1")],
      notes: { [scheduleKey("demo", "1")]: "demo" },
    });
  });
});
