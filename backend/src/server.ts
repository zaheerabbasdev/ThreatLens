import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import type { AppDependencies } from "./app.js";

import { InMemoryUserRepository, seedDemoUsers } from "./repositories/user.repository.js";
import { MongoUserRepository } from "./repositories/user.repository.mongo.js";
import { InMemoryIncidentRepository } from "./repositories/incident.repository.js";
import { MongoIncidentRepository } from "./repositories/incident.repository.mongo.js";
import { seedDemoIncidents } from "./repositories/incident.seed.js";
import { InMemoryAlertRepository } from "./repositories/alert.repository.js";
import { MongoAlertRepository } from "./repositories/alert.repository.mongo.js";
import { seedDemoAlerts } from "./repositories/alert.seed.js";
import { InMemoryInvestigationRepository } from "./repositories/investigation.repository.js";
import { MongoInvestigationRepository } from "./repositories/investigation.repository.mongo.js";
import { seedDemoInvestigations } from "./repositories/investigation.seed.js";
import { InMemoryOrganizationRepository } from "./repositories/organization.repository.js";
import { MongoOrganizationRepository } from "./repositories/organization.repository.mongo.js";
import { seedDemoOrganization } from "./repositories/organization.seed.js";
import { InMemoryIndicatorRepository } from "./repositories/indicator.repository.js";
import { MongoIndicatorRepository } from "./repositories/indicator.repository.mongo.js";
import { seedDemoIndicators } from "./repositories/indicator.seed.js";
import { InMemoryReportRepository } from "./repositories/report.repository.js";
import { MongoReportRepository } from "./repositories/report.repository.mongo.js";
import { seedDemoReports } from "./repositories/report.seed.js";
import { InMemoryMitreRepository } from "./repositories/mitre.repository.js";
import { MongoMitreRepository } from "./repositories/mitre.repository.mongo.js";
import { seedMitreData } from "./repositories/mitre.seed.js";
import { InMemoryThreatActorRepository } from "./repositories/threatActor.repository.js";
import { MongoThreatActorRepository } from "./repositories/threatActor.repository.mongo.js";
import { seedThreatActors } from "./repositories/threatActor.seed.js";
import { InMemoryAuditLogRepository } from "./repositories/auditLog.repository.js";

/**
 * Builds every repository, seeded with the same demo data either way — the
 * only thing that changes based on MONGODB_URI is which storage backend
 * they're backed by (spec §5: config decides behavior, nothing is
 * hardcoded). See backend/README.md's Phase 5 section for the one thing
 * this doesn't cover: the Mongo path hasn't been exercised against a real
 * database in the environment this was built in.
 */
async function buildRepositories(): Promise<AppDependencies> {
  if (env.MONGODB_URI) {
    await connectDatabase(env.MONGODB_URI);
    logger.info("Using MongoDB-backed repositories");

    const organizationRepository = new MongoOrganizationRepository();
    await seedDemoOrganization(organizationRepository);
    const userRepository = new MongoUserRepository();
    await seedDemoUsers(userRepository);
    const incidentRepository = new MongoIncidentRepository();
    await seedDemoIncidents(incidentRepository);
    const alertRepository = new MongoAlertRepository();
    await seedDemoAlerts(alertRepository);
    const indicatorRepository = new MongoIndicatorRepository();
    await seedDemoIndicators(indicatorRepository);
    const investigationRepository = new MongoInvestigationRepository();
    await seedDemoInvestigations(investigationRepository);
    const reportRepository = new MongoReportRepository();
    await seedDemoReports(reportRepository);
    const mitreRepository = new MongoMitreRepository();
    await seedMitreData(mitreRepository);
    const threatActorRepository = new MongoThreatActorRepository();
    await seedThreatActors(threatActorRepository);
    // Audit logs are never seeded — an empty trail at startup is correct
    // either way, in-memory or Mongo.
    const auditLogRepository = new InMemoryAuditLogRepository();

    return {
      userRepository,
      incidentRepository,
      alertRepository,
      investigationRepository,
      organizationRepository,
      indicatorRepository,
      reportRepository,
      mitreRepository,
      threatActorRepository,
      auditLogRepository,
    };
  }

  logger.info("MONGODB_URI not set — using in-memory repositories");

  const organizationRepository = new InMemoryOrganizationRepository();
  seedDemoOrganization(organizationRepository);
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const incidentRepository = new InMemoryIncidentRepository();
  seedDemoIncidents(incidentRepository);
  const alertRepository = new InMemoryAlertRepository();
  seedDemoAlerts(alertRepository);
  const indicatorRepository = new InMemoryIndicatorRepository();
  seedDemoIndicators(indicatorRepository);
  const investigationRepository = new InMemoryInvestigationRepository();
  seedDemoInvestigations(investigationRepository);
  const reportRepository = new InMemoryReportRepository();
  seedDemoReports(reportRepository);
  const mitreRepository = new InMemoryMitreRepository();
  seedMitreData(mitreRepository);
  const threatActorRepository = new InMemoryThreatActorRepository();
  seedThreatActors(threatActorRepository);
  const auditLogRepository = new InMemoryAuditLogRepository();

  return {
    userRepository,
    incidentRepository,
    alertRepository,
    investigationRepository,
    organizationRepository,
    indicatorRepository,
    reportRepository,
    mitreRepository,
    threatActorRepository,
    auditLogRepository,
  };
}

const repositories = await buildRepositories();
const app = createApp(repositories);

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "ThreatLens backend listening");
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
    if (env.MONGODB_URI) {
      await disconnectDatabase().catch((disconnectErr: unknown) => {
        logger.error({ err: disconnectErr }, "Error disconnecting from MongoDB");
      });
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
