/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    // Bare strings like "node_modules" only match a top-level dir named
    // exactly that — they silently fail to exclude nested instances like
    // backend/node_modules, which let this suite start running zod's own
    // internal test files out of the backend's dependency tree. Globs fix
    // that; "backend" is also excluded outright since it's a separate
    // project with its own test runner.
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**", "backend/**"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["e2e/**", "**/*.config.*", "src/mocks/**"],
    },
  },
});
