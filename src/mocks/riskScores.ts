import { calculateRiskScore } from "@/utils/risk";
import type { RiskScore } from "@/types";

/**
 * Pre-computed via the deterministic risk engine (src/utils/risk.ts) so the
 * dashboard and incident detail pages show numbers that trace back to
 * concrete, explainable factors rather than an opaque figure.
 */
export const MOCK_RISK_SCORES: Record<string, RiskScore> = {
  org_overall: calculateRiskScore(
    [
      { label: "Open critical incidents", weight: 3, contribution: 82, description: "2 unresolved critical-severity incidents in the last 7 days." },
      { label: "Indicator reputation", weight: 2, contribution: 78, description: "Multiple high-confidence indicators observed against known-malicious infrastructure." },
      { label: "Behavioral anomalies", weight: 1.5, contribution: 55, description: "Elevated anomalous login activity from 2 accounts." },
      { label: "Asset criticality", weight: 1.5, contribution: 60, description: "Affected assets include a customer-facing payment gateway." },
      { label: "Historical trend", weight: 1, contribution: 40, description: "Incident volume up 18% versus the trailing 30-day average." },
    ],
    "2026-08-15T14:00:00Z",
  ),
  risk_inc_1: calculateRiskScore(
    [
      { label: "Indicator reputation", weight: 2, contribution: 88, description: "Phishing domain matches a known credential-harvesting kit." },
      { label: "Confirmed clicks", weight: 2, contribution: 70, description: "3 employees interacted with the phishing link." },
      { label: "Asset criticality", weight: 1, contribution: 50, description: "Targets included finance department accounts." },
    ],
    "2026-08-15T09:50:00Z",
  ),
  risk_inc_2: calculateRiskScore(
    [
      { label: "Malware confirmation", weight: 2.5, contribution: 85, description: "Endpoint protection confirmed a known loader family." },
      { label: "Obfuscation observed", weight: 1, contribution: 60, description: "Payload used string obfuscation to evade static detection." },
    ],
    "2026-08-14T23:10:00Z",
  ),
  risk_inc_3: calculateRiskScore(
    [
      { label: "Brute-force volume", weight: 2, contribution: 65, description: "1,240 failed authentication attempts from a single source in 20 minutes." },
      { label: "Tor exit node", weight: 1.5, contribution: 70, description: "Source IP is a known Tor exit node." },
      { label: "Account lockout triggered", weight: 1, contribution: 30, description: "Rate limiting locked the targeted account before compromise." },
    ],
    "2026-08-15T11:15:00Z",
  ),
  risk_inc_4: calculateRiskScore(
    [
      { label: "Indicator reputation", weight: 1.5, contribution: 60, description: "URL shares infrastructure with a prior phishing campaign." },
      { label: "User reports", weight: 1, contribution: 35, description: "Reported by an employee via the phishing report button." },
    ],
    "2026-08-13T16:30:00Z",
  ),
  risk_inc_5: calculateRiskScore(
    [
      { label: "Data volume transferred", weight: 2.5, contribution: 80, description: "410MB transferred to an external IP outside business hours." },
      { label: "C2 pattern match", weight: 2, contribution: 72, description: "Beaconing interval matches known C2 jitter pattern." },
    ],
    "2026-08-15T07:20:00Z",
  ),
  risk_inc_6: calculateRiskScore(
    [
      { label: "Lateral movement", weight: 2, contribution: 58, description: "Valid account used to authenticate to 3 additional hosts." },
      { label: "Off-hours activity", weight: 1, contribution: 45, description: "Activity occurred at 03:12 local time, outside the user's normal pattern." },
    ],
    "2026-08-12T04:00:00Z",
  ),
};
