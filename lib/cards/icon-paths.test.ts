import { describe, expect, it } from "vitest";
import { SUBJECT_ICON_NAMES } from "@/lib/subjects/icons";
import { iconNodeToPaths, SUBJECT_ICON_NODES } from "./icon-paths";

describe("iconNodeToPaths", () => {
  it("laat een path zoals hij is", () => {
    expect(iconNodeToPaths([["path", { d: "M1 2L3 4" }]])).toEqual([
      { d: "M1 2L3 4", fill: false },
    ]);
  });

  it("zet een cirkel om naar twee bogen", () => {
    expect(iconNodeToPaths([["circle", { cx: "12", cy: "10", r: "3" }]])).toEqual([
      { d: "M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0Z", fill: false },
    ]);
  });

  it("zet een lijn en een polyline om", () => {
    expect(iconNodeToPaths([["line", { x1: "1", y1: "2", x2: "3", y2: "4" }]])[0]?.d).toBe(
      "M1 2L3 4",
    );
    expect(iconNodeToPaths([["polyline", { points: "1 2 3 4 5 6" }]])[0]?.d).toBe("M1 2L3 4L5 6");
    expect(iconNodeToPaths([["polygon", { points: "1,2 3,4 5,6" }]])[0]?.d).toBe("M1 2L3 4L5 6Z");
  });

  it("zet een afgeronde rechthoek om", () => {
    expect(
      iconNodeToPaths([["rect", { x: "2", y: "3", width: "10", height: "8", rx: "2" }]])[0]?.d,
    ).toBe("M4 3H10A2 2 0 0 1 12 5V9A2 2 0 0 1 10 11H4A2 2 0 0 1 2 9V5A2 2 0 0 1 4 3Z");
    expect(iconNodeToPaths([["rect", { x: "1", y: "1", width: "4", height: "2" }]])[0]?.d).toBe(
      "M1 1H5V3H1Z",
    );
  });

  it("onthoudt of een vorm gevuld is", () => {
    expect(
      iconNodeToPaths([["circle", { cx: "1", cy: "1", r: "1", fill: "currentColor" }]])[0]?.fill,
    ).toBe(true);
  });
});

describe("SUBJECT_ICON_NODES", () => {
  it("heeft paddata voor elk vak-icoon", () => {
    for (const name of SUBJECT_ICON_NAMES) {
      const paths = iconNodeToPaths(SUBJECT_ICON_NODES[name]);
      expect(paths.length, name).toBeGreaterThan(0);
    }
  });
});
