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

## Not yet built (later phases — nothing here is silently faked)

- RAG/vector search (Phase 6, deferred — see above), real threat-intel provider integrations
  (Phase 7), anomaly detection (Phase 8), a real correlation/risk engine (Phase 9), response
  workflows (Phase 10)
- Broader adversarial tooling Phase 4 didn't cover: Semgrep static analysis, OWASP ZAP
  dynamic scanning, and CI-integrated Dependabot — spec §3 devsecops recommendations that need
  either tool access or a CI pipeline this project doesn't have yet
- Real email delivery — no mailer exists yet, so `forgotPassword`/registration hand the raw
  token back in the API response when `NODE_ENV !== production` (never in production) so the
  flow is testable end to end. This is a real, working token — just delivered by a different
  channel than production will eventually use.
- Redis/BullMQ for background jobs, and a vector search index for RAG — both named in the
  project's tech stack but not needed by anything built through Phase 5

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
