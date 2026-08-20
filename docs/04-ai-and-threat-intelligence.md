# AI & Threat Intelligence

## The one rule everything else follows

**AI assists analysts; it never controls a security decision.** Risk scores, severities, and
correlations are always computed by a fixed, deterministic formula — AI may *explain* a score
or *suggest* a next step, but the number itself and any action taken on it are never something
an LLM produces or executes directly. Every section below points out, explicitly, which half
of it is deterministic security logic and which half is AI-generated analysis a human is
expected to independently verify.

## 1. AI provider & abstraction

```
AIProvider (interface)  →  OpenAIProvider (the only implementation today)
```

Nothing outside `backend/src/ai/openaiProvider.ts` calls the OpenAI SDK directly —
`AIService` and every controller depend only on the `AIProvider` interface
(`backend/src/ai/aiProvider.ts`). `server.ts` constructs a real `OpenAIProvider` when
`OPENAI_API_KEY` is set in the environment, and passes `null` otherwise; `AIService` treats
`null` as "not configured" and returns a clean `503` — **it never falls back to fake or
canned content**. A different provider (Anthropic, a local model, etc.) is a second class
implementing the same interface, not a rewrite of anything that calls it.

The `OpenAIProvider` class itself is built against a minimal structural `ChatClient`
interface, not the concrete OpenAI SDK type — this is what let its entire test suite run for
real, without a network connection, against a fake client that satisfies the same shape.

## 2. Prompts & structured outputs

Every AI call uses a system preamble establishing the assistant's role and boundaries
(`SYSTEM_PREAMBLE` in `openaiProvider.ts`) — explicitly: *"you ASSIST human analysts — you
never make or execute security decisions yourself."* Every response is requested and parsed as
a JSON object, then validated against a specific Zod schema per operation
(`answerQuestionOutputSchema`, `analyzeIncidentOutputSchema`,
`generateRecommendationsOutputSchema`) before anything downstream ever reads a field from it.
A response that isn't valid JSON, or is valid JSON that doesn't match the expected shape,
throws — it never silently passes a malformed or unexpected structure further into the
system. This is the **validation / hallucination-containment** layer: it doesn't stop a model
from being wrong about *content*, but it guarantees the *shape* of what reaches the rest of
the app is always exactly what the code expects.

## 3. Data minimization & prompt injection protection

Before anything reaches a prompt:

- **`pick()`** selects only the specific fields an operation actually needs from a domain
  record — never a whole raw entity "because it's convenient."
- **`redactSecretsDeep()`** strips anything credential-shaped (see `docs/02-security.md` §6)
  from every string, recursively.
- **`truncateForPrompt()`** enforces an 8,000-character cap on any single piece of untrusted
  content.
- **`wrapUntrustedData()`** wraps the result in explicit `<untrusted_data source="...">`
  markers with a preamble instructing the model to treat the enclosed content as data to
  analyze, never as instructions — and (as of the Phase 11 hardening review) neutralizes any
  literal occurrence of that marker sequence *inside* the untrusted content itself, so a
  crafted incident description can't prematurely close the block and make injected text look
  like it sits outside the labeled region.

All four steps run on every piece of user-controlled content that reaches a prompt — an
analyst's chat message, an incident's description/notes, an IOC's value.

## 4. Cost & rate control

A dedicated rate-limit tier (15 requests/minute) sits in front of every `/ai/*` route,
independent of the baseline API limiter. Separately, `AICostTracker` logs every provider call
(organization, user, operation, tokens, duration, success) and `AIService` rejects new
requests once an organization exceeds `AI_DAILY_REQUEST_LIMIT_PER_ORG` (default 200) within a
rolling 24-hour window — this caps *spend*, independent of the rate limiter capping request
*frequency*, since request sizes vary.

## 5. Human-in-the-loop recommendations

**This is the clearest deterministic/AI boundary in the system.** `generateRecommendations`
produces AI-authored text suggestions, always persisted with `status: "pending"` and
`generatedBy: "ai"`. Nothing in the codebase ever moves a recommendation past `"pending"`
automatically. A human with `recommendations:approve` (super_admin or security_admin only)
must explicitly call `POST /ai/recommendations/:id/review` with `{status: "approved"}` or
`{"rejected"}` — recorded under the *reviewer's* real identity, resolved server-side.

An **approved** recommendation can then be turned into a real, tracked `ResponseAction` via
`POST /response-actions/apply-recommendation/:id` (Phase 10) — a *second*, separately
permission-gated human action, not an automatic consequence of approval. See §8 below for what
"executed" actually means today.

## 6. RAG / vector search

**Not built.** Named in the original tech-stack scope but out of scope for what's shipped —
the codebase has no vector index and no retrieval step; every prompt is built from
explicitly-selected, `pick()`-minimized context, not a similarity search over a document
store. If/when this is added, `docs/05-database.md`'s "vector storage" section is where it
would be documented.

## 7. MITRE ATT&CK

The `/mitre` endpoints serve a static reference dataset (tactics + techniques) seeded at
startup — not a live sync from MITRE's own STIX feed. Techniques referenced by an incident or
threat actor are surfaced in the threat graph (`GET /threat-graph`) as real nodes/edges, and
an AI incident analysis may *suggest* additional relevant technique IDs
(`suggestedMitreTechniqueIds`) — that suggestion is never automatically written onto the
incident's own `mitreTechniqueIds`; an analyst has to add it deliberately.

## 8. Threat intelligence providers & IOC enrichment

Same abstraction shape as AI: `ThreatIntelProvider` is an interface
(`backend/src/threatIntel/threatIntelProvider.ts`), and `IOCService` takes a **list** of them
— never a single hardcoded provider — so adding a second provider later is one more entry in
that list, nothing else changes. `VirusTotalProvider` is the one implementation that exists
today.

**Enrichment** (`POST /ioc/:id/enrich`) queries every configured provider independently
(`Promise.allSettled` — one provider failing never blocks the others or fails the whole
request), and for each successful result appends a `{provider, fetchedAt, confidence}` entry
to the indicator's `sources[]` array. **Nothing here fabricates a relationship or a score** —
`riskScore`/`severity` are recomputed by the same fixed, deterministic formula every other
score in the system uses (§9), taking the *worst* score any source has ever reported (a
provider that once flagged something malicious is never quietly overridden by a later,
cleaner-looking result). Provider disagreement is never hidden or averaged away — every
individual source stays visible in `sources[]` for an analyst to judge for themselves.

A 24-hour staleness cache skips re-querying a provider that was already asked recently
(`?force=true` bypasses it); a `429` from a provider is raised as a distinct
`ThreatIntelQuotaError`; a malformed provider response is Zod-validated and rejected the same
way an AI response is (§2).

## 9. Risk scoring (deterministic, never AI)

```
backend/src/utils/risk.ts — severityFromScore(value: number): Severity
  ≥85 → critical   ≥65 → high   ≥40 → medium   ≥15 → low   else → info
```

This single function is the only thing that maps a numeric score to a severity label,
anywhere in the backend — used identically for IOC enrichment and mirrored exactly on the
frontend (`src/utils/risk.ts`) so a "high" indicator means the same thing in both layers. No
AI call ever sets a `riskScore` or `severity` field directly.

## 10. Anomaly detection (ML, not AI/LLM)

A clearly separate concern from the AI provider above: a self-hosted Python service
(`ml-service/`, FastAPI + scikit-learn `IsolationForest`) scores a user's recent behavior for
anomalies. This is explainable statistical ML, not a language model — chosen deliberately
("do not start with an unnecessarily complex neural network").

**Feature extraction** (`backend/src/anomalyDetection/featureExtraction.ts`) is pure,
deterministic arithmetic over raw `SecurityEvent` records — login-hour deviation, new-location
flag, request frequency, resource-access count, file downloads, auth failures, unusual
endpoint access — computed on the Node side. The ML service only ever receives the seven
finished numbers, never raw events.

**Scoring** (`ml-service/app/model.py`): `IsolationForest.decision_function`'s raw output is
rescaled onto a deterministic 0–100 scale against the training data's own observed range.
"Confidence" is a deterministic function of how far that decision value sits from zero.
"Contributing features" — the three features most responsible for a flagged score — are each
feature's z-score against the training baseline's mean/standard deviation, a separate,
transparent statistical computation, not an approximation the model produced.

**Honest limitation**: there's no real historical org telemetry to train on yet (this is the
first phase to produce `SecurityEvent` data at all), so the model trains once, at process
startup, against a **synthetic baseline** of what "typical" behavior looks like — a documented
placeholder for a real training pipeline, not a claim that real behavioral history was used.
See `ml-service/README.md`.

## 11. Confidence levels

Used consistently across indicators, AI analyses, and threat-intel sources:
`confirmed > high > medium > low > unverified`. A freshly-submitted, unenriched IOC starts at
`unverified`/`riskScore: 0` — the system never invents a confidence it doesn't have. When
multiple sources disagree, the aggregate confidence shown is the *highest* individual source's
confidence (`highestConfidence()`, `backend/src/utils/risk.ts`), never an average that could
understate a single strong signal.

## 12. Response-workflow "execution" — honestly simulated

`ResponseActionExecutor` (Phase 10) follows the same provider-abstraction pattern as AI/
threat-intel, with one difference: there's no real executor yet, and no `503` case either —
`SimulatedActionExecutor` always succeeds, and **always** returns `isSimulated: true` with a
result message stating plainly that no live EDR/firewall/IAM integration exists for this
deployment and nothing was actually sent to an external system. This is not a stand-in for a
missing feature description — it's the literal, current behavior, labeled as such on every
single response, not just in this document.

## 13. AI limitations (current, as of this document)

- No RAG/vector search — every prompt is built from explicitly-selected context, not a
  document-store lookup.
- The anomaly-detection model trains on a synthetic baseline, not real org history.
- Only one threat-intelligence provider (VirusTotal) is wired up; the architecture supports
  more, but only one exists today.
- No local/offline AI model — the AI assistant requires a real, configured OpenAI API key and
  network access; without one, every AI endpoint returns a clean `503`.
- AI-generated text (assistant answers, incident analyses, recommendations) is always labeled
  as such and carries a "verify before acting" disclaimer — it is never presented as
  equivalent to the deterministic risk score sitting next to it.
