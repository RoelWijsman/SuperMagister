import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYOUT,
  moveWidget,
  nextSize,
  normalizeLayout,
  TODAY_WIDGETS,
  toggleWidget,
  visibleWidgets,
  WIDGET_SIZES,
} from "./layout";

describe("indeling van Vandaag", () => {
  it("begint met Nu bezig bovenaan en alle widgets aan", () => {
    expect(DEFAULT_LAYOUT.order[0]).toBe("nu");
    // De schooldag-laadbalk is geschrapt (besluit 7 oktober 2026).
    expect(TODAY_WIDGETS).not.toContain("laadbalk");
    expect([...DEFAULT_LAYOUT.order].sort()).toEqual([...TODAY_WIDGETS].sort());
    expect(DEFAULT_LAYOUT.hidden).toEqual([]);
    for (const id of TODAY_WIDGETS) {
      expect(WIDGET_SIZES[id]).toContain(DEFAULT_LAYOUT.sizes[id]);
    }
  });

  it("versleept een widget naar de plek van een andere", () => {
    const moved = moveWidget(DEFAULT_LAYOUT, "trend", "nu");
    expect(moved.order.indexOf("trend")).toBe(DEFAULT_LAYOUT.order.indexOf("nu"));
    expect(moved.order).toHaveLength(DEFAULT_LAYOUT.order.length);
    expect(moveWidget(DEFAULT_LAYOUT, "nu", "nu")).toBe(DEFAULT_LAYOUT);
  });

  it("zet widgets uit en weer aan", () => {
    const off = toggleWidget(DEFAULT_LAYOUT, "weer");
    expect(off.hidden).toEqual(["weer"]);
    expect(visibleWidgets(off)).not.toContain("weer");
    expect(toggleWidget(off, "weer").hidden).toEqual([]);
  });

  it("maakt een widget groter of kleiner binnen wat hij aankan", () => {
    let layout = DEFAULT_LAYOUT;
    const seen = new Set<string>();
    for (let i = 0; i < WIDGET_SIZES.nu.length; i++) {
      seen.add(layout.sizes.nu);
      layout = nextSize(layout, "nu");
    }
    expect([...seen].sort()).toEqual([...WIDGET_SIZES.nu].sort());
    expect(layout.sizes.nu).toBe(DEFAULT_LAYOUT.sizes.nu);
    expect(nextSize(nextSize(DEFAULT_LAYOUT, "tijdlijn"), "tijdlijn").sizes.tijdlijn).toBe("full");
  });
});

describe("normalizeLayout (opgeslagen indeling)", () => {
  it("gebruikt de standaard als er niets (bruikbaars) is", () => {
    expect(normalizeLayout(undefined)).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout("kapot")).toEqual(DEFAULT_LAYOUT);
  });

  it("houdt je volgorde, laat onbekende widgets vallen en voegt nieuwe achteraan toe", () => {
    const stored = {
      order: ["weer", "bestaatniet", "nu"],
      hidden: ["nu", "x"],
      sizes: { nu: "lg" },
    };
    const layout = normalizeLayout(stored);
    expect(layout.order.slice(0, 2)).toEqual(["weer", "nu"]);
    expect([...layout.order].sort()).toEqual([...TODAY_WIDGETS].sort());
    expect(layout.hidden).toEqual(["nu"]);
    expect(layout.sizes.nu).toBe("lg");
  });

  it("negeert een maat die een widget niet aankan", () => {
    expect(normalizeLayout({ sizes: { tijdlijn: "sm" } }).sizes.tijdlijn).toBe("full");
  });

  it("ruimt de geschrapte laadbalk op uit een oude indeling", () => {
    const layout = normalizeLayout({ order: ["laadbalk", "trend"], hidden: ["laadbalk"] });
    expect(layout.order).not.toContain("laadbalk");
    expect(layout.order[0]).toBe("trend");
    expect(layout.hidden).toEqual([]);
  });
});
