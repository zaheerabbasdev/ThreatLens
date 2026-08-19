import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      NODE_ENV: "test",
      PORT: "4001",
      CORS_ALLOWED_ORIGINS: "http://localhost:5173",
      // Test-only fixed values — never real secrets, never reused outside this suite.
      JWT_ACCESS_SECRET: "test-access-secret-not-for-real-use-0123456789",
      JWT_REFRESH_SECRET: "test-refresh-secret-not-for-real-use-0123456789",
    },
  },
});
