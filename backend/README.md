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

**Not yet built** (later increments of this same phase, or later phases entirely — nothing
below is silently faked):

- Remaining domain routes (reports, audit logs, MITRE, threat graph) — next increments,
  following the established pattern
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
