import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  appOrigin,
  createZip,
  includeFile,
  productionConfig,
  productionManifest,
} from "../../scripts/extensie-zip.mjs";

const manifest = JSON.parse(readFileSync(join(__dirname, "..", "manifest.json"), "utf8"));
const ORIGIN = "https://supermagister.example.nl";

/** Leest een zip terug (alleen wat createZip maakt). */
function readZip(zip: Buffer) {
  const files: Record<string, string> = {};
  let offset = 0;
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const size = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const name = zip.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    const data = zip.subarray(offset + 30 + nameLength, offset + 30 + nameLength + size);
    files[name] = inflateRawSync(data).toString("utf8");
    offset += 30 + nameLength + size;
  }
  expect(zip.readUInt32LE(zip.length - 22)).toBe(0x06054b50);
  return files;
}

describe("npm run extension:zip", () => {
  it("haalt localhost uit het manifest en zet het echte domein erin", () => {
    const prod = productionManifest(manifest, ORIGIN);
    const text = JSON.stringify(prod);
    expect(text).not.toMatch(/localhost|127\.0\.0\.1/);
    expect(prod.host_permissions).toEqual(["https://*.magister.net/*", `${ORIGIN}/*`]);
    expect(prod.permissions).toEqual(["storage", "notifications", "alarms"]);
    const bridge = prod.content_scripts.find((s: { js: string[] }) =>
      s.js.includes("content/app.js"),
    );
    expect(bridge.matches).toEqual([`${ORIGIN}/*`]);
  });

  it("laat de extensie alleen met het echte domein praten", () => {
    const sandbox: Record<string, unknown> = {};
    runInNewContext(productionConfig(ORIGIN), sandbox);
    const config = sandbox.SM as {
      isAppOrigin: (o: string) => boolean;
      CONFIG: { appUrl: string };
    };
    expect(config.CONFIG.appUrl).toBe(ORIGIN);
    expect(config.isAppOrigin(ORIGIN)).toBe(true);
    expect(config.isAppOrigin("http://localhost:3000")).toBe(false);
    expect(config.isAppOrigin("https://evil.example.com")).toBe(false);
  });

  it("weigert een adres zonder https, of localhost", () => {
    expect(appOrigin("https://supermagister.example.nl/pad")).toBe(ORIGIN);
    expect(() => appOrigin("http://supermagister.example.nl")).toThrow();
    expect(() => appOrigin("https://localhost:3000")).toThrow();
    expect(() => appOrigin("geen adres")).toThrow();
  });

  it("laat tests en bronbestanden van de iconen buiten de zip", () => {
    expect(includeFile("manifest.json")).toBe(true);
    expect(includeFile("icons/icon-128.png")).toBe(true);
    expect(includeFile("icons/logo.svg")).toBe(false);
    expect(includeFile("test/shared.test.ts")).toBe(false);
    expect(includeFile("background.js")).toBe(true);
  });

  it("maakt een zip die terug te lezen is", () => {
    const zip = createZip([
      { name: "manifest.json", data: Buffer.from('{"a":1}') },
      { name: "shared/config.js", data: Buffer.from("// config") },
    ]);
    expect(readZip(zip)).toEqual({ "manifest.json": '{"a":1}', "shared/config.js": "// config" });
  });
});
