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

**Not yet built** (later increments of this same phase, or later phases entirely — nothing
below is silently faked):

- Threat Graph — the last domain module. Unlike the others, it likely needs no new persisted
  state of its own: the frontend's graph view is just nodes/edges assembled from
  incidents/alerts/indicators/users/MITRE data that all already exist server-side now, so this
  is expected to be a thinner composition layer rather than a new repository.
- A real database — Phase 5. Repositories are in-memory, behind the same interfaces a MongoDB
  implementation will fulfill later; nothing above that seam needs to change when it does.
- Real email delivery — no mailer exists yet, so `forgotPassword`/registration hand the raw
  token back in the API response when `NODE_ENV !== production` (never in production) so the
  flow is testable end to end. This is a real, working token — just delivered by a different
  channel than production will eventually use.
- Real AI/OpenAI calls — Phase 6
- Real threat-intel provider integrations — Phase 7

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
