import { beforeEach, describe, expect, it } from "vitest";
import { useAchievementStore } from "./achievements";

beforeEach(() => {
  useAchievementStore.setState({ announced: {} });
});

describe("useAchievementStore", () => {
  it("onthoudt per databron welke prestaties al gemeld zijn", () => {
    const { markAnnounced } = useAchievementStore.getState();
    markAnnounced("demo", ["gok.laag"]);
    markAnnounced("demo", ["gok.verdacht", "gok.laag"]);
    markAnnounced("echt", ["gok.orakel"]);
    expect(useAchievementStore.getState().announced).toEqual({
      demo: ["gok.laag", "gok.verdacht"],
      echt: ["gok.orakel"],
    });
  });

  it("vergeet bij een demo-reset alleen die databron", () => {
    const { markAnnounced, resetAnnounced } = useAchievementStore.getState();
    markAnnounced("demo", ["gok.verdacht"]);
    markAnnounced("echt", ["gok.orakel"]);
    resetAnnounced("demo");
    expect(useAchievementStore.getState().announced).toEqual({ echt: ["gok.orakel"] });
  });
});
