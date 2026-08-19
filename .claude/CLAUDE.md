# ThreatLens — Working Rules for Claude Code

ThreatLens is an AI-assisted Cyber Threat Intelligence & Response Platform for small/medium
orgs without a full SOC. Full specs live in `ThreatLens/01-MASTER-BUILD-PROMPT.md`,
`02-UIUX-QUALITY-RESPONSIVENESS-INTERACTION-RULES.md`,
`03-BACKEND-DATABASE-SECURITY-DEVSECOPS-RULES.md`, and
`04-PROJECT-ASSETS-SVG-DOCUMENTATION-RULES.md` (~9,100 lines total). This file is a
condensed, load-every-session summary — read the originals before making a judgment call
that isn't covered here.

## Product lifecycle

`DETECT → ENRICH → CORRELATE → ANALYZE → EXPLAIN → PRIORITIZE → RESPOND → AUDIT`

AI assists analysts; it never controls security decisions. Critical actions require
deterministic backend validation and, where appropriate, human approval. Risk scores are
computed deterministically — AI may *explain* a score, it never *owns* the score.

## Phase discipline — the #1 rule

Build in strict gated phases; never jump ahead silently:

`Phase 0` repo inspection → `1` frontend → `2` frontend QA/hardening → `3` backend/API →
`4` backend QA → `5` database → `6` AI/RAG → `7` threat intel → `8` anomaly detection →
`9` threat graph/correlation → `10` response workflows → `11` hardening → `12` integration →
`13` final QA/docs.

**We are in Phase 1 (frontend only).** Do NOT implement MongoDB, Express, real backend APIs,
real AI/OpenAI calls, Python/ML, Redis/BullMQ, or real threat-intel integrations until the
frontend quality gate (below) passes and the user explicitly signs off moving to Phase 2+.
Use realistic mock data/services behind service interfaces instead. Build incrementally —
never generate huge uncontrolled batches of files in one shot; land one logical unit, verify
it, then continue.

## Tech stack

**Frontend:** React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod,
Anime.js, Font Awesome (icons — never emoji, never mixed icon libraries), self-hosted Google
Fonts (`@fontsource`), Recharts, React Flow (threat graph).
**Backend (later phase):** Node.js, TypeScript, Express, MongoDB/Atlas + Vector Search,
Redis, BullMQ, OpenAI API behind an internal `AIProvider` abstraction.
**ML (later phase):** Python, FastAPI, scikit-learn (start with Isolation Forest, not a
neural net).

## Frontend architecture

```
src/{components,layouts,pages,routes,services,services/mock,api,mocks,hooks,utils,
     types,schemas,animations,constants,assets,styles}
```

UI → application logic → services → mock data. Never scatter mock data inside components.
Mock service interfaces (`AuthService`, `ThreatService`, `IncidentService`, `AlertService`,
`IOCService`, `UserService`, `AIService`, `ReportService`, `AuditService`) must be swappable
for real `Api*Service` implementations later without UI rewrites. TanStack Query hooks wrap
services; components depend on hooks, never on mock arrays directly.

## Design rules (non-negotiable)

- **No purple, anywhere.** No decorative gradients. No emoji, no random Unicode icons, no
  mixed icon libraries — Font Awesome only, one consistent style/weight.
- Severity (critical/high/medium/low/info) must always be **icon + label + color**, never
  color alone.
- Dark, professional, restrained aesthetic — trust/precision/clarity, not a generic SaaS
  template. Subtle Anime.js animation only (entrances, counters, state changes); respect
  `prefers-reduced-motion`.
- Every meaningful component supports loading / empty / error / success / disabled /
  unauthorized / no-results states. Never a blank screen. Never leave a route as a dead or
  visibly "TODO" placeholder — unbuilt sections get one shared, intentional
  "scheduled for a later phase" empty state, not a broken page.
- Responsive intentionally (large desktop → mobile), not desktop-shrunk. No horizontal
  overflow, no clipped/overlapping content, no unusable tables on mobile.
- WCAG-minded: semantic HTML, keyboard nav, visible focus, ARIA, accessible dialogs/forms.

## RBAC

Roles: `super_admin`, `security_admin`, `security_analyst`, `viewer`. Frontend visually
respects permissions but this is **not real security** — backend authorization is a later
phase and must not be assumed to exist yet.

## Code quality

Strong TypeScript types for all domain entities (User, Incident, Alert, Indicator + IP/
Domain/URL/Hash subtypes, ThreatActor, ThreatTechnique, AuditLog, RiskScore, AIAnalysis,
Recommendation, SecurityEvent, Investigation, Report). Avoid `any` — if unavoidable, comment
why. Validate with Zod (forms, filters, mock API responses). Centralized error handling +
Error Boundaries; never show raw stack traces to users. No giant components/files, no
duplicated logic — extract to hooks/services/utils.

## Testing (mandatory, not optional)

Vitest + React Testing Library for unit/component; Playwright for E2E. Never disable a test
or delete it to make CI pass, never suppress warnings/lint without understanding them, never
fake a passing state. Fix the underlying problem.

## Frontend quality gate (must pass before starting backend work)

Build succeeds; TypeScript has zero errors; lint passes; unit + E2E tests pass; no console
errors/warnings from app code; no broken routes/links/buttons; no dead interactions; no
inaccessible dialogs; no horizontal overflow or other obvious responsive issues; no
duplicated UI logic; no placeholder UI accidentally left exposed; all loading/empty/error
states work; all mocked workflows work end to end.

## Security posture even in frontend-only phase

No `dangerouslySetInnerHTML` without real need, no unsanitized HTML injection, no secrets or
fake API keys in the bundle, don't trust URL params, no eval-like code. Treat mock "external"
data as untrusted and validate it.

## Working style

Small logical commits with conventional messages (`feat:`, `fix:`, `test:`, `security:`) —
but only commit when the user asks. At the end of a phase/increment, report what was built,
what was tested, pass/fail results, known issues, and the proposed next step — don't
silently barrel into the next phase. Stop and ask the user if requirements conflict, a
security decision has real consequences, or the right behavior is genuinely ambiguous.
