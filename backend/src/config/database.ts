import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

/**
 * MongoDB connection management (spec §8/§12). Never called with a
 * hardcoded connection string — the URI always comes from validated env
 * config, and its absence is a legitimate, supported "run on in-memory
 * repositories instead" mode (see server.ts), not an error.
 */
export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  const connection = await mongoose.connect(uri, {
    // Fail fast rather than hang indefinitely if the cluster is unreachable —
    // an operator misconfiguration should surface at startup, not as a
    // mysteriously-timed-out first request.
    serverSelectionTimeoutMS: 10_000,
    // TLS is on by default for mongodb+srv:// (Atlas) URIs; for a plain
    // mongodb:// URI (e.g. local dev), this only enforces it if the URI
    // itself requests it — this call never silently downgrades a caller's
    // own connection string, it just doesn't add insecurity on top of it.
  });

  logger.info({ host: connection.connection.host, db: connection.connection.name }, "Connected to MongoDB");
  return connection;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
