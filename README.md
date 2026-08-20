# ThreatLens

An AI-assisted Cyber Threat Intelligence & Response platform for small and medium
organizations that don't have the budget or headcount for a full Security Operations Center.

## The problem

A small security team (or a single IT lead wearing a security hat) is expected to detect,
triage, investigate, and respond to threats with the same rigor a large SOC has — but without
the tooling, the analyst headcount, or the 24/7 coverage. Alerts pile up faster than anyone can
review them, threat intelligence lives in a dozen disconnected tabs, and there's no single
place that shows "here's what's happening, here's how bad it is, and here's what to do about
it."

## What ThreatLens does

ThreatLens gives that team one workspace covering the full security lifecycle:

```
DETECT → ENRICH → CORRELATE → ANALYZE → EXPLAIN → PRIORITIZE → RESPOND → AUDIT
```

- **Incident & alert management** — a real triage workspace, not a spreadsheet: severity,
  status, assignment, notes, and a full timeline per incident.
- **Threat intelligence** — submit and track indicators (IPs, domains, URLs, file hashes),
  enrich them against real external providers, and see every source's own confidence and
  disagreement, never a single fabricated "truth."
- **Threat graph & correlation** — a visual map of how indicators, incidents, users, MITRE
  ATT&CK techniques, and threat actors connect, built from real, deterministic evidence.
- **AI assistant & analysis** — ask questions about an incident, get an AI-drafted summary and
  remediation recommendations — always clearly labeled as AI-generated, always requiring human
  review before anything happens as a result.
- **Anomaly detection** — explainable, ML-based behavioral scoring (not a black box) flags
  unusual login/access patterns.
- **Response workflows** — request, approve, and track containment actions with a full audit
  trail and a deliberate human-approval gate before anything executes.
- **Full audit logging** — every security-sensitive action, attributed to a real actor,
  permanently recorded, never editable.

## Architecture overview

Two independent applications: a React single-page frontend and a Node.js/Express REST API,
connected by a swappable service layer — the frontend can run entirely on its own built-in
mock data with zero backend, or against the real backend once configured. See
[`docs/01-architecture.md`](docs/01-architecture.md) for the full picture, including data-flow
and authentication-flow diagrams.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Recharts, React Flow, Anime.js |
| Backend | Node.js, TypeScript, Express, Mongoose (MongoDB), JWT (`jose`), Argon2id, Zod |
| AI | OpenAI (behind an internal provider abstraction — swappable) |
| Threat Intelligence | VirusTotal (behind the same style of provider abstraction) |
| ML | Python, FastAPI, scikit-learn (Isolation Forest) |
| Testing | Vitest, React Testing Library, Playwright, Supertest |

## Security approach

Deterministic backend authorization on every request (frontend checks are UX only), strict
tenant isolation, Argon2id password hashing, rotating JWTs with reuse detection, and a
"trust nothing external" posture applied consistently to user input, AI output, and
third-party API responses alike. Full detail — and how each control is actually implemented,
not just claimed — in [`docs/02-security.md`](docs/02-security.md).

## AI capabilities

An AI assistant, incident analysis, and remediation recommendations, all behind a single
provider abstraction with structured-output validation, prompt-injection defense, and a
mandatory human-approval step before any recommendation becomes a real action. **AI never
computes a risk score or executes a decision** — see
[`docs/04-ai-and-threat-intelligence.md`](docs/04-ai-and-threat-intelligence.md) for exactly
where the deterministic/AI boundary sits, and what's honestly not built yet (RAG/vector
search).

## Threat intelligence

IOC submission and enrichment against real external providers (VirusTotal today, with an
architecture that supports adding more without touching calling code), deterministic risk
scoring, and evidence-based correlation — never a fabricated relationship. Same document as
above has the full detail.

## Installation summary

```bash
git clone https://github.com/zaheerabbasdev/ThreatLens.git
cd ThreatLens

npm install && cd backend && npm install && cd ..
cd backend && cp .env.example .env   # then fill in JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
npm run dev                           # backend, http://localhost:4000
```
```bash
# in a second terminal, from the project root
npm run dev                           # frontend, http://localhost:5173
```

Sign in with any seeded demo account (see below) or register a new one. **The full,
beginner-friendly walkthrough — including how to configure every optional integration — is
[`docs/08-system-requirements-and-local-setup.md`](docs/08-system-requirements-and-local-setup.md).**

Demo accounts (password `ThreatLens#Demo1` for all): `avery.chen@northwind.test`
(super_admin), `priya.n@northwind.test` (security_admin),
`diego.alvarez@northwind.test` (security_analyst), `sam.whitfield@northwind.test` (viewer).

## Documentation

| Document | Covers |
|---|---|
| [`docs/01-architecture.md`](docs/01-architecture.md) | System, frontend, backend, AI, threat-intel, ML architecture; data/auth/authz flow |
| [`docs/02-security.md`](docs/02-security.md) | Every security control, explained, not just claimed |
| [`docs/03-api.md`](docs/03-api.md) | Every endpoint, method, permission, request/response shape |
| [`docs/04-ai-and-threat-intelligence.md`](docs/04-ai-and-threat-intelligence.md) | AI provider, prompts, validation, IOC enrichment, correlation, risk scoring, limitations |
| [`docs/05-database.md`](docs/05-database.md) | MongoDB collections, schemas, indexes, tenant isolation, data classification |
| [`docs/06-development-and-testing.md`](docs/06-development-and-testing.md) | Workflow, standards, every test layer, quality gates |
| [`docs/07-deployment-and-operations.md`](docs/07-deployment-and-operations.md) | Env vars, deployment, monitoring, scaling, maintenance |
| [`docs/08-system-requirements-and-local-setup.md`](docs/08-system-requirements-and-local-setup.md) | Complete local setup, written for someone who's never run this project before |

`backend/README.md` also has a detailed, phase-by-phase build log (what was built, what was
tested, what's honestly still a placeholder) if you want the full history rather than the
current-state summary in the documents above. `ml-service/README.md` has the same for the
Python anomaly-detection service.

## Testing

```bash
# Frontend
npm run typecheck && npm run lint && npm test && npm run test:e2e

# Backend
cd backend
npm run typecheck && npm run lint && npm test
```

Full detail on every test layer — unit, component, end-to-end, and the real-backend
integration tests added in Phase 12 — is in
[`docs/06-development-and-testing.md`](docs/06-development-and-testing.md).

## Deployment overview

The frontend builds to static files (`npm run build`) deployable to any static host/CDN; the
backend is a standard Node.js process deployable anywhere Node runs. No Docker/CI pipeline
exists yet. Full detail in
[`docs/07-deployment-and-operations.md`](docs/07-deployment-and-operations.md).

## Limitations

Documented honestly, not hidden — the short version:

- **RAG/vector search** — not built; every AI prompt uses explicitly-selected context, not a
  document-store lookup.
- **Redis/BullMQ, background job queues, real-time (WebSocket/SSE) updates** — not built;
  everything currently runs synchronously in the request/response cycle.
- **The anomaly-detection ML model** trains on a synthetic behavioral baseline, not real
  historical org data (there isn't any yet).
- **Response-workflow "execution" is simulated** — there's no real EDR/firewall/IAM
  integration behind it yet; every execution is clearly labeled `isSimulated: true`.
- **The MongoDB-backed repository path** was built and unit-tested but has not been exercised
  against a real MongoDB instance in this project's own development environment — run
  `npm run test:mongo` in `backend/` before trusting it in production.

See each linked document above for the full, current list — they're kept accurate as the
project evolves, this summary might not always be.

## License

Not yet chosen. Add a `LICENSE` file before distributing this project publicly or relying on
it having one.
