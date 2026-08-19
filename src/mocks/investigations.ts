import type { Investigation } from "@/types";

export const MOCK_INVESTIGATIONS: Investigation[] = [
  {
    id: "inv_1",
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
  },
  {
    id: "inv_2",
    title: "Off-hours lateral movement follow-up",
    description:
      "Following up on the shared service account's off-hours authentication pattern to confirm whether it's related to the broader C2 beaconing incident the same week.",
    leadAnalystId: "user_4",
    status: "open",
    relatedIncidentIds: ["inc_6", "inc_5"],
    relatedIndicatorIds: [],
    notes: [],
    timeline: [
      {
        id: "invtl_5",
        timestamp: "2026-08-12T09:00:00Z",
        title: "Investigation opened",
        description: "Opened to check for a connection between lateral movement and the C2 exfiltration incident.",
        actor: "Morgan Blake",
      },
      {
        id: "invtl_6",
        timestamp: "2026-08-12T09:01:00Z",
        title: "Linked incident",
        description: "INC-6 — Lateral movement using a shared service account",
        actor: "Morgan Blake",
      },
      {
        id: "invtl_7",
        timestamp: "2026-08-12T09:02:00Z",
        title: "Linked incident",
        description: "INC-5 — Suspected C2 beaconing and data exfiltration",
        actor: "Morgan Blake",
      },
    ],
    createdAt: "2026-08-12T09:00:00Z",
    updatedAt: "2026-08-12T09:02:00Z",
  },
  {
    id: "inv_3",
    title: "Q3 phishing-kit reuse review",
    description:
      "Closed review of whether the finance phishing kit reused templates from earlier in the quarter. Confirmed no reuse from prior incidents on file.",
    leadAnalystId: "user_3",
    status: "closed",
    relatedIncidentIds: ["inc_4"],
    relatedIndicatorIds: ["ind_5"],
    notes: [
      {
        id: "invnote_3",
        authorId: "user_3",
        authorName: "Diego Alvarez",
        content: "No template overlap found against the prior quarter's phishing samples. Closing.",
        createdAt: "2026-08-13T17:00:00Z",
        isFinding: false,
      },
    ],
    timeline: [
      {
        id: "invtl_8",
        timestamp: "2026-08-13T16:35:00Z",
        title: "Investigation opened",
        description: "Opened to check the reported phishing link against known prior campaigns.",
        actor: "Diego Alvarez",
      },
      {
        id: "invtl_9",
        timestamp: "2026-08-13T17:00:00Z",
        title: "Status changed",
        description: "Marked closed — no further correlation found.",
        actor: "Diego Alvarez",
      },
    ],
    createdAt: "2026-08-13T16:35:00Z",
    updatedAt: "2026-08-13T17:00:00Z",
  },
];
