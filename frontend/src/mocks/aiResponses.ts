import type { AIAnalysis, Incident, Indicator, Recommendation } from "@/types";
import { MOCK_INCIDENTS } from "./incidents";
import { MOCK_INDICATORS } from "./indicators";
import { MOCK_RISK_SCORES } from "./riskScores";
import { MOCK_TECHNIQUES } from "./mitre";
import { formatShortId } from "@/utils/format";

/**
 * Canned AI content for the mocked AI layer. Every entry carries an explicit
 * disclaimer and is rendered as clearly AI-generated in the UI — per spec
 * §36/§38, the frontend must never imply a real model is connected yet.
 */
export const AI_DISCLAIMER =
  "AI-generated analysis from a mocked assistant. This is not a live model call — no incident data is sent to any AI provider in this build phase.";

export const MOCK_AI_ANALYSES: Record<string, AIAnalysis> = {
  inc_1: {
    id: "ai_inc_1",
    incidentId: "inc_1",
    summary:
      "This looks like a targeted credential-harvesting phishing campaign against the finance team. The spoofed domain and landing page closely mimic Office 365, and at least one recipient interacted with the link before the mail gateway flagged the remaining messages.",
    keyFindings: [
      "Sender domain was registered 14 days before the campaign — a common signal for freshly-stood-up phishing infrastructure.",
      "The landing page reuses a template previously associated with credential-harvesting kits.",
      "One affected account showed a sign-in from an unfamiliar region shortly after the click, worth confirming MFA wasn't bypassed.",
    ],
    suggestedMitreTechniqueIds: ["T1566", "T1566.002"],
    generatedAt: "2026-08-15T09:55:00Z",
    modelLabel: "Mocked Assistant (no live model connected)",
    disclaimer: AI_DISCLAIMER,
  },
};

export const MOCK_RECOMMENDATIONS: Record<string, Recommendation[]> = {
  inc_1: [
    {
      id: "rec_1",
      incidentId: "inc_1",
      title: "Force MFA re-enrollment for affected accounts",
      description: "Require the 3 accounts that interacted with the phishing link to re-enroll MFA before their next sign-in.",
      status: "pending",
      generatedBy: "ai",
    },
    {
      id: "rec_2",
      incidentId: "inc_1",
      title: "Block sender domain at the mail gateway",
      description: "Add secure-office365-verify.com and its known variants to the mail gateway block list.",
      status: "approved",
      generatedBy: "ai",
      reviewedBy: "user_3",
      reviewedAt: "2026-08-15T09:52:00Z",
    },
  ],
};

const FALLBACK_ANSWER =
  "I can help investigate incidents, indicators, and MITRE mappings. Try naming one directly — e.g. \"Summarize INC-1\", \"Why is INC-1 high risk?\", or \"What's related to 185.220.101.47?\"";

const GENERIC_QA: { match: RegExp; answer: string }[] = [
  {
    match: /why.*(high|critical).*risk|risk score/i,
    answer:
      "Risk scores are calculated deterministically from concrete factors — indicator reputation, confirmed impact, and asset criticality — not by me. Name a specific incident (e.g. \"Why is INC-1 high risk?\") and I'll walk through its actual score breakdown.",
  },
  {
    match: /mitre|technique/i,
    answer:
      "I can map an incident's observed behavior to MITRE ATT&CK techniques — name one, e.g. \"Which techniques are associated with INC-1?\"",
  },
  {
    match: /unusual login|suspicious login|login activity/i,
    answer:
      "There's one flagged sign-in worth reviewing: an account associated with INC-1 signed in from an unfamiliar region shortly after clicking a phishing link. It's noted in that incident's behavioral findings.",
  },
];

/** Resolves "INC-1", "inc_1", or "incident #1" style references to a real mock incident. */
function findIncidentReference(question: string): Incident | undefined {
  const match = /inc[-_\s]?(\d+)/i.exec(question) ?? /incident\s*#?\s*(\d+)/i.exec(question);
  if (!match) return undefined;
  return MOCK_INCIDENTS.find((i) => i.id === `inc_${match[1]}`);
}

/** Resolves a literal indicator value (IP, domain, URL, hash) mentioned in the question. */
function findIndicatorReference(question: string): Indicator | undefined {
  const lower = question.toLowerCase();
  return MOCK_INDICATORS.find((i) => lower.includes(i.value.toLowerCase()));
}

function summarizeIncident(incident: Incident): string {
  const status = incident.status.replace("_", " ");
  return `${formatShortId(incident.id)} — "${incident.title}" — is currently ${status} at ${incident.severity} severity. ${incident.description} There are ${incident.timeline.length} timeline event${incident.timeline.length === 1 ? "" : "s"} and ${incident.evidence.length} piece${incident.evidence.length === 1 ? "" : "s"} of evidence on file.`;
}

function explainRisk(incident: Incident): string {
  const score = MOCK_RISK_SCORES[incident.riskScoreId];
  if (!score) return `I don't have a risk breakdown on file for ${formatShortId(incident.id)} yet.`;
  const topFactors = score.factors
    .slice(0, 2)
    .map((f) => `${f.label} — ${f.description}`)
    .join(" ");
  return `${formatShortId(incident.id)} scored ${score.value}/100 (${score.severity}). The main drivers: ${topFactors} That score comes straight from those factors — I explain it, I don't set it.`;
}

function explainTechniques(incident: Incident): string {
  if (incident.mitreTechniqueIds.length === 0) {
    return `No MITRE ATT&CK techniques have been mapped to ${formatShortId(incident.id)} yet.`;
  }
  const names = incident.mitreTechniqueIds
    .map((id) => {
      const technique = MOCK_TECHNIQUES.find((t) => t.id === id);
      return technique ? `${technique.id} (${technique.name})` : id;
    })
    .join(", ");
  return `${formatShortId(incident.id)} maps to: ${names}.`;
}

function explainIndicatorRelations(indicator: Indicator): string {
  if (indicator.relatedIncidentIds.length === 0) {
    return `${indicator.value} is tracked at ${indicator.severity} severity (risk ${indicator.riskScore}/100) but isn't linked to any incident yet.`;
  }
  const titles = indicator.relatedIncidentIds
    .map((id) => {
      const incident = MOCK_INCIDENTS.find((i) => i.id === id);
      return incident ? `${formatShortId(incident.id)} ("${incident.title}")` : null;
    })
    .filter((t): t is string => Boolean(t))
    .join("; ");
  return `${indicator.value} is ${indicator.severity} severity (risk ${indicator.riskScore}/100) and linked to: ${titles}.`;
}

export function getCannedAssistantAnswer(question: string): string {
  const incident = findIncidentReference(question);
  if (incident) {
    if (/summar/i.test(question)) return summarizeIncident(incident);
    if (/(risk|why.*(high|critical))/i.test(question)) return explainRisk(incident);
    if (/(mitre|technique)/i.test(question)) return explainTechniques(incident);
    return summarizeIncident(incident);
  }

  const indicator = findIndicatorReference(question);
  if (indicator) return explainIndicatorRelations(indicator);

  const generic = GENERIC_QA.find((entry) => entry.match.test(question));
  return generic?.answer ?? FALLBACK_ANSWER;
}
