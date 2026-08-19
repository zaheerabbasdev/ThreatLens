import { defineConfig } from "vitest/config";

/**
 * Runs only the *.mongo.test.ts suite — real integration tests against a
 * real MongoDB via mongodb-memory-server. Separate from the default `npm
 * test` config (vitest.config.ts) because this one needs that library's
 * ~600MB binary download to succeed first; see the header comment on
 * user.repository.mongo.test.ts and backend/README.md's Phase 5 section.
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.mongo.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      PORT: "4002",
      CORS_ALLOWED_ORIGINS: "http://localhost:5173",
      JWT_ACCESS_SECRET: "test-access-secret-not-for-real-use-0123456789",
      JWT_REFRESH_SECRET: "test-refresh-secret-not-for-real-use-0123456789",
    },
  },
});
