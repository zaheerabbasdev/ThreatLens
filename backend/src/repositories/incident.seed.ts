import type { InMemoryIncidentRepository } from "./incident.repository.js";
import type { Incident } from "../types/incident.js";

/** Mirrors the frontend's src/mocks/incidents.ts (same IDs/content) so the two layers show the same demo story once wired together. */
export function seedDemoIncidents(repository: InMemoryIncidentRepository): void {
  const organizationId = "org_northwind";

  const incidents: Incident[] = [
    {
      id: "inc_1",
      organizationId,
      title: "Credential-harvesting phishing campaign targeting finance",
      description:
        "A wave of phishing emails impersonating Office 365 password-reset notices was sent to 14 finance-department mailboxes, directing recipients to a credential-harvesting page.",
      severity: "critical",
      confidence: "high",
      status: "investigating",
      assignedAnalystId: "user_3",
      affectedAssets: ["finance-mailbox-pool", "sso-gateway"],
      indicatorIds: ["ind_4", "ind_5"],
      mitreTechniqueIds: ["T1566", "T1566.002"],
      timeline: [
        {
          id: "t1",
          timestamp: "2026-08-15T08:02:00Z",
          title: "Phishing emails delivered",
          description: "14 emails delivered to finance mailboxes; 3 flagged by the mail gateway after delivery.",
          actor: "Mail Gateway",
        },
        {
          id: "t2",
          timestamp: "2026-08-15T08:41:00Z",
          title: "First click recorded",
          description: "A finance analyst clicked the link from a corporate device.",
          actor: "System",
        },
        {
          id: "t3",
          timestamp: "2026-08-15T09:15:00Z",
          title: "Incident opened",
          description: "Alert triaged and escalated to an incident by the on-call analyst.",
          actor: "Diego Alvarez",
        },
      ],
      evidence: [
        {
          id: "e1",
          label: "Phishing email headers",
          description: "Sender domain spoofed to resemble Microsoft notifications.",
          indicatorId: "ind_4",
          collectedAt: "2026-08-15T08:05:00Z",
        },
        {
          id: "e2",
          label: "Landing page capture",
          description: "Screenshot of the credential-harvesting page confirms Office 365 branding clone.",
          indicatorId: "ind_5",
          collectedAt: "2026-08-15T09:10:00Z",
        },
      ],
      behavioralFindings: [
        {
          id: "b1",
          label: "Mailbox access pattern",
          normalBehavior: "Single-region sign-ins during business hours.",
          observedBehavior: "One affected account signed in from an unfamiliar region 40 minutes after the click.",
          anomalyScore: 76,
        },
      ],
      notes: [
        {
          id: "n1",
          authorId: "user_3",
          authorName: "Diego Alvarez",
          content: "Forced password reset for all 3 clicking users; awaiting confirmation MFA wasn't bypassed.",
          createdAt: "2026-08-15T09:30:00Z",
        },
      ],
      riskScoreId: "risk_inc_1",
      createdAt: "2026-08-15T09:15:00Z",
      updatedAt: "2026-08-15T09:50:00Z",
    },
    {
      id: "inc_2",
      organizationId,
      title: "Obfuscated loader executed on finance workstation",
      description:
        "Endpoint protection blocked an obfuscated loader (EICAR-Test-Loader family) after execution on a finance department workstation, delivered via a spoofed invoice attachment.",
      severity: "high",
      confidence: "confirmed",
      status: "contained",
      assignedAnalystId: "user_4",
      affectedAssets: ["ws-fin-014"],
      indicatorIds: ["ind_9"],
      mitreTechniqueIds: ["T1059", "T1027"],
      timeline: [
        {
          id: "t1",
          timestamp: "2026-08-14T21:40:00Z",
          title: "Malicious attachment opened",
          description: "invoice_updater.exe executed from a downloads folder.",
          actor: "System",
        },
        {
          id: "t2",
          timestamp: "2026-08-14T21:41:00Z",
          title: "Execution blocked",
          description: "Endpoint protection quarantined the binary before persistence.",
          actor: "Endpoint Protection",
        },
        {
          id: "t3",
          timestamp: "2026-08-14T22:05:00Z",
          title: "Host isolated",
          description: "Workstation network-isolated pending investigation.",
          actor: "Morgan Blake",
        },
      ],
      evidence: [
        {
          id: "e1",
          label: "Quarantined binary",
          description: "MD5 hash matches a known loader family in threat intel.",
          indicatorId: "ind_9",
          collectedAt: "2026-08-14T21:42:00Z",
        },
      ],
      behavioralFindings: [],
      notes: [
        {
          id: "n1",
          authorId: "user_4",
          authorName: "Morgan Blake",
          content: "No evidence of lateral movement from this host so far.",
          createdAt: "2026-08-14T22:10:00Z",
        },
      ],
      riskScoreId: "risk_inc_2",
      createdAt: "2026-08-14T21:45:00Z",
      updatedAt: "2026-08-14T23:10:00Z",
    },
    {
      id: "inc_3",
      organizationId,
      title: "Distributed brute-force attempt against SSO gateway",
      description:
        "A high-volume brute-force attack originating from a known Tor exit node targeted the SSO gateway, generating over 1,200 failed authentication attempts.",
      severity: "high",
      confidence: "high",
      status: "resolved",
      assignedAnalystId: "user_3",
      affectedAssets: ["sso-gateway"],
      indicatorIds: ["ind_1"],
      mitreTechniqueIds: ["T1110"],
      timeline: [
        {
          id: "t1",
          timestamp: "2026-08-13T03:12:00Z",
          title: "Brute-force attempts detected",
          description: "SSO gateway logged over 1,200 failed authentication attempts within 20 minutes.",
          actor: "SSO Gateway",
        },
        {
          id: "t2",
          timestamp: "2026-08-13T03:20:00Z",
          title: "Source IP blocked",
          description: "Perimeter firewall blocked the offending IP range after the third alert threshold.",
          actor: "Firewall",
        },
      ],
      evidence: [
        {
          id: "e1",
          label: "Authentication logs",
          description: "Failed attempts sourced from a known Tor exit node, no successful logins recorded.",
          indicatorId: "ind_1",
          collectedAt: "2026-08-13T03:15:00Z",
        },
      ],
      behavioralFindings: [],
      notes: [
        {
          id: "n1",
          authorId: "user_3",
          authorName: "Diego Alvarez",
          content: "No successful authentications; closing as resolved after 24h monitoring window.",
          createdAt: "2026-08-14T03:20:00Z",
        },
      ],
      riskScoreId: "risk_inc_3",
      createdAt: "2026-08-13T03:20:00Z",
      updatedAt: "2026-08-14T03:20:00Z",
    },
  ];

  for (const incident of incidents) repository.seed(incident);
}
