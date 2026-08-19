import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { InMemoryUserRepository, seedDemoUsers } from "./repositories/user.repository.js";

const userRepository = new InMemoryUserRepository();
// Phase 5 replaces this with a real database — nothing above this line's
// call site needs to change when that happens (AppDependencies is the seam).
await seedDemoUsers(userRepository);

const app = createApp({ userRepository });

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "ThreatLens backend listening");
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close((err) => {
    if (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
    process.exit(0);
  });
  // Don't hang forever waiting for in-flight connections to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});
