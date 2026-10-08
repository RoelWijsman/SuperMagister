import { describe, expect, it } from "vitest";
import { siteUrlFrom } from "./site";

describe("siteUrlFrom", () => {
  it("neemt het ingestelde adres, zonder pad of slash", () => {
    expect(siteUrlFrom({ NEXT_PUBLIC_SITE_URL: "https://supermagister.nl/" })).toBe(
      "https://supermagister.nl",
    );
    expect(siteUrlFrom({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000/vandaag" })).toBe(
      "http://localhost:3000",
    );
  });

  it("maakt nooit een www-adres", () => {
    expect(siteUrlFrom({ NEXT_PUBLIC_SITE_URL: "https://www.supermagister.nl" })).toBe(
      "https://supermagister.nl",
    );
  });

  it("valt terug op het productiedomein van Vercel, en anders op localhost", () => {
    expect(siteUrlFrom({ VERCEL_PROJECT_PRODUCTION_URL: "supermagister.nl" })).toBe(
      "https://supermagister.nl",
    );
    expect(siteUrlFrom({})).toBe("http://localhost:3000");
    expect(siteUrlFrom({ NEXT_PUBLIC_SITE_URL: "ftp://raar" })).toBe("http://localhost:3000");
  });
});
