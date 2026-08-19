import type { InMemoryMitreRepository } from "./mitre.repository.js";
import type { MitreTactic, MitreTechniqueBase } from "../types/mitre.js";

/**
 * Mirrors the frontend's src/mocks/mitre.ts, minus mappedIncidentIds/
 * mappedIndicatorIds — those are computed per-organization at request time
 * (see mitre.service.ts), not stored statically.
 */
export function seedMitreData(repository: InMemoryMitreRepository): void {
  const tactics: MitreTactic[] = [
    { id: "TA0001", name: "Initial Access", shortName: "initial-access", description: "Techniques used to gain an initial foothold within a network." },
    { id: "TA0002", name: "Execution", shortName: "execution", description: "Techniques that result in adversary-controlled code running on a system." },
    { id: "TA0003", name: "Persistence", shortName: "persistence", description: "Techniques used to maintain access across restarts and credential changes." },
    { id: "TA0004", name: "Privilege Escalation", shortName: "privilege-escalation", description: "Techniques used to gain higher-level permissions." },
    { id: "TA0005", name: "Defense Evasion", shortName: "defense-evasion", description: "Techniques used to avoid detection." },
    { id: "TA0006", name: "Credential Access", shortName: "credential-access", description: "Techniques for stealing account names and passwords." },
    { id: "TA0008", name: "Lateral Movement", shortName: "lateral-movement", description: "Techniques used to move through the environment." },
    { id: "TA0010", name: "Exfiltration", shortName: "exfiltration", description: "Techniques used to steal data from the network." },
  ];

  const techniques: MitreTechniqueBase[] = [
    { id: "T1566", tacticIds: ["TA0001"], name: "Phishing", description: "Adversaries send malicious messages to gain access to victim systems.", isSubTechnique: false },
    { id: "T1566.002", tacticIds: ["TA0001"], name: "Phishing: Spearphishing Link", description: "Adversaries send spearphishing emails with a malicious link.", isSubTechnique: true, parentTechniqueId: "T1566" },
    { id: "T1059", tacticIds: ["TA0002"], name: "Command and Scripting Interpreter", description: "Adversaries abuse command and script interpreters to execute commands.", isSubTechnique: false },
    { id: "T1078", tacticIds: ["TA0003", "TA0004"], name: "Valid Accounts", description: "Adversaries use compromised credentials to bypass access controls.", isSubTechnique: false },
    { id: "T1027", tacticIds: ["TA0005"], name: "Obfuscated Files or Information", description: "Adversaries obfuscate content to make it harder to detect.", isSubTechnique: false },
    { id: "T1110", tacticIds: ["TA0006"], name: "Brute Force", description: "Adversaries use brute force to gain access to accounts.", isSubTechnique: false },
    { id: "T1021", tacticIds: ["TA0008"], name: "Remote Services", description: "Adversaries use valid accounts to log into a service for lateral movement.", isSubTechnique: false },
    { id: "T1041", tacticIds: ["TA0010"], name: "Exfiltration Over C2 Channel", description: "Adversaries steal data by exfiltrating it over an existing C2 channel.", isSubTechnique: false },
  ];

  repository.seed(tactics, techniques);
}
