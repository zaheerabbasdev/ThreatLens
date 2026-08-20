# System Requirements & Complete Local Setup

This document assumes you have never run this project before, and never used some of these
tools before. It explains everything, including terminal commands, from scratch.

If you get stuck, re-read the step you're on slowly — most setup problems are a missed step,
not a bug.

## 1. System requirements

### Operating system

Any of the following work equally well:

- Windows 10/11
- macOS (recent versions)
- Linux (any modern distribution)

### Required software

| Software | Minimum | Recommended | Why |
|---|---|---|---|
| [Git](https://git-scm.com/) | 2.x | latest | to download the source code |
| [Node.js](https://nodejs.org/) | 20 LTS | 22 LTS (this project was built and tested on 22.16.0) | runs both the frontend and backend |
| npm | 10.x (ships with Node) | latest | installs dependencies, runs scripts |
| A modern browser | — | Chrome, Edge, or Firefox, current version | to use the app |

### Optional software (only if you want the corresponding feature)

| Software | Needed for | If skipped |
|---|---|---|
| MongoDB (local or [Atlas](https://www.mongodb.com/atlas)) | persistent storage across restarts | the backend runs on in-memory data — same demo dataset, resets when the server restarts |
| An OpenAI API key | the AI assistant / incident analysis / recommendations | those endpoints return a clean "not configured" response instead of an error |
| A VirusTotal API key | IOC enrichment | the enrichment endpoint returns "not configured" instead of an error |
| Python 3.11+ and pip | the anomaly-detection ML service | anomaly analysis returns "not configured" |

**Nothing in this list is required to run and explore the full application.** Every optional
piece degrades to a clearly-labeled "not configured" response rather than an error — see
`docs/02-security.md` and `docs/04-ai-and-threat-intelligence.md` for why that's a deliberate
design choice, not a shortcut.

There is no Redis, no Docker, and no GPU requirement for anything in this project as it
stands today — see `docs/07-deployment-and-operations.md` for what's intentionally not built
yet.

## 2. Hardware requirements

### Minimum

- 4 GB RAM
- Any dual-core CPU from the last ~8 years
- 2 GB free disk space (mostly `node_modules`)
- An internet connection (only needed for the one-time `npm install`, and for the optional AI/
  threat-intel providers if you configure them)

### Recommended

- 8 GB+ RAM (comfortable for running both dev servers, a browser, and an editor at once)
- Any CPU from the last ~5 years
- 4 GB+ free disk space

No local AI/ML model runs on your machine — the AI features call OpenAI's API (if configured),
and the anomaly-detection model is a small scikit-learn model running in a separate,
lightweight Python process, not a large local model. **No GPU is required or used anywhere in
this project.**

## 3. Step-by-step local installation

Every step below has the actual command to run. Run each one from a terminal (Command Prompt,
PowerShell, or a Unix shell — all work).

### Step 1 — Install Git

Download and install from [git-scm.com](https://git-scm.com/downloads). Accept the defaults
during installation.

### Step 2 — Install Node.js

Download the **LTS** version from [nodejs.org](https://nodejs.org/) and run the installer,
accepting the defaults. This also installs npm.

### Step 3 — Verify Node.js

```bash
node --version
```

You should see `v20.x.x` or higher.

### Step 4 — Verify npm

```bash
npm --version
```

You should see `10.x.x` or higher.

### Step 5 — Clone the repository

```bash
git clone https://github.com/zaheerabbasdev/ThreatLens.git
```

(If you already have the code as a folder rather than a fresh clone, skip this step.)

### Step 6 — Open the project folder

```bash
cd ThreatLens
```

The project has two independent Node.js applications in this one folder: the frontend (in the
folder root) and the backend (in `backend/`). You'll set each one up separately.

### Step 7 — Install dependencies

Install the frontend's dependencies:

```bash
npm install
```

Then install the backend's dependencies:

```bash
cd backend
npm install
cd ..
```

Each of these downloads everything listed in that folder's `package.json` into a
`node_modules` folder. This can take a few minutes the first time.

### Step 8 — Create environment files

Both the frontend and backend read configuration from environment files that are never
committed to the repository (they're listed in `.gitignore`) — you create your own local copy
from the provided example.

**Backend** (required — the backend refuses to start without this):

```bash
cd backend
cp .env.example .env
cd ..
```

Open `backend/.env` in a text editor and fill in the two required secrets:

```
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
```

Generate a random value for each with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Run that command twice (once per secret) and paste each result in. Everything else in
`backend/.env.example` is optional — leave it as-is (commented out) for now.

**Frontend** (optional — only needed if you want to use the real backend instead of the
built-in mock data; see Step 9):

```bash
cp .env.example .env.local
```

### Step 9 — Configure MongoDB (optional)

If you don't have MongoDB and don't want to install it, **skip this step entirely.** The
backend runs perfectly well on in-memory data with the same seeded demo accounts and records
— it just doesn't persist across a restart.

If you do want persistence: install MongoDB locally, or create a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster, then add its connection string to
`backend/.env`:

```
MONGODB_URI=mongodb://localhost:27017/threatlens
```

or the `mongodb+srv://...` string Atlas gives you.

> **Known limitation**: the MongoDB-backed code path was written and reviewed but could not be
> exercised against a real MongoDB instance in the environment this project was built in (see
> `docs/05-database.md`). Run `npm run test:mongo` in `backend/` once against a real MongoDB
> before relying on this path in production.

### Step 10 — Configure Redis

Not applicable — this project doesn't use Redis yet. Skip this step. (See
`docs/07-deployment-and-operations.md` for why it's listed in the tech stack but not built.)

### Step 11 — Configure an AI provider (optional)

If you don't have an OpenAI API key, **skip this step.** The AI assistant, incident analysis,
and recommendation endpoints will respond with a clear "not configured" message instead of an
error — nothing else in the app depends on this.

If you do have one, add it to `backend/.env`:

```
OPENAI_API_KEY=sk-...
```

### Step 12 — Configure threat intelligence providers (optional)

If you don't have a VirusTotal API key, **skip this step.** IOC enrichment will respond with
"not configured" instead of an error.

If you do have one:

```
VIRUSTOTAL_API_KEY=...
```

### Step 13 — Run database initialization / seed

Nothing to do here — the backend seeds its demo organization, users, incidents, alerts,
indicators, and reference data (MITRE techniques, threat actors) automatically every time it
starts, whether it's running on in-memory storage or MongoDB. There is no separate seed
command to run.

### Step 14 — Run the backend

From the `backend/` folder:

```bash
cd backend
npm run dev
```

You should see log output ending in something like:

```
INFO: ThreatLens backend listening
    port: 4000
```

Leave this terminal window running. Open a **new** terminal for the next step.

### Step 15 — Run the frontend

From the project root (a new terminal window):

```bash
npm run dev
```

You should see:

```
VITE ready
➜  Local:   http://localhost:5173/
```

Leave this running too.

### Step 16 — Open the application

Open your browser to:

```
http://localhost:5173
```

You should see the ThreatLens landing page.

**Important**: by default, the frontend runs on its own built-in mock data and does **not**
talk to the backend you started in Step 14 — that's intentional (see `docs/01-architecture.md`
for why). To make the frontend use the real backend instead, set `VITE_API_BASE_URL` in
`.env.local` (Step 8) to `http://localhost:4000/api/v1` and restart the frontend dev server
(Step 15).

### Step 17 — Create your first account

Whether you're on mock data or the real backend, you can either:

- **Sign in with a seeded demo account** — go to `/login` and use any of the demo emails
  (see `docs/06-development-and-testing.md` for the full list) with the password
  `ThreatLens#Demo1`, or
- **Register a new account** — go to `/register` and fill in your name, organization,
  email, and a password (minimum 12 characters, with an uppercase letter, lowercase letter,
  number, and symbol).

### Step 18 — Verify the system works

A quick checklist to confirm everything is running correctly:

1. You can log in and land on `/app/dashboard`.
2. The sidebar navigation works — click through Incidents, Alerts, Threat Intel, MITRE ATT&CK,
   Threat Graph, Investigations, Reports, Users, Audit Logs, Settings.
3. Signing out returns you to the login page, and visiting `/app/dashboard` directly while
   signed out redirects you back to `/login`.
4. If you're running against the real backend (Step 16's note): open your browser's network
   tab and confirm requests are going to `http://localhost:4000/api/v1/...`, not resolving
   instantly from in-memory mock data.

If any of these fail, check both terminal windows (Step 14 and Step 15) for error output —
the error message usually names the missing piece directly (e.g. "JWT_ACCESS_SECRET must be
at least 32 characters" means Step 8 wasn't completed correctly).

## 4. Running the test suites (optional, but recommended)

```bash
# Frontend
npm run typecheck
npm run lint
npm test

# Backend
cd backend
npm run typecheck
npm run lint
npm test
```

See `docs/06-development-and-testing.md` for the full testing story, including how to run the
end-to-end (Playwright) suite and the real-backend integration tests.

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend exits immediately with "Invalid environment configuration" | `backend/.env` is missing or a required secret is too short | Redo Step 8 |
| `npm install` fails partway through | Slow or unstable network | Re-run `npm install` — npm resumes rather than starting over |
| Frontend loads but shows no real data changes when you submit forms | You're on mock mode (the default) | See Step 16's note to point it at the real backend |
| `EADDRINUSE` error when starting the backend | Another process is already using port 4000 | Set `PORT=4001` (or any free port) in `backend/.env`, or stop the other process |
| AI assistant / IOC enrichment / anomaly detection always say "not configured" | Expected if you skipped Steps 11/12, or skipped the Python ML service setup | This is the intended, honest behavior — see `docs/04-ai-and-threat-intelligence.md` |
