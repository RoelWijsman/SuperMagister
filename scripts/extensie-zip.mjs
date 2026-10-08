/**
 * Pakt de extensie in voor de Chrome Web Store (en Edge Add-ons):
 *   npm run extension:zip -- --app https://jouw-supermagister.nl
 * of met NEXT_PUBLIC_APP_URL in je omgeving. Het adres van de app is nodig: de
 * extensie praat alleen met dat ene domein. In de zip staan geen
 * localhost-rechten, geen tests en geen bronbestanden van de iconen.
 * Uitkomst: dist/supermagister-extensie-{versie}.zip
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { deflateRawSync } from "node:zlib";
import { crc32 } from "./lib/png.mjs";

const ROOT = join(import.meta.dirname, "..");
const SOURCE = join(ROOT, "extension");

/** Alleen een https-adres (zonder pad) mag de app zijn. */
export function appOrigin(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`"${url}" is geen geldig adres.`);
  }
  if (parsed.protocol !== "https:")
    throw new Error("Het adres van de app moet met https:// beginnen.");
  if (["localhost", "127.0.0.1"].includes(parsed.hostname))
    throw new Error("Localhost hoort niet in de versie voor de Web Store.");
  return parsed.origin;
}

/** Het manifest voor de Web Store: localhost eruit, het echte domein erin. */
export function productionManifest(manifest, origin) {
  const isLocal = (pattern) => /^https?:\/\/(localhost|127\.0\.0\.1)/.test(pattern);
  return {
    ...manifest,
    host_permissions: [...manifest.host_permissions.filter((p) => !isLocal(p)), `${origin}/*`],
    content_scripts: manifest.content_scripts.map((script) =>
      script.js.includes("content/app.js") ? { ...script, matches: [`${origin}/*`] } : script,
    ),
  };
}

/** shared/config.js met alleen het echte adres van de app. */
export function productionConfig(origin) {
  return `// @ts-check
/** Waar de app draait (gemaakt door npm run extension:zip). */
(function (root) {
  const SM = (root.SM = root.SM || {});

  SM.CONFIG = Object.freeze({
    appUrl: ${JSON.stringify(origin)},
    appOrigins: Object.freeze([${JSON.stringify(origin)}]),
  });

  /** @param {string | undefined | null} origin */
  SM.isAppOrigin = function (origin) {
    return typeof origin === "string" && SM.CONFIG.appOrigins.includes(origin);
  };
})(globalThis);
`;
}

/** Wat er wel en niet in de zip hoort. */
export function includeFile(path) {
  const parts = path.split("/");
  if (parts[0] === "test") return false;
  if (/\.test\.[jt]s$/.test(path)) return false;
  if (parts[0] === "icons" && !path.endsWith(".png")) return false;
  return true;
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/** Een eenvoudige zip (deflate), genoeg voor de Web Store. */
export function createZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  // Vaste datum (1 januari 2026), zodat dezelfde bestanden dezelfde zip geven.
  const time = 0;
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1;
  for (const { name, data } of entries) {
    const nameBuffer = Buffer.from(name, "utf8");
    const compressed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // namen in UTF-8
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuffer, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuffer);
    offset += local.length + nameBuffer.length + compressed.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];
  const inline = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return inline?.slice(name.length + 3);
}

function main() {
  const url = argument("app") ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    console.error(
      "Geef het adres van de app mee, bijvoorbeeld:\n  npm run extension:zip -- --app https://jouw-supermagister.nl\n(of zet NEXT_PUBLIC_APP_URL).",
    );
    process.exit(1);
  }
  const origin = appOrigin(url);
  const manifest = JSON.parse(readFileSync(join(SOURCE, "manifest.json"), "utf8"));
  const entries = listFiles(SOURCE)
    .map((full) => relative(SOURCE, full).split(sep).join("/"))
    .filter(includeFile)
    .sort()
    .map((name) => {
      if (name === "manifest.json")
        return {
          name,
          data: Buffer.from(JSON.stringify(productionManifest(manifest, origin), null, 2)),
        };
      if (name === "shared/config.js") return { name, data: Buffer.from(productionConfig(origin)) };
      return { name, data: readFileSync(join(SOURCE, name)) };
    });
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  const target = join(ROOT, "dist", `supermagister-extensie-${manifest.version}.zip`);
  writeFileSync(target, createZip(entries));
  console.log(`Klaar: ${relative(ROOT, target)} (${entries.length} bestanden, voor ${origin}).`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
