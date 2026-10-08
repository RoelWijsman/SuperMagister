import { describe, expect, it } from "vitest";
import { buildLinkFragment, parseLinkFragment, toExpiresAt } from "./fragment";

const NOW = Date.UTC(2026, 9, 7, 12, 0);
const TOKEN = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXVy-_";
const IN_AN_HOUR = Math.floor(NOW / 1000) + 3600;

describe("toExpiresAt", () => {
  it("snapt seconden (zoals Magister) en milliseconden", () => {
    expect(toExpiresAt(IN_AN_HOUR)).toBe(IN_AN_HOUR * 1000);
    expect(toExpiresAt(String(IN_AN_HOUR))).toBe(IN_AN_HOUR * 1000);
    expect(toExpiresAt(NOW + 5000)).toBe(NOW + 5000);
  });

  it("geeft null bij iets onbruikbaars", () => {
    expect(toExpiresAt("")).toBeNull();
    expect(toExpiresAt("morgen")).toBeNull();
    expect(toExpiresAt(-5)).toBeNull();
    expect(toExpiresAt(undefined)).toBeNull();
  });
});

describe("parseLinkFragment", () => {
  const fragment = buildLinkFragment({
    token: TOKEN,
    expiresAt: IN_AN_HOUR,
    schoolHost: "voorbeeld.magister.net",
  });

  it("zet token, school en verloopmoment alleen in het fragment", () => {
    expect(fragment.startsWith("#")).toBe(true);
    expect(fragment).not.toContain("?");
    expect(fragment).toContain("school=voorbeeld.magister.net");
  });

  it("leest een geldig fragment van de bookmarklet", () => {
    expect(parseLinkFragment(fragment, NOW)).toEqual({
      kind: "ok",
      session: {
        token: TOKEN,
        schoolHost: "voorbeeld.magister.net",
        expiresAt: IN_AN_HOUR * 1000,
      },
    });
  });

  it("negeert gewone ankers en een leeg fragment", () => {
    expect(parseLinkFragment("", NOW)).toEqual({ kind: "geen" });
    expect(parseLinkFragment("#plakken", NOW)).toEqual({ kind: "geen" });
  });

  it("weigert een school die geen Magister-school is", () => {
    const evil = buildLinkFragment({ token: TOKEN, expiresAt: IN_AN_HOUR, schoolHost: "evil.com" });
    expect(parseLinkFragment(evil, NOW)).toEqual({ kind: "ongeldig", reason: "school" });
    const sneaky = fragment.replace("voorbeeld.magister.net", "a.magister.net.evil.com");
    expect(parseLinkFragment(sneaky, NOW)).toEqual({ kind: "ongeldig", reason: "school" });
  });

  it("weigert een token met vreemde tekens of zonder inhoud", () => {
    for (const token of ["", "kort", `${TOKEN}<script>`, `${TOKEN} extra`]) {
      const bad = buildLinkFragment({ token, expiresAt: IN_AN_HOUR, schoolHost: "a.magister.net" });
      expect(parseLinkFragment(bad, NOW)).toEqual({ kind: "ongeldig", reason: "token" });
    }
  });

  it("weigert een token dat al verlopen is", () => {
    const old = buildLinkFragment({
      token: TOKEN,
      expiresAt: Math.floor(NOW / 1000) - 10,
      schoolHost: "a.magister.net",
    });
    expect(parseLinkFragment(old, NOW)).toEqual({ kind: "ongeldig", reason: "verlopen" });
  });

  it("accepteert een onbekend verloopmoment (dan merken we het aan een 401)", () => {
    const unknown = `#koppel=1&token=${TOKEN}&school=a.magister.net`;
    expect(parseLinkFragment(unknown, NOW)).toMatchObject({
      kind: "ok",
      session: { expiresAt: null },
    });
  });

  it("maakt de school klein en zonder spaties", () => {
    const loud = buildLinkFragment({
      token: TOKEN,
      expiresAt: IN_AN_HOUR,
      schoolHost: " Voorbeeld.Magister.NET ",
    });
    expect(parseLinkFragment(loud, NOW)).toMatchObject({
      session: { schoolHost: "voorbeeld.magister.net" },
    });
  });
});
