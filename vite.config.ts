/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    globals: true,
    // Default to a fast node env for the pure core; component tests opt into
    // jsdom per-file via a `@vitest-environment jsdom` docblock.
    environment: "node",
    include: ["test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Measure the unit-testable logic layer. UI components and browser-only
      // glue (canvas / Web Share) are exercised by the Playwright e2e suite,
      // which v8 unit coverage does not instrument.
      include: ["src/core/**", "src/lib/**"],
      exclude: ["src/lib/canvasShare.ts"],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 90,
      },
    },
  },
});
