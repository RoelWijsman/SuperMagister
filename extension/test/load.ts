import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

const ROOT = join(__dirname, "..");

/**
 * Laadt gedeelde extensie-scripts zoals de browser dat doet: als losse scripts
 * in één global (hier een vm-context). Geeft de namespace SM terug.
 */
export function loadExtensionScripts<T = Record<string, unknown>>(
  files: readonly string[],
  globals: Record<string, unknown> = {},
): T {
  const sandbox: Record<string, unknown> = {
    URL,
    URLSearchParams,
    AbortSignal,
    ...globals,
  };
  return runScripts<T>(files, sandbox);
}

/** Draait extensie-scripts in een bestaande sandbox (die wordt de global). */
export function runScripts<T = Record<string, unknown>>(
  files: readonly string[],
  sandbox: Record<string, unknown>,
): T {
  for (const file of files) {
    runInNewContext(readFileSync(join(ROOT, file), "utf8"), sandbox, { filename: file });
  }
  return sandbox.SM as T;
}

export const SHARED = [
  "shared/protocol.js",
  "shared/magister-session.js",
  "shared/magister-api.js",
  "shared/renew.js",
  "shared/badge.js",
] as const;
