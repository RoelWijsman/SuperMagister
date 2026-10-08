import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Datums worden in lokale tijd berekend; vastzetten maakt de tests overal gelijk.
    env: { TZ: "Europe/Amsterdam" },
    include: ["lib/**/*.test.ts", "stores/**/*.test.ts", "extension/**/*.test.ts"],
  },
});
