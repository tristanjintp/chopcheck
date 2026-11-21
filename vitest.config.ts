import { defineConfig } from "vitest/config";
import path from "node:path";

// Les tests sont dans tests/ (règles, jeu d'évaluation).
// Environnement node : pas de DOM, les tests ne doivent pas appeler le réseau.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
