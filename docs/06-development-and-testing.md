# Development & Testing

## 1. Development workflow

The project follows strict phased development (see the git history and each phase's summary in
`backend/README.md`) — every increment was built, tested, and verified before the next one
started. The same discipline applies to any new work: land one logical change, run the full
regression (typecheck + lint + test + build), verify it against a running server, then
continue.

Two independent apps, two independent toolchains — always run commands from the right folder
(project root for the frontend, `backend/` for the backend).

## 2. Coding standards

- **TypeScript everywhere**, strict mode, `any` avoided (a rare, unavoidable `any` is commented
  explaining why).
- **Zod for every validation boundary** — form inputs (frontend), request bodies/query params
  (backend), and external API responses (backend) are never trusted without a schema.
- **No duplicated business logic** — shared logic is extracted to a hook/service/util rather
  than copy-pasted; e.g. `severityFromScore` exists in exactly one place per app
  (`src/utils/risk.ts` and `backend/src/utils/risk.ts`), kept in sync by hand and identical
  on purpose.
- **No purple, no decorative gradients, no emoji, no mixed icon libraries** — Font Awesome
  only, one consistent style. Severity is always icon + label + color, never color alone.
- **No client-supplied identity ever trusted** — actor names/IDs for anything security-
  sensitive are always resolved server-side from the authenticated session.

## 3. Folder structure

See `docs/01-architecture.md` §2/§3 for the full frontend/backend folder breakdowns.

## 4. Linting & formatting

```bash
npm run lint         # ESLint — both frontend (root) and backend (backend/)
```

Prettier is a frontend dev-dependency for formatting; there's no separate `format` script —
most editors apply it on save via the Prettier extension using the repo's config.

## 5. Testing — frontend

```bash
npm run typecheck
npm run lint
npm test              # Vitest — unit + component tests (jsdom)
npm run test:watch    # same, in watch mode
npm run test:e2e      # Playwright — real browser, against a real production build
```

**Unit/component tests** (Vitest + React Testing Library) cover hooks, utility functions, and
component behavior (loading/empty/error/success states, keyboard navigation, focus management)
— colocated with the code they test (`Component.test.tsx` next to `Component.tsx`).

**End-to-end tests** (Playwright, `e2e/smoke.spec.ts`) drive a real Chromium browser against
the actual production build (`npm run preview`, started automatically by
`playwright.config.ts`) — landing → login → every major feature area, plus an unauthenticated-
redirect check. This is the only test layer that exercises real routing, real CSS, and real
browser behavior (e.g. cookie handling) rather than a simulated DOM. On a fresh checkout,
install the browser binary once first: `npx playwright install chromium` (there's no
`postinstall` hook that does this automatically).

**Real-backend integration tests** (`src/services/api/*.integration.test.ts`) — the newest and
strongest layer, added in Phase 12. These spawn the actual compiled backend
(`backend/dist/server.js`) as a child process and exercise the real `Api*Service` classes
against it over genuine HTTP — no mocked `fetch`. They skip automatically (not fail) if the
backend hasn't been built yet; run `npm run build` in `backend/` first if you want them to
actually execute.

## 6. Testing — backend

```bash
npm run typecheck
npm run lint
npm test              # Vitest — runs against in-memory repositories, no MongoDB needed
npm run test:mongo    # separate config — needs a real MongoDB reachable via mongodb-memory-server
```

Every domain module's test file (`*.test.ts` next to its `*.service.ts`) is an **HTTP-level
integration test** using `supertest` against a real `createApp()` instance (not a unit test
mocking Express) — real requests, real middleware, real Zod validation, real responses. Every
one of them follows the same pattern:

- unauthenticated request → `401`
- wrong-permission request → `403`
- an IDOR guard — register a second organization, try to access the first org's resource by
  ID, assert `404`
- the actual happy-path behavior, asserted against real response bodies
- edge cases specific to that module (state-machine transitions, validation rejections, ...)

**External-dependency modules** (AI, threat intel, anomaly detection) additionally use fake
structural clients (`fakeClient()` helpers, matching the exact interface the real SDK/HTTP
client satisfies) to test real request/response handling logic — including malformed-response
rejection, timeout/error wrapping, and quota handling — without needing network access or a
real API key. See `docs/04-ai-and-threat-intelligence.md` for which specific network calls
remain genuinely unverified as a result (documented honestly, not hidden).

## 7. Security testing

Covered as part of every module's normal test suite (auth bypass, IDOR, injection, rate-limit
triggering — see §6's pattern above), plus a dedicated Phase 11 hardening pass: a two-stage
adversarial review of the codebase (vulnerability identification, then independent false-
positive filtering) that found and fixed one real issue and re-verified several other
categories were already handled correctly. See `docs/02-security.md` §18 and
`backend/README.md`'s Phase 11 section for the full detail.

## 8. Regression testing

Every change in this project's history was followed by the full regression sequence before
being considered done:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

run in **both** the project root and `backend/`. This is not optional ceremony — it's what
caught every real bug documented in this project's build history before it shipped.

## 9. Debugging approach

- **Backend**: structured JSON logs (Pino) with a request ID on every line — `npm run dev`
  pipes through `pino-pretty` for human-readable local output. Every error response includes a
  `requestId` you can grep the server logs for.
- **Frontend**: React DevTools + TanStack Query DevTools (enabled in development) for
  inspecting cache state; the browser's network tab for inspecting real requests once
  `VITE_API_BASE_URL` is set.
- **"Is it the frontend or the backend?"** — since the two are fully independent, the fastest
  triage is `curl http://localhost:4000/api/v1/health` (confirms the backend is up) and
  checking whether `VITE_API_BASE_URL` is actually set (confirms which service layer is
  active) — see `docs/08-system-requirements-and-local-setup.md` Step 16's note.

## 10. Demo accounts (seeded in both mock and real-backend modes)

All demo accounts share the password `ThreatLens#Demo1`.

| Email | Role | Name |
|---|---|---|
| `avery.chen@northwind.test` | `super_admin` | Avery Chen |
| `priya.n@northwind.test` | `security_admin` | Priya Natarajan |
| `diego.alvarez@northwind.test` | `security_analyst` | Diego Alvarez |
| `morgan.blake@northwind.test` | `security_analyst` | Morgan Blake |
| `sam.whitfield@northwind.test` | `viewer` | Sam Whitfield |

Use these to test role-specific behavior directly — e.g. sign in as `sam.whitfield` (viewer)
to confirm write actions are correctly hidden/blocked.

## 11. Quality gates

A change is not considered done until:

- [ ] `typecheck` passes with zero errors, in both the frontend and backend
- [ ] `lint` passes with zero errors
- [ ] the full test suite passes (no skipped/disabled tests to force a pass)
- [ ] `build` succeeds
- [ ] no console errors/warnings from application code
- [ ] for a backend change: verified against a real running server (not just the test suite) —
  every phase in this project's history included a live `curl` smoke test of new endpoints'
  auth/permission/error behavior
- [ ] documentation (this file included) reflects the actual, current implementation — never
  a claim about a feature that doesn't exist (see `docs/04-ai-and-threat-intelligence.md`'s
  and `docs/05-database.md`'s "honest limitation" notes for the standard this is held to)
