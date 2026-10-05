import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { buildThemeScript } from "./script";
import { getPreset } from "./themes";

interface RunOptions {
  hour?: number;
  prefersLight?: boolean;
  raw?: string;
}

function run(stored?: Record<string, unknown>, options: RunOptions = {}) {
  const attrs: Record<string, string> = {};
  const styles: Record<string, string> = {};
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...args: []) {
      if (args.length) super(...args);
      else super(2026, 9, 5, options.hour ?? 12, 0);
    }
  }
  const raw = options.raw ?? (stored ? JSON.stringify({ state: stored, version: 1 }) : null);
  vm.runInNewContext(buildThemeScript(), {
    document: {
      documentElement: {
        setAttribute: (key: string, value: string) => (attrs[key] = String(value)),
        style: { setProperty: (key: string, value: string) => (styles[key] = value) },
      },
    },
    localStorage: { getItem: (key: string) => (key === STORAGE_KEYS.settings ? raw : null) },
    matchMedia: () => ({ matches: Boolean(options.prefersLight) }),
    Date: FakeDate,
    JSON,
  });
  return { attrs, styles };
}

describe("buildThemeScript", () => {
  it("falls back to the dark Aurora theme without stored settings", () => {
    const { attrs, styles } = run();
    expect(attrs["data-theme"]).toBe("aurora");
    expect(attrs["data-mode"]).toBe("dark");
    expect(styles["--t-accent"]).toBe(getPreset("aurora").accent);
  });

  it("applies a stored preset and light mode", () => {
    const { attrs, styles } = run({ theme: "oceaan", colorMode: "light" });
    expect(attrs["data-theme"]).toBe("oceaan");
    expect(attrs["data-mode"]).toBe("light");
    expect(styles["--t-accent"]).toBe(getPreset("oceaan").accent);
  });

  it("follows the system for color mode 'system'", () => {
    expect(run({ colorMode: "system" }, { prefersLight: true }).attrs["data-mode"]).toBe("light");
    expect(run({ colorMode: "system" }, { prefersLight: false }).attrs["data-mode"]).toBe("dark");
  });

  it("applies the variables of a custom theme", () => {
    const { attrs, styles } = run({ theme: "custom", customVars: { "--t-accent": "#123456" } });
    expect(attrs["data-theme"]).toBe("custom");
    expect(styles["--t-accent"]).toBe("#123456");
  });

  it("sets the time of day from the clock", () => {
    expect(run(undefined, { hour: 7 }).attrs["data-tod"]).toBe("ochtend");
    expect(run(undefined, { hour: 13 }).attrs["data-tod"]).toBe("dag");
    expect(run(undefined, { hour: 19 }).attrs["data-tod"]).toBe("avond");
    expect(run(undefined, { hour: 23 }).attrs["data-tod"]).toBe("nacht");
    expect(run({ skyFollowsTime: false }, { hour: 7 }).attrs["data-tod"]).toBe("off");
  });

  it("sets privacy, ambient motion and motion preferences", () => {
    const { attrs } = run({ privacyAuto: true, ambientMotion: false, motion: "reduced" });
    expect(attrs["data-privacy"]).toBe("on");
    expect(attrs["data-ambient"]).toBe("off");
    expect(attrs["data-motion"]).toBe("reduced");
  });

  it("survives corrupt storage", () => {
    const { attrs } = run(undefined, { raw: "{kapot" });
    expect(attrs["data-theme"]).toBe("aurora");
  });
});
