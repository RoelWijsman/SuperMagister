import { describe, expect, it } from "vitest";
import { extensionSupport } from "./browser";

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const EDGE = `${CHROME} Edg/141.0.0.0`;
const FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0";
const SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

describe("extensionSupport", () => {
  it("biedt de extensie aan in Chrome en Edge op een computer", () => {
    expect(extensionSupport({ userAgent: CHROME })).toBe("ja");
    expect(extensionSupport({ userAgent: EDGE })).toBe("ja");
  });

  it("verwijst andere browsers en telefoons naar de bladwijzer en het plakveld", () => {
    expect(extensionSupport({ userAgent: FIREFOX })).toBe("andere-browser");
    expect(extensionSupport({ userAgent: SAFARI })).toBe("andere-browser");
    expect(extensionSupport({ userAgent: ANDROID })).toBe("telefoon");
    expect(extensionSupport({ userAgent: IPHONE })).toBe("telefoon");
  });

  it("gebruikt userAgentData als de browser die heeft", () => {
    expect(
      extensionSupport({
        userAgent: "",
        userAgentData: { mobile: false, brands: [{ brand: "Microsoft Edge" }] },
      }),
    ).toBe("ja");
    expect(
      extensionSupport({
        userAgent: "",
        userAgentData: { mobile: true, brands: [{ brand: "Google Chrome" }] },
      }),
    ).toBe("telefoon");
  });
});
