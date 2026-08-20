# ThreatLens Backend

Node.js + Express + TypeScript API for ThreatLens. Phase 3 (Backend architecture and API)
of the build — see `../.claude/CLAUDE.md` and `../ThreatLens/03-BACKEND-DATABASE-SECURITY-DEVSECOPS-RULES.md`
for the full rules this follows.

## Status

**Infrastructure** (increment 1): Express app, security middleware, centralized error
handling, structured logging, request correlation IDs, tiered rate limiting, health check.

**Auth** (increment 2): registration, login, logout, token refresh, password reset, password
change, email verification, RBAC middleware — all real, tested, and verified against a real
running server, not just in-process. Details:

- Argon2id password hashing (spec §14)
- JWT access tokens (15m) + rotating refresh tokens (30d) delivered via a scoped, httpOnly,
  `SameSite=Strict` cookie; explicit algorithm allowlist + issuer/audience validation on every
  verify (spec §17)
- Refresh token rotation with reuse detection — presenting an already-consumed refresh token
  revokes its entire session family, not just that one token
- Login/registration responses are indistinguishable for "wrong password" vs "no such
  account"; account-status details (suspended, etc.) are only revealed once the password is
  already proven correct (spec §24)
- RBAC via `requireAuth` + `requirePermission(permission)` — the actual enforcement point;
  the frontend's matching checks are UX only (spec §18)
- Password reset / email verification tokens are single-use, short-lived, and stored only as
  a SHA-256 digest (spec §14)

**Incidents** (increment 3): `GET /incidents`, `GET /incidents/summary`, `GET /incidents/:id`,
`PATCH /incidents/:id/status`, `PATCH /incidents/:id/assign`, `POST /incidents/:id/notes` — the
first domain module, establishing the pattern the rest (alerts, investigations, users, ...)
follow:

- Every repository method takes `organizationId` as a required argument and enforces it at
  the data-access layer (spec §20) — `getById` returns the same "not found" for a genuinely
  missing ID and an ID that belongs to another organization, so changing the ID in the URL
  can't be used to probe what exists elsewhere (spec §19, verified by an explicit
  register-a-new-org-then-probe test)
- Assigning an incident validates the assignee belongs to the same organization too — the
  object-level check extends to referenced resources, not just the one in the URL
  path
- Note authorship is resolved from the authenticated session server-side; a client-supplied
  author name in the request body is ignored, not trusted
- RBAC per-route via the existing `requirePermission`, exercised against every seeded role

**Alerts** (increment 4): `GET /alerts`, `GET /alerts/summary`, `GET /alerts/:id`,
`PATCH /alerts/:id/status` — same pattern as Incidents (tenant-scoped repository, IDOR-safe
`getById`, RBAC per route), applied to a simpler domain shape with no notes/assignment.

**Investigations** (increment 5): `GET /investigations`, `POST /investigations`,
`GET /investigations/:id`, `PATCH /investigations/:id/status`, `POST /investigations/:id/notes`,
link/unlink incident and indicator. The richest module so far:

- Every actor name (who created it, who changed status, who added a note, who linked
  something) is resolved server-side from the authenticated session — never trusted from the
  request body, verified by a test that sends a spoofed name and asserts it's ignored
- Cross-references are validated, not just the primary resource: creating an investigation
  checks the lead analyst belongs to the caller's org; linking an incident checks that
  incident exists in the caller's org too (deliberately stricter than the frontend mock, which
  allows a dangling reference — see the code comment for why)
- Linking an indicator has no existence check yet, honestly, because there's no Threat Intel
  module/repository to check against — noted in code and here, not silently faked

**Users & Organization** (increment 6): `GET /users`, `GET /users/:id`,
`PATCH /users/:id/profile`, `PATCH /users/:id/mfa`, `PATCH /users/:id/role`,
`PATCH /users/:id/status`, plus `GET`/`PATCH /organization`. Also fixed a real gap: `register()`
was generating an organizationId but never actually creating an Organization record — it now
does, using the submitted organization name (verified by a test that registers, then fetches
`/organization` and checks the name round-tripped).

- Profile/MFA edits are self-service — every role can edit their own, gated in the service
  layer (self, or `users:manage`), not at the route, since route-level RBAC can't express "your
  own record specifically"
- Role/status changes require `users:manage` (super_admin only — security_admin is
  deliberately excluded from that one permission) **and** can never target your own account,
  even for an admin — a safety rule beyond what the frontend mock enforces, preventing an
  admin from accidentally locking themselves out with nobody left to reverse it

**Threat Intel / IOCs** (increment 7): `GET /ioc`, `POST /ioc`, `GET /ioc/:id` — IP, domain,
URL, and hash indicators.

- Real format validation per type on submission (spec §21): IPv4/IPv6 via Node's `net.isIP`,
  a domain-shape regex, `http(s)`-only URL parsing (rejects `javascript:` and other schemes),
  and hex-length hash validation that derives the correct algorithm (md5/sha1/sha256) instead
  of the frontend mock's cruder "64 chars or bust, everything else is md5" guess
  — none of this is real threat-intel enrichment (that's Phase 7 of the *product* roadmap,
  external provider lookups); it's just rejecting input that isn't shaped like what it claims
  to be
- A freshly submitted indicator starts deliberately unenriched — `severity: "info"`,
  `confidence: "unverified"`, `riskScore: 0` — matching the frontend mock and the spec's "AI/
  automation never invents a score" principle; nothing here fabricates confidence it doesn't
  have
- Closed a gap from the Investigations increment: `linkIndicator` now validates the indicator
  actually exists in the caller's org (previously undeferrable, honestly, since no
  IndicatorRepository existed yet) — same treatment `linkIncident` already had

**Audit Logs** (increment 8): `GET /audit-logs` — read-only on purpose, no write route exists
(spec §39: restricted write access, no deletion). Unlike every other module so far, this one
isn't just a passive CRUD API nobody calls — it's wired as a real side effect into every
security-sensitive action already built:

- `AuthService`: LOGIN, LOGIN\_FAILED, LOGOUT, PASSWORD\_CHANGED (both reset and self-service
  change)
- `UsersService`: ROLE\_CHANGED, USER\_STATUS\_CHANGED, PROFILE\_UPDATED, MFA\_CHANGED
- `IncidentsService` / `AlertsService`: INCIDENT\_UPDATED, INCIDENT\_ASSIGNED, ALERT\_UPDATED
- `InvestigationsService`: INVESTIGATION\_CREATED, INVESTIGATION\_UPDATED (finer-grained
  changes — notes, incident/indicator links — stay in the investigation's own timeline rather
  than duplicating into a separate audit entry per edit)
- `OrganizationService`: SECURITY\_SETTING\_CHANGED (renaming)
- `IOCService`: IOC\_SUBMITTED

`requestId`/`ipAddress` (spec §38 requires both on every record) are captured via
`AsyncLocalStorage` (`middleware/requestContext.ts`) rather than threaded as parameters
through every service method that might eventually record something — set once by middleware,
read automatically wherever `AuditService.record()` is called, verified by a test asserting a
real (non-placeholder) request ID lands on the record. The repository itself has no
update/delete method at all — not merely unimplemented, but structurally absent from the
interface, so nothing built against it can alter or remove a record even by accident.

**MITRE ATT&CK** (increment 9): `GET /mitre/tactics`, `GET /mitre/techniques`,
`GET /mitre/techniques/:id` — read-only reference data (spec §44).

- Caught a real cross-tenant leak the frontend mock's own data shape has: techniques are
  shared/global (there's only one "Phishing" technique, not one per organization), but the
  frontend mock bakes `mappedIncidentIds`/`mappedIndicatorIds` directly onto each technique
  record as static data. Doing that server-side would mean org A's incident IDs show up when
  org B asks about the same shared technique. Instead, those two fields are computed **per
  request**, scoped to the caller's organization, by checking which of *that org's* incidents
  reference the technique — verified by a test that registers a second organization and
  confirms it sees the same 8 techniques but with empty mappings, not org_northwind's data
- `mappedIndicatorIds` has no direct backing field on `Indicator` (indicators don't carry a
  technique association in this data model) — derived honestly from the mapped incidents' own
  `indicatorIds` rather than inventing a relationship that doesn't exist
- No permission dedicated to this module exists in the matrix (the frontend doesn't have one
  either) — gated behind `threat_graph:read`, which every seeded role already has

**Reports** (increment 10): `GET /reports`, `POST /reports`, `GET /reports/:id` — all 5 report
types (security summary, incident, threat intelligence, risk, activity).

- Summaries are computed from real org data at generation time, the same principle the
  frontend mock already followed — but drawing on real audit logs and indicator counts too,
  since those repositories now exist server-side and the mock's equivalents didn't
- `risk_report` is the one honest exception: there's no risk-scoring engine yet (spec §48/§49,
  a later phase, and a risk score is explicitly something this platform never lets AI or a
  report layer invent on its own) — rather than fabricate a number, its summary says plainly
  that scoring isn't available yet, verified by a test asserting no numeric score appears
- `generatedBy` is resolved server-side from the authenticated session, same non-negotiable
  pattern as every other actor-attribution field in this backend
- Seeded reports are fixed historical snapshots on purpose, not live-recomputed at startup — a
  report reflects the org's data at the moment it was generated, so it's correct for a report
  from when there were more seeded incidents to still quote that original number

**Threat Graph** (increment 11 — the last domain module): `GET /threat-graph`. Confirmed the
expectation from the previous increment: no new persisted state, just a composition layer
assembling nodes/edges from repositories that already exist (incidents, indicators, users,
MITRE techniques, threat actors).

- Indicators/incidents/users are the caller's own org data only; MITRE techniques and threat
  actors are global reference data shown to every org alike (same as the MITRE module)
- Tenant isolation here falls directly out of how the node set is built, not a separate check:
  an edge is only added when *both* endpoints are already nodes in the graph, and nodes are
  only ever populated from org-scoped or genuinely-global data — so a cross-tenant edge is
  structurally impossible, not merely filtered out. Verified by a test that confirms an
  outsider org's graph has zero of org_northwind's incident/indicator/user nodes while still
  correctly showing the shared threat actors
- Also added `ThreatActor` as a new global reference type (mirrors the frontend's
  `src/mocks/threatActors.ts`), following the same "seeded once, no organizationId, no
  create/update in the public interface" pattern as `MitreRepository`

**Phase 3 (Backend architecture and API) is now feature-complete** for the scope defined at
the start of this phase: auth, RBAC, and all domain modules the frontend expects, each backed
by real logic (not stubs) and tested end to end. See "Not yet built" below for what's
deliberately deferred to later phases.

## Phase 4 — Backend QA

A dedicated audit pass across everything Phase 3 built, beyond the per-module work already
folded in along the way:

- **Authorization sweep** (spec §79): every route across all 11 route files reviewed by hand
  for `requireAuth`/`requirePermission` coverage. Zero gaps found — the two routes with no
  static permission check (`users:*/profile`, `users:*/mfa`) are the documented self-service
  exception, checked conditionally in the service layer instead; auth's public endpoints
  (register/login/refresh/forgot-password/etc.) are intentionally unauthenticated by design.
- **Dependency audit**: `npm audit` — 0 vulnerabilities.
- **Static sweep**: zero stray `console.*` calls outside the one legitimate pre-logger use in
  `config/env.ts`, zero `any` types anywhere, zero TODO/FIXME markers.
- **Secret-leak guarantee verified at the type level, not just by convention**: every
  `AuthService`/`UsersService` method that returns a user is typed `Promise<PublicUser>` —
  `passwordHash` reaching a response would be a compile error, not just a missed review.
- **`asyncHandler` coverage**: all 47 controller methods across every module confirmed wrapped
  — zero raw async route handlers that could silently swallow a rejected promise.
- **Production-mode behavior, verified live** (not just unit-tested): booted with
  `NODE_ENV=production` and confirmed — a malformed JSON body still returns a clean, generic
  400 with no stack trace; CORS correctly rejects a disallowed origin and allows the
  configured one; HSTS/X-Content-Type-Options/X-Frame-Options headers all present.
- **Rate limiting, verified under real load**: 12 rapid `/auth/login` requests against a live
  server — the first 10 processed normally (401 for bad credentials), requests 11–12 correctly
  hit 429, confirming the STRICT tier actually engages, not just that the middleware is wired.
- **Full-stack regression**: backend (typecheck/lint/177 tests/build) and frontend
  (typecheck/lint/129 tests/build) both re-verified green after the audit — one frontend test
  timeout under concurrent load was confirmed to be resource contention (reran in isolation,
  129/129 in 34s vs. 95s), not a regression; nothing in this phase touched frontend code.

No bugs required fixing this pass — Phase 3's per-module security work (IDOR guards, tenant
isolation, non-spoofable actor attribution, tiered rate limiting, real audit trail) held up
under a dedicated adversarial review rather than needing new patches.

## Phase 5 — Database

Every repository now has a real Mongoose-backed implementation (`*.repository.mongo.ts`)
alongside its original in-memory one — same interface, so nothing above the repository layer
(services, controllers, tests) changed. `server.ts` picks between them based on whether
`MONGODB_URI` is set; unset, it behaves exactly as it did through Phase 4.

**What this covers:**

- All 10 collections from the domain model (User, Organization, Incident, Alert, Indicator,
  Investigation, Report, AuditLog, MitreTactic/MitreTechnique, ThreatActor), each with a
  schema defining required/optional fields, validation, and indexes (spec §9/§10)
- Indexes based on actual query patterns, not indexed-everything (spec §11): `organizationId`
  on every tenant-scoped collection (load-bearing for literally every query), plus compound
  indexes matching each module's documented list filters (severity+status for incidents/alerts,
  type+value for indicators, action+result for audit logs, etc.)
- String IDs throughout (`_id: String`, our existing UUID/seed-ID scheme), not Mongo's default
  ObjectId — keeps IDs identical between in-memory and Mongo-backed modes, so cross-references
  seeded elsewhere (`assignedAnalystId`, `mitreTechniqueIds`, ...) don't need translation
- `passwordHash` has `select: false` on the User schema *and* a `toJSON` transform that strips
  it — two independent backstops behind the type-level guarantee from Phase 4
  (`Promise<PublicUser>`), so a leak would require three separate mistakes, not one
- AuditLog fields are all `immutable: true` in the schema, and `MongoAuditLogRepository` has no
  update/delete method — mirrors the same "the interface structurally can't allow it" guarantee
  `InMemoryAuditLogRepository` already had (spec §39)
- Indicator's 4-way discriminated union (IP/domain/URL/hash) uses one flat schema with
  type-specific fields declared-but-optional, rather than Mongoose discriminators — Zod already
  enforces the exact per-type shape at the API boundary, so the schema's job here is "every
  field has a declared type," not re-deriving polymorphism discriminators would add real
  complexity for little benefit
- Connection management (`config/database.ts`): fails fast on an unreachable cluster
  (`serverSelectionTimeoutMS`) rather than hanging, structured logging on
  connect/error/disconnect, graceful disconnect on shutdown

**Honest limitation — read before trusting this in production**: the Mongoose code above was
typechecked, linted, and carefully reviewed field-by-field against the in-memory
implementations it mirrors (which *are* covered by the existing 177 executed tests), but it
was **not executed against a real MongoDB** in the environment it was written in.
`mongodb-memory-server` — the standard tool for exactly this kind of test — needs to download
a real ~600MB MongoDB binary on first use, and that download measured roughly 0.16–0.5 MB/s
here, making a full local verification pass impractical in this session. A complete
integration test suite exists for the User repository
(`src/repositories/user.repository.mongo.test.ts`, run via `npm run test:mongo`, separated
from the default `npm test` for exactly this reason) as a template for the rest — **run it
yourself once, anywhere with normal internet access, before deploying this against a real
database.** The remaining 9 repositories follow the identical pattern and would benefit from
the same treatment.

## Phase 6 — AI/RAG

An `AIProvider` abstraction (`src/ai/aiProvider.ts`) sits between every AI-touching route and
OpenAI — no OpenAI-specific code exists anywhere outside `openaiProvider.ts` (spec §50/§51).
`server.ts` constructs a real `OpenAIProvider` when `OPENAI_API_KEY` is set, and passes `null`
otherwise; `AIService` treats `null` as "not configured" and returns a clean `503`, **never**
silently falls back to fake/canned content (spec §52).

**What this covers:**

- **Secret redaction** (`src/ai/redaction.ts`, spec §53/§54) — a defense-in-depth backstop
  applied to everything before it reaches a prompt: KEY=value-style credentials, Bearer
  tokens, OpenAI/AWS/GitHub key formats, JWTs, Argon2/bcrypt hashes, and PEM private key
  blocks are all stripped, recursively through nested objects
- **Prompt-injection defense** (`src/ai/promptSafety.ts`, spec §55) — every piece of
  org-controlled data (incident records, analyst questions) is wrapped in explicit
  `<untrusted_data source="...">` markers with a preamble instructing the model to treat
  enclosed text as data only, never as instructions, plus `pick()` for data minimization and
  `truncateForPrompt()` for a hard prompt-size cap
- **Structured, validated output** (spec §56) — every provider response is parsed as JSON and
  checked against a Zod schema (`answerQuestionOutputSchema`, `analyzeIncidentOutputSchema`,
  `generateRecommendationsOutputSchema`) before anything downstream sees it; malformed or
  schema-violating output throws rather than passing through
- **Human-in-the-loop recommendations** (spec §57/§58) — AI-generated recommendations are
  persisted as `status: "pending"` and can only move to `approved`/`rejected` through
  `POST /ai/recommendations/:id/review`, gated by `recommendations:approve` (super_admin and
  security_admin only — the same two roles as the frontend's matrix), and every review is
  audit-logged under the *reviewer's* real identity, resolved server-side the same way every
  other actor-attribution in this codebase is
- **AI-specific rate limiting** (spec §59) — a dedicated tier (`createAIRateLimit`, 15
  requests/minute) sits in front of the whole `/ai` router, separate from the baseline API
  limiter
- **Cost tracking and a daily cap** (spec §60) — `AICostTracker` logs every call (org, user,
  operation, tokens, duration, success) and `AIService` rejects new requests once an org
  exceeds `AI_DAILY_REQUEST_LIMIT_PER_ORG` (default 200/day) in a rolling 24h window
- **Incident analysis caching** — one analysis is cached per incident (`AIAnalysisRepository`)
  rather than regenerated on every read; `?regenerate=true` forces a fresh call, so an
  accidental page-refresh loop can't silently run up spend

**Testing** — real, executable tests for every piece that doesn't require an actual network
call to OpenAI:

- `redaction.test.ts` (12 tests) and `promptSafety.test.ts` (8 tests) — pure logic, no mocking
  needed
- `openaiProvider.test.ts` (13 tests) — `OpenAIProvider` exercised against an injected fake
  `ChatClient` (the same minimal structural interface the real `OpenAI` SDK client satisfies),
  covering correct system/user message construction, JSON-object response format, untrusted-data
  wrapping, redaction-before-prompt, Zod validation/rejection of malformed or out-of-schema
  output, and `AIProviderError` wrapping of client failures
- `ai.test.ts` (23 tests) — full HTTP-level integration suite against a `FakeAIProvider`
  (same pattern as the fake `ChatClient`, one level up): auth required, permission-gated per
  role (viewer can ask the assistant but not generate recommendations; only security_admin/
  super_admin can review one), IDOR guard on incident-scoped endpoints, analysis caching and
  forced regeneration, the full human-in-the-loop approve/reject flow with audit-trail
  verification, and — with `aiProvider: null` — a clean `503` on every AI endpoint
- Live-verified against the built server: unauthenticated → `401`, wrong permission → `403`,
  no `OPENAI_API_KEY` → `503` on an actual request (not a fake success), and the server boots
  cleanly both with and without a key present

**Honest limitation**: none of the above sends a real request to OpenAI's API — there was no
`OPENAI_API_KEY` available in this environment. `OpenAIProvider`'s actual network call
(`this.client.chat.completions.create(...)`) is a thin, direct pass-through to the injected
`ChatClient`, exercised end-to-end against the fake client above; only the literal "make an
HTTPS request to api.openai.com and get a real model response back" step is unverified. Set
`OPENAI_API_KEY` in `.env` and try the `/ai/assistant` endpoint against a running server to
confirm that last step before relying on this in production.

**Not built this phase**: RAG / vector search (spec §61–63) — named in Phase 6's scope but
out of scope for this increment; the codebase has no vector index or retrieval step yet, only
direct prompt construction from explicitly-selected context.

## Phase 7 — Threat Intelligence

A `ThreatIntelProvider` abstraction (`src/threatIntel/threatIntelProvider.ts`) sits between
`IOCService` and any external provider — spec §40 explicitly says "do not tightly couple the
application to one provider," so `IOCService` takes a **list** of providers, not a single slot;
adding a second one later is one more push onto that array, nothing else changes.
`server.ts` builds a real `VirusTotalProvider` when `VIRUSTOTAL_API_KEY` is set and an empty
list otherwise; `IOCService.enrichIndicator` treats an empty list as "not configured" and
returns a clean `503`, the same "never fabricate, just say so" posture as Phase 6's AI provider.

**What this covers:**

- **`POST /ioc/:id/enrich`** (`ioc:enrich` permission — every role except viewer) — queries
  every configured provider for the indicator's live value and folds the results into it
- **Deterministic aggregation, never AI-derived** (spec §39/§40) — `riskScore`/`severity` are
  recomputed by a fixed formula (`src/utils/risk.ts`'s `severityFromScore`, identical
  thresholds to the frontend's) from provider verdicts, never invented or explained-then-kept
  by a model. Aggregation is conservative: the **worst** score any source has *ever* reported
  wins, so a provider that once flagged something malicious isn't quietly forgotten because a
  later lookup came back clean
- **"Never present external intelligence as absolute truth" (spec §40)** — provider
  disagreement is never hidden or silently merged away: every individual lookup is appended to
  `sources[]` (`provider`/`fetchedAt`/`confidence`, spec's exact "source, timestamp,
  confidence, provider" requirement), so an analyst can see e.g. one provider called something
  malicious while another called it clean, side by side
- **API failures handled per-provider, not fatally** (spec §40) — each provider is queried via
  `Promise.allSettled`; one being down/erroring is logged and skipped, it never fails the whole
  enrichment or the providers that did respond. If every configured provider fails at runtime,
  the endpoint still returns `200` with the indicator unchanged — a transient external problem
  is not the same as "not configured," and neither one ever fabricates a result
- **Quotas** (spec §40) — a `429` from the provider is raised as a distinct `ThreatIntelQuotaError`
  rather than a generic failure, so it's identifiable in logs; `createEnrichRateLimit` (15
  requests/minute) also caps request *frequency* independently, same reasoning as Phase 6's AI
  rate limiter
- **Timeouts** (spec §40) — the real HTTP client (`buildFetchHttpClient`) aborts any request
  after 8 seconds
- **Stale data** (spec §40) — re-querying the same provider for the same indicator within
  `IOC_ENRICHMENT_STALE_AFTER_HOURS` (default 24h) is skipped, returning the indicator
  unchanged rather than burning provider quota for nothing; `?force=true` bypasses that cache
  explicitly
- **Missing data** (spec §40) — a provider 404 (nothing on file for this indicator) maps to
  verdict `"unknown"`, not an error
- **Response validation** (spec §56's principle applied to an external API, not just AI) — the
  VirusTotal response is parsed as JSON and checked against a Zod schema before anything reads
  from it; an unexpected shape throws a clean `ThreatIntelProviderError` instead of silently
  reading `undefined` into a verdict

**Testing** — real, executable tests for every piece that doesn't require an actual network
call to VirusTotal:

- `virusTotalProvider.test.ts` (12 tests) — `VirusTotalProvider` exercised against an injected
  fake `HttpClient` (same DI pattern as `openaiProvider.test.ts`'s fake `ChatClient`): verdict/
  score/confidence mapping for malicious/suspicious/clean/unknown, 404→unknown, 429→
  `ThreatIntelQuotaError`, 401→non-retryable error, 5xx→retryable error, malformed-response
  rejection, network-failure wrapping, correct API-key header, and correct per-type URL
  construction
- `ioc.test.ts`'s `enrich` suite (11 tests, HTTP-level, `FakeProvider` injected through
  `createApp`'s `threatIntelProviders` dep) — auth required, `403` for a role lacking
  `ioc:enrich`, `503` with zero providers configured, conservative score aggregation
  (upgrades severity, never downgrades it), IDOR guard, `404` on a nonexistent indicator, the
  staleness cache skipping a fresh provider and `?force=true` bypassing it, a failing provider
  being skipped while a succeeding one still updates the indicator, `200`-not-error when every
  provider fails, and an `IOC_ANALYZED` audit entry recorded under the real actor
- Live-verified against the built server: unauthenticated → `401`, wrong permission → `403`,
  no `VIRUSTOTAL_API_KEY` → `503` on an actual request, server boots cleanly either way

**Honest limitation**: none of the above sends a real request to VirusTotal's API — there was
no `VIRUSTOTAL_API_KEY` available in this environment. `VirusTotalProvider`'s actual network
call is a thin pass-through to the injected `HttpClient`, exercised end-to-end against the fake
client above; only the literal "make an HTTPS request to virustotal.com and get a real
response back" step is unverified. Set `VIRUSTOTAL_API_KEY` in `.env` and try
`POST /ioc/:id/enrich` against a running server to confirm that last step before relying on
this in production.

**Not built this phase**: threat correlation (spec §41, IP→domain→URL→hash→incident→user→
technique relationship-building) is explicitly Phase 9's "threat graph/correlation," not this
one — nothing here fabricates or infers relationships between indicators.

## Phase 8 — Behavioral/Anomaly Detection

A real, self-hosted Python service (`ml-service/`, FastAPI + scikit-learn `IsolationForest`,
spec §42 — "do not start with an unnecessarily complex neural network") sits behind an
`AnomalyDetectionProvider` abstraction (`src/anomalyDetection/anomalyProvider.ts`), the same DI
shape as Phase 6/7's `AIProvider`/`ThreatIntelProvider`. `server.ts` constructs a real
`MlServiceProvider` when `ML_SERVICE_URL` is set and `null` otherwise; `AnomalyDetectionService`
treats `null` as "not configured" and returns a clean `503` — same posture as every other
optional external dependency in this codebase.

**What this covers:**

- **`SecurityEvent` ingestion and storage** (`POST`/`GET /security-events`, `anomaly:detect`/
  `anomaly:read`) — raw behavioral telemetry (logins, file access, endpoint hits, ...),
  mirroring the frontend's `src/types/security-event.ts` with `organizationId` added, same as
  every other domain type
- **Deterministic feature extraction, never AI or the ML service's job** (spec §42's exact
  feature list) — `featureExtraction.ts` computes the seven named features (login-hour
  deviation, new-location flag, request frequency, resource access count, file downloads,
  auth failures, unusual endpoint access) from a user's raw event history via plain arithmetic;
  the ML service only ever receives the finished numbers, never raw events, so it stays a
  narrow, reusable scoring component
- **`POST /security-events/analyze/:userId`** (`anomaly:detect`) — validates the target user
  belongs to the caller's own organization first (spec §19/§20: an IDOR guard identical to
  every other cross-referenced ID in this codebase — a foreign user ID gets the same `404` as
  a nonexistent one), computes features from their history, and returns the ML service's
  verdict
- **Explainability without an LLM** (spec §42: "anomaly score, confidence, features
  contributing to anomaly") — `ml-service/app/model.py` computes all three from
  `IsolationForest`'s own output plus a separate per-feature z-score against its training
  baseline; see `ml-service/README.md` for the exact method
- **A documented placeholder training baseline** — there's no real historical org telemetry to
  train on yet (this is the first phase to produce `SecurityEvent`s at all), so the model
  trains once at startup against a fixed-seed synthetic "typical behavior" baseline rather than
  pretending a real training pipeline exists before one does (see `ml-service/README.md`)
- **Rate limiting** (`createAnomalyRateLimit`, 15 requests/minute) — same reasoning as Phase
  6/7: each analysis call is a real request to an external-to-the-request-path service
- **Audit trail** — every analysis is recorded as `ANOMALY_DETECTED` against the real actor,
  severity `medium` when the result flags an anomaly and `info` otherwise (mirrors
  `RECOMMENDATION_APPROVED`'s reasoning: the audit entry reflects what was found, not just that
  a check ran)

**Testing** — real, executable tests for every piece that doesn't require the actual Python
service running:

- `featureExtraction.test.ts` (11 tests) — pure logic, no mocking needed: zero events → all
  zeros, hour-deviation measured against a computed baseline (not an absolute clock value) and
  defaulting to 0 with no baseline history, new-location flagging, requests-per-minute math,
  distinct-endpoint counting, file-download/auth-failure counting, "unusual endpoint" only
  flagged when a baseline of known endpoints actually exists, and window-boundary exclusion
- `mlServiceProvider.test.ts` (7 tests) — `MlServiceProvider` exercised against an injected
  fake `HttpClient` (same DI pattern as `openaiProvider.test.ts`/`virusTotalProvider.test.ts`):
  correct response mapping, correct snake_case POST body the Python service expects, 422→
  non-retryable error (our own payload was bad), 5xx→retryable error, malformed-response
  rejection, network-failure wrapping, and out-of-range score rejected as a schema violation
- `anomalyDetection.test.ts` (11 tests, HTTP-level, `FakeProvider` injected through
  `createApp`'s `anomalyDetectionProvider` dep) — auth required, `403` for a role lacking
  `anomaly:detect`, `503` with no provider configured, a real provider result (anomalous and
  benign) passed through unmodified, `404` for a nonexistent user, the IDOR guard on
  cross-organization analysis, `windowHours` respected, and an `ANOMALY_DETECTED` audit entry
  recorded under the real actor
- Live-verified against the built server: unauthenticated → `401`, wrong permission → `403`,
  no `ML_SERVICE_URL` → `503` on an actual request, seeded events list and a new event ingests
  successfully, server boots cleanly either way

**Update — verified for real.** `pip install` for the Python service's dependencies failed
three separate times against severely throttled network access (the same class of limitation
Phase 5's MongoDB section describes) before a later attempt succeeded. Once installed, the
real `pytest` suite in `ml-service/tests/` was run for the first time: **14/14 passed.** A live
end-to-end round trip was also verified — the real FastAPI service running, the real Node
backend pointed at it via `ML_SERVICE_URL`, and a real authenticated
`POST /security-events/analyze/user_3` request flowing all the way through: deterministic
feature extraction → real HTTP call → real `IsolationForest` scoring → back through the full
stack, correctly flagging the seeded suspicious-activity cluster (`anomalyScore: 91.1`,
`confidence: "high"`, `login_hour_deviation` correctly ranked as the top contributing feature).
See `ml-service/README.md` for the full detail.

**Not built this phase**: correlation between an anomaly and existing incidents/indicators
(spec §41's relationship-building) — Phase 9's job, not this one. This phase produces an
anomaly signal about a user; it doesn't decide what, if anything, that signal should connect
to.

## Phase 9 — Threat Graph & Correlation

Phase 3 already built `GraphService` (`src/threatGraph/`), which *assembles* a graph purely
from relationships already explicitly recorded on existing records (an indicator's own
`relatedIncidentIds`, an incident's `mitreTechniqueIds`, ...). What Phase 9 adds is the piece
spec §41 actually asks for that Phase 3 didn't cover: **discovering new relationships from
evidence that isn't linked yet.**

- **`findCorrelations`** (`src/threatGraph/correlation.ts`) — a pure, deterministic function
  that compares one indicator against every other indicator and security event in the same
  organization and reports concrete, literal matches: a security event's `sourceIp` equal to
  an IP indicator's value, two IP indicators sharing the same ASN, two hashes sharing the same
  `malwareFamily`, a domain indicator matching a URL indicator's `domain` field, or two
  indicators sharing a tag. **Nothing here is inferred, fuzzy-matched, or AI-suggested** — spec
  §41 is explicit: "do not fabricate relationships using AI." Every candidate has a fixed,
  documented confidence (`high` for a direct observation or exact classification/domain match,
  `medium` for shared infrastructure, `low` for a shared tag alone) — never learned, never
  adjusted after the fact
- **`GET /threat-graph/correlations/:indicatorId`** (`threat_graph:read`, same permission as
  the graph itself) — returns the candidate list for one indicator. IDOR-guarded the same way
  as every other indicator lookup: a nonexistent or foreign-org indicator ID gets an identical
  `404`
- **Candidates are never auto-linked** — spec §41: "AI may suggest possible relationships, but
  deterministic evidence should be clearly separated [from confirmed links]." A candidate here
  isn't AI at all, but the same separation principle applies: it's not written into
  `sources[]`/`relatedIncidentIds`/etc. until an analyst reviews it and links the two records
  for real through the existing investigation endpoints (`POST /investigations/:id/indicators`)
  — the same human-in-the-loop shape Phase 6 established for AI recommendations, reused here
  for a non-AI signal

**Testing** — entirely real and executable; no external dependency of any kind:

- `correlation.test.ts` (11 tests) — pure logic: each of the five evidence types matches when
  it should and doesn't when the shared field is absent/different, the subject is never
  matched against itself, multiple evidence types can surface for the same related indicator,
  and no evidence returns an empty array
- `graph.test.ts`'s `correlations` suite (6 new tests, HTTP-level) — auth required, `404` for a
  nonexistent indicator, the IDOR guard, a real shared-domain-and-shared-tag correlation found
  against the seeded `ind_4`/`ind_5` pair, a shared-`sourceIp` correlation against a seeded
  security event, and an empty array (not an error) for an indicator with no matches
- Live-verified against the built server: the seeded domain/URL pair returns both
  `shared_domain` and `shared_tag` candidates, an unrelated hash indicator returns `[]`, and a
  nonexistent indicator ID returns a clean `404`

No "honest limitation" section this time — everything here is pure TypeScript logic over data
already in the database, with no network call, external API, or unexecuted dependency
anywhere in the path.

**Not built this phase**: response workflows that act on a correlation candidate (Phase 10),
and a persisted "confirmed correlation" record distinct from the underlying link fields it
would just duplicate — today, confirming a candidate means using the existing investigation
linking endpoints, which already record it for real.

## Phase 10 — Response Workflows

The RESPOND stage of the lifecycle (`DETECT→ENRICH→CORRELATE→ANALYZE→EXPLAIN→PRIORITIZE→
RESPOND→AUDIT`). `src/responseWorkflow/` builds a `ResponseAction` — a request to block an IP,
isolate a host, disable an account, force a password reset, block a domain, or quarantine a
file — through two separate human gates, matching CLAUDE.md's core rule directly: *"Critical
actions require deterministic backend validation and, where appropriate, human approval."*

- **`response:request`** (every role except viewer) creates an action in `pending_execution`
- **`response:execute`** (super_admin/security_admin only — the same tier as
  `recommendations:approve`) either executes or rejects it. A double-execute or execute-after-
  reject returns a clean `409`, not a silent no-op, so a repeated click can't be read as two
  separate real actions

**`POST /response-actions/apply-recommendation/:recommendationId`** closes the loop Phase 6's
own code flagged as unfinished — `ai.service.ts`'s header comment on `Recommendation` says
plainly: *"Nothing in this codebase transitions a recommendation to 'applied' automatically;
that would be wiring a real response workflow (Phase 10)."* This endpoint is that wiring: it
requires the recommendation to already be `status: "approved"` (Phase 6's human-in-the-loop
gate — still pending or already-rejected recommendations get a `409`, checked before anything
is created or executed, not after), then creates and immediately executes a `ResponseAction`
tagged with `type: "recommended_action"` and `recommendationId`, and moves the recommendation
to `status: "applied"` via a new `RecommendationRepository.markApplied()` (deliberately a
method `review()`'s own type signature can't reach — `review()`'s status parameter explicitly
excludes `"applied"`, so the only way a recommendation becomes applied is through this real
workflow, never through the review endpoint being called with an unexpected value).

**Execution is honestly simulated, never faked as real** — `ResponseActionExecutor`
(`actionExecutor.ts`) is the same dependency-injection shape as `AIProvider`/
`ThreatIntelProvider`/`AnomalyDetectionProvider`, but with one difference: there's no "not
configured" `503` case, because the only implementation that exists yet —
`SimulatedActionExecutor` — always succeeds. It **always** returns `isSimulated: true` and an
`executionResult` string that says plainly no live EDR/firewall/IAM integration exists for
this deployment and nothing was sent to an external system. Wiring a real executor behind the
same interface is explicitly Phase 12's job ("integration" in the phase list) — this phase
builds the entire workflow (request → approve/execute → audit) for real, with the one thing
that's fundamentally out of scope until Phase 12 clearly labeled as such on every response,
never silently implied as more than it is.

**Testing** — entirely real; the executor has no external dependency to be unverified:

- `actionExecutor.test.ts` (4 tests) — always reports `isSimulated: true`, includes the target
  in its result, falls back sensibly with no target (`recommended_action`), and always states
  plainly that no live integration exists
- `responseWorkflow.test.ts` (19 tests, HTTP-level) — auth required, `403` for `response:request`
  without permission and for `response:execute` without permission, `404` for a nonexistent
  incident/action/recommendation, the IDOR guard, rejecting the internal-only
  `recommended_action` type if submitted directly, the full request→execute flow, `409` on a
  double-execute and on executing an already-rejected action, reject-instead-of-execute, all
  three `apply-recommendation` outcomes (still-pending → `409`, rejected → `409`, approved →
  `201` executed and the recommendation flips to `applied`), and an audit trail with
  `RESPONSE_ACTION_REQUESTED`/`RESPONSE_ACTION_EXECUTED` recorded under the two different real
  actors (the requesting analyst, then the approving admin)
- Live-verified against the built server: an analyst requests a block-IP action, an admin
  executes it and gets back a real `isSimulated: true` result with the exact target named, and
  the analyst's own attempt to execute is a clean `403`

No "honest limitation" section — like Phase 9, everything here is real logic with no external
dependency in the path; the one thing that's intentionally not real (execution against an
actual external system) is labeled as such in the response itself, not hidden in a README.

**Not built this phase**: a real executor behind `ResponseActionExecutor` (Phase 12,
"integration"), and `ResponseAction`/`ResponseActionRepository` aren't Mongo-backed yet —
same tradeoff `RecommendationRepository`/`AIAnalysisRepository` already had; see Phase 5's
section for the pattern this follows.

## Phase 11 — Cybersecurity Hardening

Spec §116-118: an OWASP-aligned security code review plus adversarial testing across
authentication, authorization, input validation, external requests, AI integration, and
tenant isolation. Most of this codebase was already hardened incrementally as each module was
built — every domain module's own test suite already includes an "authentication and
authorization" block covering unauthenticated access, wrong-permission access, and an IDOR/
tenant-isolation guard (a foreign-org ID gets the identical `404` a nonexistent one would) —
so this phase's real job was auditing the newest, least-scrutinized surface (Phases 6-10) and
closing whatever that turned up, not re-litigating what every other phase already covered.

**Method**: a two-stage automated review — one pass reading the full `git diff` since Phase 5
(84 files, ~5,500 lines: all of AI/RAG, threat intel, anomaly detection, correlation, and
response workflows) for concrete, exploitable vulnerabilities across injection, authZ/authN,
crypto, SSRF, and prompt injection; a second, independent pass re-reading the actual source
for each candidate finding against a strict false-positive filter (hard exclusions for DOS,
theoretical/self-only issues, missing-hardening-as-opposed-to-a-vulnerability, etc.) before
anything got acted on.

**Found and fixed**: `wrapUntrustedData()` (`src/ai/promptSafety.ts`, spec §55's structural
prompt-injection defense) redacted secrets in untrusted content but never neutralized the
literal `</untrusted_data>`/`<untrusted_data ...>` marker sequence itself — content containing
that exact text could close the labeled block early and make attacker-authored text that
followed look structurally like it sat outside the untrusted region. Confirmed as a genuine,
if bounded, cross-user issue: an incident's `description` (settable by any `incidents:write`
user) reaches a *different* user's AI assistant session and the persisted, `incidents:read`-
wide `AIAnalysis` cache via this same code path. The verification pass capped it at bounded
severity — every AI output stays Zod-schema-constrained to short free-text fields, nothing it
produces is auto-executed or auto-persisted as fact, and `generateRecommendations` output
requires separate `recommendations:approve` review before Phase 10's workflow can act on it —
but a real defensive-code gap with a cheap, safe fix doesn't need to wait for a worse outcome
to be worth closing. Fixed by escaping any literal marker sequence inside untrusted content
before wrapping it (`escapeMarkers()`), with two new regression tests confirming exactly one
real closing tag survives in the assembled prompt regardless of what the untrusted content
contains, and that the escaped text stays visible to the model as data rather than being
silently dropped.

**Verified clean, no changes needed**:
- `npm audit` — zero vulnerabilities, frontend and backend, dependencies and dev-dependencies
- SSRF — every new outbound call (`VirusTotalProvider`, `MlServiceProvider`) targets a fixed
  host from either a hardcoded string or an admin-configured env var, never a value derived
  from request data; user-supplied indicator values only ever appear in the request *path*,
  never control the host or protocol
- Tenant isolation — every new repository method (indicator `update`, `ResponseAction`,
  `SecurityEvent`, the `Recommendation.markApplied` addition) scopes by `organizationId`
  exactly like the modules built in earlier phases
- CSRF — the refresh-token cookie already uses `sameSite: "strict"`, `httpOnly`, and a path
  scoped to `/api/v1/auth` only (pre-existing from Phase 3, re-verified here); every other
  route authenticates via the `Authorization` header, which no cross-site request can forge
- JWT — signing and verification are both pinned to a single allowlisted algorithm (`HS256`),
  closing the classic algorithm-confusion/`alg: none` attack class (pre-existing, re-verified)
- No file-upload surface exists anywhere in the API — `file upload abuse` from spec §118's list
  is not applicable to this codebase
- NoSQL injection — new Mongo query filters build plain objects from typed/validated fields;
  the one regex-based search path escapes regex metacharacters

**Not built/run this phase**: a live dynamic scan (OWASP ZAP, spec §118) — no such tool is
available in this environment; the adversarial categories it would probe (auth bypass, IDOR,
rate-limit bypass, session attacks) are instead covered by the real HTTP-level tests already
present in every module's own suite, run against the actual Express app via supertest rather
than a black-box scanner. A real ZAP pass against a deployed instance remains a good idea
before production use.

## Phase 12 — Full-System Integration

The frontend (Phases 1-2) was built entirely against `Mock*Service` implementations, with the
service interfaces deliberately designed so "a future `Api*Service` implementation replaces it
without any change required in components/hooks that depend on this interface" (frontend
`src/services/*.service.ts`'s own header comments, written before the backend existed). This
phase is that replacement — the frontend's `FINAL EXECUTION INSTRUCTION` spec text says it
directly: *"Replace mock services incrementally... do not break the completed frontend...
maintain backward compatibility with established frontend contracts."*

**What changed, and where:**
- `src/services/api/` (frontend) — one real `Api*Service` per ported interface, each a thin
  HTTP client translating the exact same method signatures the mocks already implement into
  real requests against the versioned backend API
- `src/services/api/client.ts` — the shared plumbing every `Api*Service` funnels through:
  an in-memory (never `localStorage`) access token, automatic single-flight refresh-on-401,
  the backend's `{data, meta?}`/`{error:{code,message,...}}` envelope translated into either
  a return value or a thrown `ApiError`, and a `404`→`null` helper matching every mock
  service's existing "not found is a value, not an exception" contract
- `src/services/index.ts` — the one new indirection point: resolves to the real services when
  `VITE_API_BASE_URL` is set, mock services otherwise (the default — the frontend still runs
  standalone with no backend, exactly as every phase before this one). 16 files across
  `src/api/`, `src/hooks/`, and `src/pages/auth/` were repointed from importing
  `@/services/mock` directly to importing this resolved `@/services` — the only frontend
  change this phase made beyond adding the new `services/api/` directory itself

**Ported to the real backend**: auth, incidents, alerts, IOC/threat-intel, users +
organization, audit (read path — see below), threat graph, MITRE, investigations, reports, AI
assistant/analysis/recommendations.

**Not ported — `threat` stays on `MockThreatService`**: `getOrgRiskScore`, `getSystemHealth`,
`listActivityTimeline`, and `listTopTechniques` are dashboard-aggregation reads with no
backend endpoint — none of Phases 3-11 built a dedicated risk-score/system-health/activity-
timeline API, because none of those phases needed one for what they were building. Porting
`threat` would mean inventing new backend surface under the label "integration," which is
scope creep this phase deliberately didn't take on; it's honestly flagged here as follow-up
work instead of silently left half-wired.

**Two real, deliberate behavior differences from the mocks** (both necessary, both
documented at the call site):
- `AuditService.record()` is a no-op against the real backend. Every mock caller invokes it
  only because `MockAuditService` is the *sole* thing that records anything in mock mode; the
  real backend already records its own audit entry, server-attributed, as a direct side
  effect of the action that just succeeded (see the Audit Logs section above) — and the audit
  router has no write route *at all* (spec §39: read-only, never a client-submitted entry).
  Calling one here would either 404 or, if it existed, undermine the exact guarantee that
  route's absence protects.
- `AIService.analyzeIncident()` returns `null` (not a thrown error) on a real `503` — the
  backend's analysis endpoint is get-or-generate, so an unconfigured deployment (no
  `OPENAI_API_KEY`) genuinely can't return anything; the UI degrading to "no analysis
  available" is more useful than an error boundary for a capability that's simply off.
  `askAssistant()` deliberately does NOT get the same treatment — a chat message the user is
  actively waiting on should surface as a real error, not silently do nothing.

**Testing — the strongest verification story in this codebase**: every previous phase's
"honest limitation" was some external dependency (OpenAI, VirusTotal, MongoDB, a Python
service) this environment's network couldn't reach. The *real backend* has no such problem —
it's the one thing this project fully controls, so this phase could verify against the actual
article instead of a fake:
- `auth.service.integration.test.ts` (7 tests) and `services.integration.test.ts` (12 tests)
  spawn the **real, compiled backend server** (`backend/dist/server.js`) as a child process,
  point the real `Api*Service` classes at it via `vi.stubEnv`, and exercise them over genuine
  HTTP — login, wrong-password rejection, registration, a real weak-password `422`, logout,
  and (for every other ported service) list/getById/create against the real seeded demo data,
  plus the real audit trail reflecting a real IOC submission, and the real `503`→`null`/
  `503`→thrown split for the two AI methods. No mocked `fetch`, no stubbed response bodies —
  the actual Express app, actually listening on a real port, actually validating with the
  same Zod schemas and Argon2id hashing every backend unit test already exercises
  independently
- The one thing a Node test genuinely can't exercise is a real browser's automatic
  `credentials: "include"` cookie handling across separate `fetch()` calls (Node's `fetch` has
  no cookie jar) — the refresh-cookie test instead manually captures the real `Set-Cookie`
  header from a real login and presents it back on a real refresh call, proving the *server-
  side* mechanism `getSession()` depends on is correct; the browser's own cookie-jar behavior
  is standard platform behavior, not something this codebase implements
- Every test file skips (via each test's own runtime `skip()`, not a collection-time guard)
  if `backend/dist/server.js` hasn't been built yet, rather than failing confusingly
- Full regression: frontend typecheck/lint clean, **148/148** tests passing (129 pre-existing
  mock-mode tests, unaffected — `VITE_API_BASE_URL` stays unset in the default test run — plus
  19 new real-backend integration tests), no leftover child processes after any run

## Not yet built (later phases — nothing here is silently faked)

- RAG/vector search (Phase 6, deferred — see above), a second threat-intel provider beyond
  VirusTotal (Phase 7 supports it architecturally but only one is wired up), a real training
  pipeline over actual org data for the anomaly-detection model (Phase 8's synthetic baseline
  is a documented placeholder — see `ml-service/README.md`), a persisted "confirmed
  correlation" record (Phase 9), a real executor behind `ResponseActionExecutor` — actual
  EDR/firewall/IAM integration
- A backend dashboard-aggregation API (org risk score, system health, activity timeline, top
  techniques) — `ThreatService` stays on `MockThreatService` on the frontend until one exists
  (Phase 12's own section above has the detail)
- Broader adversarial tooling Phase 4 didn't cover: Semgrep static analysis, OWASP ZAP
  dynamic scanning, and CI-integrated Dependabot — spec §3 devsecops recommendations that need
  either tool access or a CI pipeline this project doesn't have yet
- Real email delivery — no mailer exists yet, so `forgotPassword`/registration hand the raw
  token back in the API response when `NODE_ENV !== production` (never in production) so the
  flow is testable end to end. This is a real, working token — just delivered by a different
  channel than production will eventually use.
- Redis/BullMQ for background jobs, and a vector search index for RAG — both named in the
  project's tech stack but not needed by anything built through Phase 12

## Development

```bash
cp .env.example .env   # then fill in required values
npm install
npm run dev             # tsx watch, http://localhost:4000
npm run typecheck
npm run lint
npm run test
npm run build && npm start
```

## Structure

```
src/
  config/      environment loading & validation (fails fast on missing/invalid config)
  errors/      AppError hierarchy — the only errors safe to describe to a client
  middleware/  request ID, security headers/CORS, rate limiting, error handling
  routes/      versioned under /api/v1
  utils/       logger (Pino, redacts secrets), API response envelope
  types/       ambient type augmentations
  app.ts       assembles the Express app (no side effects — safe to import in tests)
  server.ts    entry point: starts the HTTP server, handles graceful shutdown
```

`app.ts` and `server.ts` are deliberately split so tests can exercise the app via
`supertest` without binding a real port.
