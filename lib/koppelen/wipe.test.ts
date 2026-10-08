import { beforeEach, describe, expect, it, vi } from "vitest";

const idb = vi.hoisted(() => {
  const keys = new Set<string>();
  return {
    keys,
    idbKeys: vi.fn(async () => [...keys]),
    idbDel: vi.fn(async (key: string) => {
      keys.delete(key);
    }),
    idbGet: vi.fn(async () => undefined),
    idbSet: vi.fn(async () => undefined),
  };
});
vi.mock("@/lib/idb", () => idb);

const { wipeMagisterData } = await import("./wipe");
const { useAchievementStore } = await import("@/stores/achievements");
const { useCollectionStore } = await import("@/stores/collection");
const { useConnection } = await import("@/stores/connection");
const { useGradesStore } = await import("@/stores/grades");
const { useGuessStore } = await import("@/stores/guesses");
const { useHomeworkStore, EMPTY_PREFS } = await import("@/stores/homework");
const { useReveal } = await import("@/stores/reveal");
const { scheduleKey, useScheduleUi } = await import("@/stores/schedule");

const REAL = "magister:voorbeeld.magister.net:1002";
const OLD_YEAR = `${REAL}:1011`;

beforeEach(() => {
  idb.keys.clear();
  for (const key of [
    "onthuld:demo",
    `onthuld:${REAL}`,
    `gokken:${OLD_YEAR}`,
    `rooster:${REAL}`,
    `cache:${REAL}|getGrades|[]`,
    `cache:${REAL}|bijgewerkt`,
    "rooster:demo",
  ])
    idb.keys.add(key);
  useCollectionStore.setState({
    showcase: { demo: ["a"], [REAL]: ["b"] },
    announced: { [REAL]: ["x"] },
  });
  useAchievementStore.setState({ announced: { demo: ["d"], [OLD_YEAR]: ["e"] } });
  useHomeworkStore.setState({
    bySource: { demo: EMPTY_PREFS, [REAL]: EMPTY_PREFS },
    celebrated: ["demo:2026-10-06", `${REAL}:2026-10-07`],
  });
  useGradesStore.setState({ combination: { demo: ["ak"], [REAL]: ["gs"] } });
  useScheduleUi.setState({
    stamped: [scheduleKey("demo", "1"), scheduleKey(REAL, "2")],
    cheered: [scheduleKey(REAL, "2026-10-07:uitslapen")],
    notes: { [scheduleKey("demo", "1")]: "demo", [scheduleKey(REAL, "2")]: "echt" },
  });
  useReveal.setState({ sourceId: REAL, revealed: new Set(["1"]) });
  useGuessStore.setState({ sourceId: "demo", guesses: {} });
  useConnection.setState({
    account: {
      schoolHost: "voorbeeld.magister.net",
      personId: 1002,
      name: "Daan Visser",
      linkedAt: "2026-10-07T12:00:00.000Z",
    },
    view: "magister",
    enrollmentId: 1011,
  });
});

describe("wipeMagisterData", () => {
  it("wist alles van je echte account uit IndexedDB, en niets van de demo", async () => {
    await wipeMagisterData();
    expect([...idb.keys].sort()).toEqual(["onthuld:demo", "rooster:demo"]);
  });

  it("wist je echte gegevens uit alle lokale opslag", async () => {
    await wipeMagisterData();
    expect(useCollectionStore.getState().showcase).toEqual({ demo: ["a"] });
    expect(useCollectionStore.getState().announced).toEqual({});
    expect(useAchievementStore.getState().announced).toEqual({ demo: ["d"] });
    expect(Object.keys(useHomeworkStore.getState().bySource)).toEqual(["demo"]);
    expect(useHomeworkStore.getState().celebrated).toEqual(["demo:2026-10-06"]);
    expect(useGradesStore.getState().combination).toEqual({ demo: ["ak"] });
    expect(useScheduleUi.getState()).toMatchObject({
      stamped: [scheduleKey("demo", "1")],
      cheered: [],
      notes: { [scheduleKey("demo", "1")]: "demo" },
    });
  });

  it("vergeet wat er nog in het geheugen staat", async () => {
    await wipeMagisterData();
    expect(useReveal.getState()).toMatchObject({ sourceId: null, revealed: null });
    // De demo blijft gewoon geladen.
    expect(useGuessStore.getState().sourceId).toBe("demo");
  });

  it("ontkoppelt en gaat terug naar de demo", async () => {
    await wipeMagisterData();
    expect(useConnection.getState()).toMatchObject({
      account: null,
      view: "demo",
      enrollmentId: null,
    });
  });
});
