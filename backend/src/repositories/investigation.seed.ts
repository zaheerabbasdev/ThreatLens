import type { Investigation } from "../types/investigation.js";

interface SeedableInvestigationRepository {
  seed(investigation: Investigation): void | Promise<void>;
}

/** Mirrors the frontend's src/mocks/investigations.ts (same ID/content for inv_1). */
export async function seedDemoInvestigations(repository: SeedableInvestigationRepository): Promise<void> {
  const organizationId = "org_northwind";

  const investigation: Investigation = {
    id: "inv_1",
    organizationId,
    title: "Finance-targeted phishing infrastructure cluster",
    description:
      "Correlating the credential-harvesting phishing campaign with the brute-force attempt against the SSO gateway — both surfaced within hours of each other and may share infrastructure or intent.",
    leadAnalystId: "user_3",
    status: "investigating",
    relatedIncidentIds: ["inc_1", "inc_3"],
    relatedIndicatorIds: ["ind_4", "ind_5", "ind_1"],
    notes: [
      {
        id: "invnote_1",
        authorId: "user_3",
        authorName: "Diego Alvarez",
        content:
          "The brute-force source IP and the phishing domain's registrar both trace back to infrastructure providers previously seen hosting short-lived phishing kits. Worth checking if this is the same actor testing multiple entry points.",
        createdAt: "2026-08-15T11:20:00Z",
        isFinding: true,
      },
      {
        id: "invnote_2",
        authorId: "user_3",
        authorName: "Diego Alvarez",
        content: "Requested extended DNS history on the phishing domain from the threat intel feed.",
        createdAt: "2026-08-15T11:35:00Z",
        isFinding: false,
      },
    ],
    timeline: [
      {
        id: "invtl_1",
        timestamp: "2026-08-15T11:15:00Z",
        title: "Investigation opened",
        description: "Opened to correlate two same-day incidents targeting finance-adjacent access.",
        actor: "Diego Alvarez",
      },
      {
        id: "invtl_2",
        timestamp: "2026-08-15T11:16:00Z",
        title: "Linked incident",
        description: "INC-1 — Credential-harvesting phishing campaign targeting finance",
        actor: "Diego Alvarez",
      },
      {
        id: "invtl_3",
        timestamp: "2026-08-15T11:17:00Z",
        title: "Linked incident",
        description: "INC-3 — Distributed brute-force attempt against SSO gateway",
        actor: "Diego Alvarez",
      },
      {
        id: "invtl_4",
        timestamp: "2026-08-15T11:20:00Z",
        title: "Finding noted",
        description: "Shared infrastructure provider pattern flagged as a key finding.",
        actor: "Diego Alvarez",
      },
    ],
    createdAt: "2026-08-15T11:15:00Z",
    updatedAt: "2026-08-15T11:35:00Z",
  };

  await repository.seed(investigation);
}
