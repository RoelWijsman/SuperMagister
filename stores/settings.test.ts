import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, migrateSettings } from "./settings";

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

  it("heeft geen standaard woonplaats meer: de oude Utrecht-standaard wordt leeg", () => {
    expect(DEFAULT_SETTINGS.weatherPlace).toBeNull();
    const utrecht = { name: "Utrecht", region: "Utrecht", latitude: 52.0908, longitude: 5.1222 };
    expect(migrateSettings({ weatherPlace: utrecht }, 2)).toEqual({ weatherPlace: null });
    // Een zelf gekozen plaats blijft staan.
    const zwolle = { name: "Zwolle", region: "Overijssel", latitude: 52.5125, longitude: 6.0944 };
    expect(migrateSettings({ weatherPlace: zwolle }, 2)).toEqual({ weatherPlace: zwolle });
  });
});
