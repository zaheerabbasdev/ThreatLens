# API Reference

## Base URL

```
http://localhost:4000/api/v1        (local development)
```

All routes are versioned under `/api/v1`. There is no OpenAPI/Swagger document generated yet
— this file is the authoritative reference. `GET /api/v1/health` is unauthenticated and
returns `{"data": {"status": "ok", "uptimeSeconds": <number>}}` — use it to confirm the server
is up.

## Authentication

Every route except `/auth/*`'s public endpoints and `/health` requires:

```
Authorization: Bearer <accessToken>
```

Get an `accessToken` from `POST /auth/login`, `POST /auth/register`, or `POST /auth/refresh`
(see below). Access tokens expire after 15 minutes; call `POST /auth/refresh` (the browser
sends the required cookie automatically) to get a new one. Full detail in
`docs/02-security.md`.

## Response envelope

**Success:**
```json
{ "data": { /* ... */ }, "meta": { "total": 42, "page": 1, "pageSize": 20 } }
```
`meta` is present only on paginated list endpoints.

**Error:**
```json
{ "error": { "code": "NOT_FOUND", "message": "The requested resource was not found.", "requestId": "..." } }
```

## Standard errors

| Status | `code` | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed request that isn't a validation failure (e.g. a rejected token) |
| 401 | `UNAUTHORIZED` | Missing, invalid, or expired access token |
| 403 | `FORBIDDEN` | Authenticated, but the caller's role lacks the required permission |
| 404 | `NOT_FOUND` | Resource doesn't exist, **or** exists in a different organization (see `docs/02-security.md` §4 — these are indistinguishable on purpose) |
| 409 | `CONFLICT` | The request is well-formed but conflicts with the resource's current state (e.g. executing an already-executed response action) |
| 422 | `VALIDATION_ERROR` | Zod schema validation failed — `details` carries the field-level errors |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded for this route's tier |
| 503 | `SERVICE_UNAVAILABLE` | A required external provider (AI, threat intel, ML) isn't configured for this deployment |

Every error response body is safe to show a user — no stack traces, database errors, or
internal paths are ever included (unexpected/unhandled errors are logged in full server-side
and returned to the client as a generic 500).

## Pagination & filtering

Every list endpoint accepts:

| Param | Default | Notes |
|---|---|---|
| `page` | `1` | 1-indexed |
| `pageSize` | `20` | capped at `100` |
| `search` | — | free-text, matches vary by endpoint |

Plus endpoint-specific filters (documented per-endpoint below). Response `meta` always
includes `{total, page, pageSize}`.

## Rate limiting

| Tier | Limit | Applies to |
|---|---|---|
| Baseline | 120 req/min | every route under `/api/v1`, applied globally in `app.ts` — including unauthenticated ones like `/health` |
| Auth | 10 req/15min | `/auth/register`, `/auth/login`, `/auth/refresh` (stacked on top of the baseline tier above) |
| Sensitive action | 5 req/hour | `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/change-password` (also stacked on the baseline) |
| AI | 15 req/min | every `/ai/*` route (also stacked on the baseline) |
| Enrichment | 15 req/min | `POST /ioc/:id/enrich` (also stacked on the baseline) |
| Anomaly | 15 req/min | `POST /security-events/analyze/:userId` (also stacked on the baseline) |

All limiters are per-IP. A `429` includes `code: "TOO_MANY_REQUESTS"`. A separate, stricter
"public" tier (`createPublicRateLimit`, 30 req/min) exists in
`backend/src/middleware/rateLimit.ts` but isn't currently wired to any route — the baseline
tier above is what actually protects unauthenticated endpoints today.

---

## `/auth`

| Method | Path | Auth | Permission | Body |
|---|---|:---:|---|---|
| POST | `/auth/register` | — | — | `{name, organization, email, password}` |
| POST | `/auth/login` | — | — | `{email, password}` |
| POST | `/auth/refresh` | cookie | — | — |
| POST | `/auth/logout` | cookie | — | — |
| GET | `/auth/me` | ✓ | — | — |
| POST | `/auth/forgot-password` | — | — | `{email}` |
| POST | `/auth/reset-password` | — | — | `{token, password}` |
| POST | `/auth/verify-email` | — | — | `{token}` |
| POST | `/auth/change-password` | ✓ | — | `{currentPassword, newPassword}` |

`register`/`login`/`refresh` responses: `{data: {user, accessToken, devVerificationToken?}}`
(`devVerificationToken` only appears outside production, when there's no real email service to
deliver the token through). Password requirements: 12+ characters, upper+lower+number+symbol.

**Example:**
```
POST /api/v1/auth/login
{"email": "avery.chen@northwind.test", "password": "ThreatLens#Demo1"}

→ 200
{"data": {"user": {"id": "user_1", "name": "Avery Chen", "role": "super_admin", ...}, "accessToken": "eyJ..."}}
```

## `/incidents`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/incidents` | `incidents:read` | filters: `severity`, `status`, `search` |
| GET | `/incidents/summary` | `incidents:read` | `{total, open, bySeverity}` |
| GET | `/incidents/:id` | `incidents:read` | |
| PATCH | `/incidents/:id/status` | `incidents:write` | `{status}` |
| PATCH | `/incidents/:id/assign` | `incidents:assign` | `{analystId: string \| null}` — validated against the caller's own org |
| POST | `/incidents/:id/notes` | `incidents:write` | `{content}` — author always resolved server-side |

## `/alerts`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/alerts` | `alerts:read` | filters: `severity`, `status`, `search` |
| GET | `/alerts/summary` | `alerts:read` | `{total, unresolved, bySeverity}` |
| GET | `/alerts/:id` | `alerts:read` | |
| PATCH | `/alerts/:id/status` | `alerts:write` | `{status}` |

## `/ioc` (Threat Intelligence)

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/ioc` | `ioc:read` | filters: `type`, `severity`, `search` |
| POST | `/ioc` | `ioc:submit` | `{type: "ip"\|"domain"\|"url"\|"hash", value, notes?}` — type-specific format validation |
| GET | `/ioc/:id` | `ioc:read` | |
| POST | `/ioc/:id/enrich` | `ioc:enrich` | `?force=true` bypasses the 24h staleness cache; `503` if no provider configured |

Enrichment queries every configured `ThreatIntelProvider` (VirusTotal today), appends each
result to the indicator's `sources[]`, and recomputes `riskScore`/`severity` via a
conservative max-of-all-sources formula. See `docs/04-ai-and-threat-intelligence.md`.

## `/threat-graph`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/threat-graph` | `threat_graph:read` | Assembled graph: `{nodes, edges}` |
| GET | `/threat-graph/correlations/:indicatorId` | `threat_graph:read` | Deterministic evidence-based correlation candidates for one indicator |

## `/mitre`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/mitre/tactics` | `threat_graph:read` | |
| GET | `/mitre/techniques` | `threat_graph:read` | filters: `tacticId`, `search` |
| GET | `/mitre/techniques/:id` | `threat_graph:read` | |

## `/investigations`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/investigations` | `investigations:read` | filters: `status`, `search` |
| POST | `/investigations` | `investigations:write` | `{title, description, leadAnalystId}` |
| GET | `/investigations/:id` | `investigations:read` | |
| PATCH | `/investigations/:id/status` | `investigations:write` | `{status}` |
| POST | `/investigations/:id/notes` | `investigations:write` | `{content, isFinding}` |
| POST/DELETE | `/investigations/:id/incidents` / `/incidents/:incidentId` | `investigations:write` | link/unlink |
| POST/DELETE | `/investigations/:id/indicators` / `/indicators/:indicatorId` | `investigations:write` | link/unlink |

## `/security-events` (Anomaly Detection)

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/security-events` | `anomaly:read` | |
| POST | `/security-events` | `anomaly:detect` | ingest one raw behavioral event |
| POST | `/security-events/analyze/:userId` | `anomaly:detect` | `?windowHours=24` (default); `503` if `ML_SERVICE_URL` unset |

## `/response-actions`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/response-actions?incidentId=...` | `incidents:read` | |
| POST | `/response-actions` | `response:request` | `{incidentId, type, target, description}` — creates `pending_execution` |
| POST | `/response-actions/:id/execute` | `response:execute` | `409` if not `pending_execution` |
| POST | `/response-actions/:id/reject` | `response:execute` | `409` if not `pending_execution` |
| POST | `/response-actions/apply-recommendation/:recommendationId` | `response:execute` | `409` unless the recommendation is `status: "approved"` |

`type` is one of `block_ip`, `block_domain`, `isolate_host`, `disable_user_account`,
`force_password_reset`, `quarantine_file`. Execution is always simulated today
(`isSimulated: true` in the response) — see `docs/04-ai-and-threat-intelligence.md`.

## `/ai`

| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/ai/assistant` | ✓ (any role) | `{message, incidentId?}` — `503` if `OPENAI_API_KEY` unset |
| GET | `/ai/incidents/:incidentId/analysis` | `incidents:read` | get-or-generate; `?regenerate=true` forces a fresh call |
| GET/POST | `/ai/incidents/:incidentId/recommendations` | `incidents:read` / `incidents:write` | list / generate |
| POST | `/ai/recommendations/:id/review` | `recommendations:approve` | `{status: "approved"\|"rejected"}` |

## `/users` + `/organization`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/users` | `users:read` | filters: `role`, `status`, `search` |
| GET | `/users/:id` | `users:read` | |
| PATCH | `/users/:id/profile` | self, or `users:manage` | `{name, title?}` |
| PATCH | `/users/:id/mfa` | self, or `users:manage` | `{enabled}` |
| PATCH | `/users/:id/role` | `users:manage` | `{role}` — never on your own account |
| PATCH | `/users/:id/status` | `users:manage` | `{status}` — never on your own account |
| GET | `/organization` | `settings:read` | |
| PATCH | `/organization` | `settings:manage` | `{name}` |

## `/reports`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/reports` | `reports:read` | filter: `type` |
| POST | `/reports` | `reports:generate` | `{type, title, periodStart, periodEnd}` |
| GET | `/reports/:id` | `reports:read` | |

`type` is one of `security_summary`, `incident_report`, `threat_intelligence`, `risk_report`,
`activity_report`.

## `/audit-logs`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/audit-logs` | `audit:read` | filters: `action`, `result`, `search` |

**Read-only by design** — there is no write route. See `docs/02-security.md` §15.
