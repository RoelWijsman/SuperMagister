import { describe, expect, it } from "vitest";
import { migrateSettings } from "./settings";

describe("migrateSettings", () => {
  it("houdt gokken uit als je dat in de eerste versie had uitgezet", () => {
    const migrated = migrateSettings({ walkoutSpeed: "snel", guessEnabled: false }, 1);
    expect(migrated).toEqual({ walkoutSpeed: "snel", guessMode: "uit" });
  });

  it("laat gokken bij elke kaart staan als het aan stond", () => {
    expect(migrateSettings({ guessEnabled: true }, 1)).toEqual({ guessMode: "elke" });
  });

  it("raakt een nieuwere opslag niet aan", () => {
    expect(migrateSettings({ guessMode: "laatste" }, 2)).toEqual({ guessMode: "laatste" });
  });

  it("overleeft lege of kapotte opslag", () => {
    expect(migrateSettings(null, 1)).toEqual({});
    expect(migrateSettings("kapot", 1)).toEqual({});
  });
});
