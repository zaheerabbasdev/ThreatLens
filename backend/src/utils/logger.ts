import pino from "pino";
import { env } from "../config/env.js";

/**
 * Structured logging (spec §37). `redact` is a hard backstop, not the only
 * line of defense — call sites still shouldn't pass secrets into logged
 * objects in the first place — but it guarantees these specific fields
 * never reach an output sink even if one slips through.
 */
export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "password",
      "*.password",
      "req.headers.authorization",
      "req.headers.cookie",
      "*.accessToken",
      "*.refreshToken",
      "*.token",
      "*.apiKey",
      "*.secret",
    ],
    censor: "[redacted]",
  },
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
      : undefined,
});
