import { describe, expect, it } from "vitest";
import { buildLinkFragment } from "./fragment";
import { normalizeSchool, parsePasted } from "./paste";

const NOW = Date.UTC(2026, 9, 7, 12, 0);
const EXP = Math.floor(NOW / 1000) + 3600;

/** Een nep-JWT: kop, inhoud en handtekening in base64url (niet echt ondertekend). */
function fakeJwt(payload: Record<string, unknown>) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "RS256", typ: "JWT" })}.${encode(payload)}.bmVwaGFuZHRla2VuaW5n`;
}

const JWT = fakeJwt({ sub: "1002", exp: EXP });

describe("normalizeSchool", () => {
  it("snapt een naam, een adres en een hele link", () => {
    expect(normalizeSchool("voorbeeld")).toBe("voorbeeld.magister.net");
    expect(normalizeSchool(" Voorbeeld.Magister.net ")).toBe("voorbeeld.magister.net");
    expect(normalizeSchool("https://voorbeeld.magister.net/magister/#/vandaag")).toBe(
      "voorbeeld.magister.net",
    );
  });

  it("weigert alles wat geen Magister-school is", () => {
    expect(normalizeSchool("")).toBeNull();
    expect(normalizeSchool("evil.com")).toBeNull();
    expect(normalizeSchool("https://voorbeeld.magister.net.evil.com")).toBeNull();
    expect(normalizeSchool("accounts.magister.net")).toBeNull();
    expect(normalizeSchool("twee woorden")).toBeNull();
  });
});

describe("parsePasted", () => {
  it("snapt de waarde van de oidc.user-sleutel uit sessionStorage", () => {
    const value = JSON.stringify({
      id_token: "niet-nodig",
      access_token: JWT,
      token_type: "Bearer",
      expires_at: EXP,
      profile: { sub: "1002" },
    });
    expect(parsePasted(value, { school: "voorbeeld", now: NOW })).toEqual({
      kind: "ok",
      session: { token: JWT, schoolHost: "voorbeeld.magister.net", expiresAt: EXP * 1000 },
    });
  });

  it("snapt een link van de bookmarklet, met school erin", () => {
    const link = `http://localhost:3100/koppelen${buildLinkFragment({
      token: JWT,
      expiresAt: EXP,
      schoolHost: "voorbeeld.magister.net",
    })}`;
    expect(parsePasted(link, { now: NOW })).toMatchObject({
      kind: "ok",
      session: { schoolHost: "voorbeeld.magister.net" },
    });
  });

  it("snapt een los token en haalt het verloopmoment uit het token zelf", () => {
    expect(parsePasted(`Bearer ${JWT}`, { school: "voorbeeld", now: NOW })).toEqual({
      kind: "ok",
      session: { token: JWT, schoolHost: "voorbeeld.magister.net", expiresAt: EXP * 1000 },
    });
  });

  it("vindt de school in het token als Magister hem erin zet", () => {
    const withTenant = fakeJwt({
      exp: EXP,
      "urn:magister:claims:iam:tenant": "voorbeeld.magister.net",
    });
    expect(parsePasted(withTenant, { now: NOW })).toMatchObject({
      session: { schoolHost: "voorbeeld.magister.net" },
    });
  });

  it("vraagt om de school als die nergens in staat", () => {
    expect(parsePasted(JWT, { now: NOW })).toEqual({ kind: "ongeldig", reason: "school-nodig" });
  });

  it("negeert aanhalingstekens van de console", () => {
    const quoted = JSON.stringify(JSON.stringify({ access_token: JWT, expires_at: EXP }));
    expect(parsePasted(quoted, { school: "voorbeeld", now: NOW })).toMatchObject({ kind: "ok" });
  });

  it("zegt het eerlijk bij leeg, onzin of een verlopen token", () => {
    expect(parsePasted("  ", { now: NOW })).toEqual({ kind: "ongeldig", reason: "leeg" });
    expect(parsePasted("mijn wachtwoord is geheim", { school: "voorbeeld", now: NOW })).toEqual({
      kind: "ongeldig",
      reason: "onbekend",
    });
    const old = fakeJwt({ exp: Math.floor(NOW / 1000) - 60 });
    expect(parsePasted(old, { school: "voorbeeld", now: NOW })).toEqual({
      kind: "ongeldig",
      reason: "verlopen",
    });
  });

  it("weigert een verkeerde school", () => {
    expect(parsePasted(JWT, { school: "evil.com", now: NOW })).toEqual({
      kind: "ongeldig",
      reason: "school",
    });
  });
});
