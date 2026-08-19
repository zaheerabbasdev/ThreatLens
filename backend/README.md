# ThreatLens Backend

Node.js + Express + TypeScript API for ThreatLens. Phase 3 (Backend architecture and API)
of the build — see `../.claude/CLAUDE.md` and `../ThreatLens/03-BACKEND-DATABASE-SECURITY-DEVSECOPS-RULES.md`
for the full rules this follows.

## Status

This is the Phase 3 infrastructure scaffold: Express app, security middleware, centralized
error handling, structured logging, request correlation IDs, tiered rate limiting, and a
health check — all real and tested, none of it a placeholder.

**Not yet built** (later increments of this same phase, or later phases entirely — nothing
below is silently faked):

- Auth (registration, login, sessions, RBAC middleware) — next increment
- Domain routes (incidents, alerts, users, ...) — after auth
- A real database — Phase 5. Until then, any repository layer added in this phase uses
  in-memory data, clearly marked as such.
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
