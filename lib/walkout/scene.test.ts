import { describe, expect, it } from "vitest";
import { cardLayout, isSideLayout, SIDE_LAYOUT_MIN_ASPECT, stageFor } from "./scene";

const restBox = (stage: { w: number; h: number }, reserveBottom?: number) => {
  const layout = cardLayout(stage, { reserveBottom });
  const w = layout.w * layout.restScale;
  const h = layout.h * layout.restScale;
  return {
    layout,
    left: layout.cxRest - w / 2,
    right: layout.cxRest + w / 2,
    top: layout.cyRest - h / 2,
    bottom: layout.cyRest + h / 2,
  };
};

describe("stageFor", () => {
  it("maakt de korte kant 1000 eenheden", () => {
    expect(stageFor(1920, 1080).stage).toEqual({ w: (1920 / 1080) * 1000, h: 1000 });
    expect(stageFor(390, 844).stage.w).toBe(1000);
  });

  it("blijft eindig bij een canvas zonder afmetingen", () => {
    const { stage, unit } = stageFor(0, 0);
    expect(Number.isFinite(stage.w) && Number.isFinite(stage.h) && unit > 0).toBe(true);
  });
});

describe("cardLayout", () => {
  it("zet de kaart op brede schermen in rust links, met het eindscherm ernaast", () => {
    const stage = stageFor(1280, 720).stage;
    expect(isSideLayout(stage)).toBe(true);
    const box = restBox(stage);
    expect(box.right).toBeLessThanOrEqual(stage.w * 0.5);
    expect(box.left).toBeGreaterThan(0);
    expect(box.layout.cyRest).toBeCloseTo(stage.h / 2);
    expect(box.top).toBeGreaterThan(stage.h * 0.08);
  });

  it("houdt de kaart op staande schermen in het midden, boven het eindscherm", () => {
    const stage = stageFor(390, 844).stage;
    expect(isSideLayout(stage)).toBe(false);
    const box = restBox(stage);
    expect(box.layout.cxRest).toBe(stage.w / 2);
    expect(box.bottom).toBeLessThanOrEqual(stage.h * 0.56);
    expect(box.top).toBeGreaterThan(stage.h * 0.06);
  });

  it("stapelt ook bij bijna vierkante schermen", () => {
    const stage = stageFor(1000, 900).stage;
    expect(stage.w / stage.h).toBeLessThan(SIDE_LAYOUT_MIN_ASPECT);
    expect(isSideLayout(stage)).toBe(false);
    expect(restBox(stage).bottom).toBeLessThanOrEqual(stage.h * 0.6);
  });

  it("maakt ruimte voor een hoog eindscherm door de kaart kleiner te maken", () => {
    const stage = stageFor(390, 844).stage;
    const normal = restBox(stage);
    const tall = restBox(stage, 0.55);
    expect(tall.bottom).toBeLessThanOrEqual(stage.h * 0.45);
    expect(tall.top).toBeGreaterThan(stage.h * 0.06);
    expect(tall.layout.restScale).toBeLessThan(normal.layout.restScale);
  });

  it("houdt de kaart herkenbaar, ook als het eindscherm bijna alles vraagt", () => {
    const stage = stageFor(375, 667).stage;
    const box = restBox(stage, 0.95);
    expect(box.layout.restScale).toBeGreaterThan(0.2);
    expect(box.top).toBeGreaterThan(0);
  });

  it("negeert de reservering als het eindscherm naast de kaart staat", () => {
    const stage = stageFor(1280, 720).stage;
    expect(cardLayout(stage, { reserveBottom: 0.6 })).toEqual(cardLayout(stage));
  });

  it("past de kaart tijdens de onthulling altijd binnen het beeld", () => {
    for (const [pw, ph] of [
      [1280, 720],
      [390, 844],
      [1000, 900],
      [2560, 1080],
    ] as const) {
      const { stage } = stageFor(pw, ph);
      const layout = cardLayout(stage);
      expect(layout.cy - layout.h / 2).toBeGreaterThan(0);
      expect(layout.cy + layout.h / 2).toBeLessThan(stage.h);
      expect(layout.w).toBeLessThan(stage.w);
    }
  });
});
