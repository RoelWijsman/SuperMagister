import { describe, expect, it } from "vitest";
import { buildCsp } from "./csp";

const directives = (csp: string) =>
  new Map(
    csp
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...values] = part.split(/\s+/);
        return [name!, values] as const;
      }),
  );

describe("buildCsp", () => {
  const prod = directives(buildCsp({ nonce: "abc123", dev: false }));
  const dev = directives(buildCsp({ nonce: "abc123", dev: true }));

  it("laat alleen eigen scripts met de nonce toe, nooit inline of eval", () => {
    expect(prod.get("script-src")).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
    expect(prod.get("script-src")).not.toContain("'unsafe-inline'");
    expect(prod.get("script-src")).not.toContain("'unsafe-eval'");
  });

  it("praat alleen met de eigen server en het weer, nooit rechtstreeks met Magister", () => {
    expect(prod.get("connect-src")).toEqual([
      "'self'",
      "https://api.open-meteo.com",
      "https://geocoding-api.open-meteo.com",
    ]);
    expect([...prod.values()].flat().some((value) => value.includes("magister"))).toBe(false);
  });

  it("blokkeert plugins, inlijsten en vreemde formulieren", () => {
    expect(prod.get("object-src")).toEqual(["'none'"]);
    expect(prod.get("frame-ancestors")).toEqual(["'none'"]);
    expect(prod.get("base-uri")).toEqual(["'self'"]);
    expect(prod.get("form-action")).toEqual(["'self'"]);
    expect(prod.get("default-src")).toEqual(["'self'"]);
  });

  it("staat video's en deelplaatjes als blob toe", () => {
    expect(prod.get("media-src")).toContain("blob:");
    expect(prod.get("img-src")).toEqual(["'self'", "data:", "blob:"]);
  });

  it("dwingt https af in productie, maar niet op localhost tijdens het bouwen", () => {
    expect(prod.has("upgrade-insecure-requests")).toBe(true);
    expect(dev.has("upgrade-insecure-requests")).toBe(false);
    expect(dev.get("script-src")).toContain("'unsafe-eval'");
  });
});
