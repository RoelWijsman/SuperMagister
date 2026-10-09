#!/usr/bin/env node
/**
 * Controleert de instellingen van het ontwikkelaarsdashboard, zonder ze te tonen.
 *
 *   npm run dashboard:check                 leest .env.local
 *   npm run dashboard:check -- .env.vercel  leest een ander bestand
 *
 * De productiewaarden van Vercel haal je zo binnen (het bestand staat in
 * .gitignore, want alles wat met .env begint):
 *
 *   npx vercel env pull .env.vercel --environment=production
 *
 * Het script zegt per variabele of hij er is en hoe lang hij is, en wat er
 * eventueel niet klopt. De waarden zelf komen nooit op het scherm: het pad
 * alleen als de eerste 4 tekens plus de lengte.
 */
import { existsSync } from "node:fs";
import { checkDashboardConfig, cleanValue, normalizePath } from "../lib/dev-dashboard/auth.ts";

const file = process.argv[2] ?? ".env.local";
const NAMES = ["DEV_DASHBOARD_PATH", "DEV_DASHBOARD_PASSWORD", "DEV_DASHBOARD_KEY"];

if (!existsSync(file)) {
  console.error(`Bestand ${file} niet gevonden.`);
  process.exit(2);
}

// Alleen in een los object lezen, niet in process.env van dit script.
const before = Object.fromEntries(NAMES.map((name) => [name, process.env[name]]));
for (const name of NAMES) delete process.env[name];
process.loadEnvFile(file);
const env = Object.fromEntries(NAMES.map((name) => [name, process.env[name]]));
for (const name of NAMES) {
  if (before[name] === undefined) delete process.env[name];
  else process.env[name] = before[name];
}

console.log(`Dashboard-instellingen uit ${file}:\n`);
for (const name of NAMES) {
  const raw = env[name];
  if (raw === undefined) {
    console.log(`  ${name.padEnd(24)} ontbreekt`);
    continue;
  }
  const clean = cleanValue(raw);
  const notes = [];
  if (clean !== raw) notes.push("spaties of aanhalingstekens eromheen (worden genegeerd)");
  if (name === "DEV_DASHBOARD_PATH") {
    const path = normalizePath(raw);
    if (!clean.startsWith("/")) notes.push("geen / vooraan (wordt toegevoegd)");
    console.log(
      `  ${name.padEnd(24)} aanwezig, wordt ${path.slice(0, 5)}… (${path.length} tekens)` +
        (notes.length ? ` · ${notes.join(", ")}` : ""),
    );
  } else {
    console.log(
      `  ${name.padEnd(24)} aanwezig, ${clean.length} tekens` +
        (notes.length ? ` · ${notes.join(", ")}` : ""),
    );
  }
}

const result = checkDashboardConfig(env);
console.log("");
if (result.ok) {
  console.log("In orde. Het dashboard staat aan zodra deze waarden in een deploy zitten.");
  console.log(
    `Inloggen: https://supermagister.nl${result.config.path.slice(0, 5)}…?key=<DEV_DASHBOARD_KEY>`,
  );
  process.exit(0);
}
console.log("Het dashboard staat UIT, omdat:");
for (const reason of result.reasons) console.log(`  - ${reason}`);
process.exit(1);
