# Security

This document explains **how** ThreatLens implements each control, not just that it exists.
Every claim below is backed by a specific file and, in almost every case, a specific test —
paths are given so you can verify each one yourself.

## 1. Security architecture

The backend follows a "trust nothing external" posture (see `backend/README.md`'s repeated
"never trust the request body" note): every write path re-derives the acting user's identity
from their verified session, never from anything the client sent; every read/write is scoped
to the caller's own organization at the data-access layer, not just checked at the route; and
every external input — request bodies, query params, AI provider responses, threat-intel
provider responses — is Zod-validated before anything touches it.

Frontend-side checks (route guards, hidden buttons for a role that lacks a permission) are
**UX only**. They make the app pleasant to use; they do nothing to stop a request crafted by
hand. The backend independently re-checks everything, every time — see §3.

## 2. Authentication

**Password storage**: Argon2id (`backend/src/security/passwords.ts`), not bcrypt/scrypt/SHA —
memory-hard, resistant to GPU cracking. Verified in `passwords.test.ts`.

**Password policy**: minimum 12 characters, must include an uppercase letter, lowercase
letter, number, and symbol (`backend/src/auth/schemas.ts`) — enforced identically on the
frontend (UX) and backend (the actual gate), so a user is never told "accepted" client-side
and then rejected by the API.

**Tokens**: two separate JWTs, signed with two separate secrets (`JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`) so compromising one token type doesn't compromise the other:

- **Access token** — 15 minutes, sent in the `Authorization: Bearer` header, kept in memory
  on the frontend only (never `localStorage`, never a cookie). Carries `sub` (user id),
  `org` (organization id), `role`, and a unique `jti` (so two tokens issued in the same
  second are never byte-identical).
- **Refresh token** — 30 days, delivered as an `httpOnly`, `SameSite=Strict` cookie scoped
  to `/api/v1/auth` only (`backend/src/auth/auth.controller.ts`) — invisible to JavaScript,
  never sent to any other route, and unusable by a cross-site request (see §7).

**Algorithm pinning**: both signing and verification are hard-pinned to `HS256`
(`backend/src/security/tokens.ts`) with an explicit `algorithms: ["HS256"]` allowlist at
verify time — this closes the classic "alg: none" / algorithm-confusion attack class, where an
attacker gets a server to accept a token signed with a different (often weaker or absent)
algorithm than the one it expects.

**Refresh token rotation with reuse detection**: every `/auth/refresh` call issues a brand new
refresh token and immediately invalidates the one just presented. If an already-consumed
refresh token is ever presented again — the signature of a stolen token being replayed after
the legitimate user has already rotated past it — the **entire session family** is revoked,
not just that one token (`backend/src/auth/refreshTokenStore.ts`, tested in
`refreshTokenStore.test.ts`).

**Account enumeration resistance**: a login with a wrong password and a login with a
nonexistent email return the exact same `401` with the exact same message
(`"Invalid email or password."`) — an attacker can't use the login form to discover which
emails have accounts. A suspended account's status is only ever revealed *after* the password
has already been proven correct, never before (`auth.test.ts`).

**Rate limiting on credentialed endpoints**: login/register/refresh are limited to 10 requests
per 15 minutes per IP (`createAuthRateLimit`); password reset/email verification/password
change are limited to 5 per hour (`createSensitiveActionRateLimit`) —
`backend/src/middleware/rateLimit.ts`. This is genuinely triggered and tested, not just
configured — see `auth.test.ts`'s "locks out repeated login attempts" test, which fires 11
real requests and asserts the 11th gets a real `429`.

## 3. Authorization (RBAC)

Four roles: `super_admin`, `security_admin`, `security_analyst`, `viewer`.

The full, current permission matrix lives in `backend/src/auth/permissions.ts` (mirrored, for
UX only, in `src/constants/roles.ts` on the frontend). As of this writing:

| Permission | super_admin | security_admin | security_analyst | viewer |
|---|:---:|:---:|:---:|:---:|
| `incidents:read` | ✓ | ✓ | ✓ | ✓ |
| `incidents:write` / `:assign` | ✓ | ✓ | ✓ | |
| `alerts:read` | ✓ | ✓ | ✓ | ✓ |
| `alerts:write` | ✓ | ✓ | ✓ | |
| `ioc:read` | ✓ | ✓ | ✓ | ✓ |
| `ioc:submit` / `:enrich` | ✓ | ✓ | ✓ | |
| `threat_graph:read` | ✓ | ✓ | ✓ | ✓ |
| `anomaly:read` | ✓ | ✓ | ✓ | ✓ |
| `anomaly:detect` | ✓ | ✓ | ✓ | |
| `investigations:read` | ✓ | ✓ | ✓ | ✓ |
| `investigations:write` | ✓ | ✓ | ✓ | |
| `reports:read` | ✓ | ✓ | ✓ | ✓ |
| `reports:generate` | ✓ | ✓ | ✓ | |
| `users:read` | ✓ | ✓ | | |
| `users:manage` | ✓ | | | |
| `settings:read` | ✓ | ✓ | ✓ | ✓ |
| `settings:manage` | ✓ | ✓ | | |
| `audit:read` | ✓ | ✓ | ✓ | ✓ |
| `recommendations:approve` | ✓ | ✓ | | |
| `response:request` | ✓ | ✓ | ✓ | |
| `response:execute` | ✓ | ✓ | | |

Two deliberate design choices worth calling out:

- **`users:manage` is super_admin-only** — `security_admin` can see the user directory but
  can't change anyone's role or status, and a `super_admin` can never change their *own* role
  or status either, even though they technically have the permission — a safety rule
  preventing an admin from accidentally locking themselves (and everyone else) out
  (`backend/src/users/users.service.ts`).
- **`response:execute` and `recommendations:approve` sit at the same, higher tier** —
  executing a response action or applying an AI recommendation are both "someone with real
  authority signs off on a potentially disruptive action" operations, deliberately excluded
  from `security_analyst`.

Enforcement is at the route level (`requirePermission(permission)` middleware) for the vast
majority of endpoints, plus at the service level for the handful of cases route-level RBAC
can't express — e.g. "you can edit your own profile regardless of `users:manage`, but not
someone else's" depends on *whose* record is being touched, not just who's calling
(`backend/src/users/users.controller.ts`).

## 4. Tenant isolation

Every repository method takes `organizationId` as a **required** first argument — there is no
code path that queries data without it. `getById`-style methods return `null` for both "this
ID doesn't exist" and "this ID exists but belongs to a different organization" — the caller
can't distinguish the two, which is exactly the point: it's what stops "change the ID in the
URL" from being usable to probe what exists in another tenant.

This is verified with an explicit test in **every single domain module's test file** — the
pattern is always: register a brand-new account (a fresh organization), then try to fetch a
resource by an ID known to belong to the seeded demo organization, and assert a `404`. Grep
for `"IDOR guard"` across `backend/src/**/*.test.ts` to see all of them.

Object-level authorization extends this to *referenced* resources, not just the one in the
URL: assigning an incident checks the assignee belongs to the same org as the incident;
linking an investigation to an incident checks that incident exists in the caller's org too.

## 5. Encryption strategy

- **In transit**: the app is designed to run behind TLS in production (`secure: true` on the
  refresh cookie when `NODE_ENV=production`); local development runs over plain HTTP, which is
  standard and expected for `localhost`.
- **At rest — passwords**: Argon2id hashes only, never the plaintext (§2).
- **At rest — password-reset / email-verification tokens**: stored only as a SHA-256 digest of
  the token, never the token itself — even a full database read can't be used to forge a valid
  reset link (`backend/src/security/`).
- **At rest — everything else**: no additional field-level encryption exists today. Indicator
  values, incident descriptions, etc. are stored as plain fields — see "Data classification"
  in `docs/05-database.md` for why that's an acceptable posture for what's stored today, and
  what would change it.

## 6. Secrets management

- Every secret (JWT signing keys, `OPENAI_API_KEY`, `VIRUSTOTAL_API_KEY`, `MONGODB_URI`) is
  read from environment variables via a single Zod-validated schema
  (`backend/src/config/env.ts`) that **fails the process at startup** if a required secret is
  missing or malformed — never silently continues with an undefined security configuration.
- Nothing is hardcoded, ever — grep the codebase for a literal API key or password and you
  will not find one outside of test fixtures (which use obviously-fake values like
  `"fake-key"`).
- The structured logger (`backend/src/utils/logger.ts`, Pino) redacts common secret-shaped
  fields automatically.
- A dedicated redaction layer (`backend/src/ai/redaction.ts`) strips credential-shaped
  patterns — `KEY=value` pairs, Bearer tokens, OpenAI/AWS/GitHub key formats, JWTs, password
  hashes, PEM private key blocks — from anything before it's sent to an AI prompt, as
  defense-in-depth on top of "don't put secrets in incident descriptions in the first place."
- `.env` / `.env.local` are listed in `.gitignore` in both the frontend and backend; only
  `.env.example` (placeholders only) is committed.

## 7. CSRF

The refresh-token cookie (§2) is the only cookie-based authentication in the app, and it's
protected three ways at once:

1. `SameSite=Strict` — the browser refuses to attach the cookie to any cross-site request at
   all, regardless of origin, so a forged cross-site refresh/logout can't succeed even without
   a separate CSRF token.
2. `path=/api/v1/auth` — the cookie is never sent to any other route.
3. `httpOnly` — inaccessible to JavaScript, including any XSS payload that might otherwise try
   to read and exfiltrate it.

Every other authenticated route uses the `Authorization: Bearer` header exclusively, which is
immune to CSRF by construction — a cross-site `<form>`, `<img>`, or `<script>` tag has no
mechanism to set a custom request header.

## 8. CORS

An explicit origin allowlist from configuration (`CORS_ALLOWED_ORIGINS`,
`backend/src/middleware/security.ts`) — never a wildcard. An origin not on the list gets no
CORS headers at all (verified in `app.test.ts`), which means the browser blocks the response
from being read by that origin's page, even though the request itself still reaches the
server.

## 9. Input validation

Every request body, query param, and route param that reaches a controller is parsed through
a Zod schema before the service layer ever sees it (`*.schemas.ts` next to every
`*.controller.ts`). This is the authoritative validation — the frontend's matching Zod schemas
(`src/schemas/`) are UX, not security, and the backend's rules are kept identical on purpose so
a user is never told "valid" by the client and then rejected by the API.

Specific, non-generic validation exists for domain-shaped input: IPv4/IPv6 via Node's
`net.isIP`, a domain-name regex, `http(s)`-only URL parsing (explicitly rejects `javascript:`
and other schemes), and hex-length-derived hash-algorithm detection for IOC submissions
(`backend/src/threatIntel/ioc.schemas.ts`).

**NoSQL injection**: MongoDB query filters are built from typed, Zod-validated fields as plain
objects — never from unsanitized string concatenation. The one regex-based search path
(free-text search) escapes regex metacharacters before use.

**Request size limits**: JSON bodies are capped at 100KB
(`express.json({ limit: "100kb" })`, `backend/src/app.ts`) — verified in `app.test.ts` by
actually sending a 200KB body and asserting it's rejected, not just checking the middleware
is present.

## 10. SSRF protection

The two places this codebase makes outbound requests based on data connected to user input are
both host-locked:

- `VirusTotalProvider` always requests `https://www.virustotal.com/api/v3/...` — the
  user-supplied indicator value is `encodeURIComponent`-encoded into the URL **path**, never
  used to construct the host or protocol.
- `MlServiceProvider`'s base URL comes only from the admin-configured `ML_SERVICE_URL`
  environment variable, never from any request.

Neither accepts an arbitrary destination from a client. This was specifically re-verified
during the Phase 11 hardening review (`backend/README.md`'s Phase 11 section).

## 11. XSS

The backend never renders HTML — every response is JSON. The frontend (React) escapes all
interpolated content by default; `dangerouslySetInnerHTML` is not used anywhere in the
codebase. Threat-intelligence data (indicator values, notes) is treated as untrusted content
that happens to be *displayed*, not executed — the same escaping applies to it as to any other
user-supplied string.

## 12. File upload security

**Not applicable** — there is no file-upload endpoint anywhere in this application. No
`multer` or similar dependency exists in `backend/package.json`. If a file-upload feature is
added later, it needs its own dedicated security review (type/size validation, storage
isolation, malware scanning) before shipping — nothing here covers that today.

## 13. AI security

See `docs/04-ai-and-threat-intelligence.md` for the full picture. In brief:

- **AI never owns a security decision.** Risk scores are computed by a deterministic formula
  (`backend/src/utils/risk.ts`); AI may only *suggest* (a recommendation, an analysis summary)
  and every suggestion requires a human approval step before anything happens as a result.
- **Structured, validated output** — every AI response is parsed as JSON and checked against a
  Zod schema before anything downstream reads it; a malformed or out-of-schema response throws
  rather than silently passing through.
- **Cost and rate limiting** — a dedicated, stricter rate-limit tier on every `/ai/*` route,
  plus a separate daily-request cap per organization independent of request frequency.

## 14. Prompt injection protection

Every piece of user-controlled data reaching an AI prompt (an incident description, an
analyst's chat message) is wrapped in explicit `<untrusted_data source="...">` markers with a
preamble instructing the model to treat the enclosed text as data to analyze, never as
instructions to follow (`backend/src/ai/promptSafety.ts`). As of Phase 11's hardening review,
the wrapping function also **neutralizes a literal occurrence of the marker sequence itself**
inside the untrusted content — otherwise, content containing the literal text
`</untrusted_data>` could close the labeled block early and make attacker-authored text that
followed look, structurally, like it sat outside the untrusted region. This is tested directly
in `promptSafety.test.ts`.

## 15. Audit logging

Every security-sensitive action across every module writes a real audit entry
(`AuditService.record()`), attributed to the actual authenticated actor — never a
client-supplied name — with the real request ID and IP address captured automatically via
`AsyncLocalStorage` (`backend/src/middleware/requestContext.ts`), not threaded manually through
every function call. The audit log is **read-only by design**: the repository interface has no
update or delete method at all (not merely "unimplemented" — structurally absent, so nothing
built against it could alter or remove a record even by accident), and the API has no write
route — nothing accepts a client-submitted audit entry, ever.

See `docs/03-api.md` for `GET /audit-logs`, and `backend/README.md`'s per-phase sections for
the specific list of actions each module records.

## 16. Security monitoring

Structured JSON logging (Pino) with request correlation IDs on every log line
(`backend/src/utils/logger.ts`, `middleware/requestId.ts`) is the current monitoring surface —
every request, error, and audit-worthy action is logged with enough context to reconstruct
what happened. There is no external log aggregation, alerting, or SIEM integration configured
— see `docs/07-deployment-and-operations.md` for what a production deployment would add on top
of this.

## 17. Threat model

**In scope / actively defended against**: credential stuffing and brute force (rate limiting +
Argon2id), session/token theft and replay (rotation + reuse detection, short-lived access
tokens), cross-tenant data access (organizationId scoping + IDOR-safe lookups), CSRF, SSRF
via the two outbound-request surfaces, prompt injection, NoSQL injection, algorithm-confusion
JWT attacks, and account enumeration.

**Explicitly out of scope for the current build** (see `docs/07-deployment-and-operations.md`
for what each of these would need): DDoS mitigation at the network/infrastructure layer (rate
limiting here defends the *application*, not the network), a live dynamic security scan
(OWASP ZAP or similar — Phase 11's hardening review used real adversarial HTTP-level tests
instead, since no such tool was available in the environment this was built in), and anything
involving a file-upload attack surface (because none exists).

## 18. Vulnerability management

- `npm audit` — run against both the frontend and backend `package-lock.json` as part of the
  Phase 11 hardening pass; zero vulnerabilities found across dependencies and dev-dependencies
  at that time. Re-run periodically — `npm audit` in each of `/` and `backend/`.
- No automated dependency-update tooling (Dependabot or similar) is configured yet — see
  `docs/07-deployment-and-operations.md`.
- The Phase 11 hardening review (`backend/README.md`'s own section) is the most recent
  systematic pass: a two-stage review (vulnerability identification, then independent
  false-positive filtering) across everything built since Phase 5, which found and fixed one
  real issue (§14 above) and confirmed several other categories (SSRF, tenant isolation, CSRF,
  JWT algorithm confusion, NoSQL injection) were already correctly handled.
