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
    exclude: ["node_modules", "dist", "e2e"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["e2e/**", "**/*.config.*", "src/mocks/**"],
    },
  },
});
