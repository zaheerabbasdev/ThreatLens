import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { InMemoryUserRepository, seedDemoUsers } from "./repositories/user.repository.js";
import { InMemoryIncidentRepository } from "./repositories/incident.repository.js";
import { seedDemoIncidents } from "./repositories/incident.seed.js";
import { InMemoryAlertRepository } from "./repositories/alert.repository.js";
import { seedDemoAlerts } from "./repositories/alert.seed.js";
import { InMemoryInvestigationRepository } from "./repositories/investigation.repository.js";
import { seedDemoInvestigations } from "./repositories/investigation.seed.js";
import { InMemoryOrganizationRepository } from "./repositories/organization.repository.js";
import { seedDemoOrganization } from "./repositories/organization.seed.js";

// Phase 5 replaces these with a real database — nothing above this line's
// call site needs to change when that happens (AppDependencies is the seam).
const organizationRepository = new InMemoryOrganizationRepository();
seedDemoOrganization(organizationRepository);
const userRepository = new InMemoryUserRepository();
await seedDemoUsers(userRepository);
const incidentRepository = new InMemoryIncidentRepository();
seedDemoIncidents(incidentRepository);
const alertRepository = new InMemoryAlertRepository();
seedDemoAlerts(alertRepository);
const investigationRepository = new InMemoryInvestigationRepository();
seedDemoInvestigations(investigationRepository);

const app = createApp({
  userRepository,
  incidentRepository,
  alertRepository,
  investigationRepository,
  organizationRepository,
});

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
