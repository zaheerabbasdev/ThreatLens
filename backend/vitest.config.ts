import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      NODE_ENV: "test",
      PORT: "4001",
      CORS_ALLOWED_ORIGINS: "http://localhost:5173",
    },
  },
});
