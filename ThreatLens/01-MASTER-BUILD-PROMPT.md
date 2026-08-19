# MASTER BUILD PROMPT

## AI-Powered Cyber Threat Intelligence & Response Platform

You are the **Lead Software Architect, Senior Full-Stack Engineer, AI Engineer, Cybersecurity Engineer, UI/UX Engineer, QA Engineer, and DevSecOps Engineer** responsible for building this project from the ground up.

You are not simply writing code.

You are responsible for producing a **production-quality, secure, maintainable, testable, responsive, professional cybersecurity platform**.

The project must be built carefully in controlled phases.

----

# Modular Master Prompt Structure

This project uses a modular master-prompt architecture. **This file is the primary orchestration document** and must be treated as the source of truth for the overall development workflow. Before implementing or modifying any part of the project, inspect and follow the relevant specialized rule files: `01-MASTER-BUILD-PROMPT.md` for the overall build strategy and execution workflow, `02-UIUX-QUALITY-RESPONSIVENESS-INTERACTION-RULES.md` for all frontend/UI/UX requirements, responsiveness, accessibility, animations and interactions, `03-BACKEND-DATABASE-SECURITY-DEVSECOPS-RULES.md` for backend architecture, database, authentication, authorization, AI security, cybersecurity, testing and DevSecOps, and `04-PROJECT-ASSETS-SVG-DOCUMENTATION-RULES.md` for images, SVGs, branding, favicon, assets and documentation requirements. **Do not treat these files as optional documentation; they are mandatory engineering rules. When a requirement in a specialized file applies to the current task, it must be followed.** Before declaring any phase complete, verify the implementation against all applicable rules and quality gates defined across these files.

---

# 1. PROJECT VISION

Build a modern AI-assisted Cyber Threat Intelligence & Response Platform designed primarily for small and medium-sized organizations that do not have the resources for a full Security Operations Center (SOC).

The platform should help users:

- collect security events

- submit and investigate Indicators of Compromise (IOCs)

- analyze IP addresses

- analyze domains

- analyze URLs

- analyze file hashes

- correlate related threats

- identify suspicious behavior

- detect anomalies

- map activity to MITRE ATT&CK techniques

- calculate security risk

- generate AI-assisted explanations

- investigate incidents

- prioritize alerts

- maintain an audit trail

- receive recommended response actions

- visualize relationships between threats

- understand why an event is dangerous

The platform should ultimately follow this lifecycle:

DETECT  
→ ENRICH  
→ CORRELATE  
→ ANALYZE  
→ EXPLAIN  
→ PRIORITIZE  
→ RESPOND  
→ AUDIT

The AI must assist security analysts.

AI must NOT blindly control security decisions.

Critical actions must require deterministic backend validation and, where appropriate, explicit human approval.

---

# 2. CORE PRODUCT PRINCIPLE

Do NOT build:

"another MERN dashboard with an AI chatbot."

Build:

"an AI-assisted Security Operations and Threat Intelligence platform."

The application should feel like a real security product used by security analysts.

The interface should communicate:

- trust

- precision

- security

- intelligence

- clarity

- professionalism

- controlled power

Avoid gimmicks.

Avoid excessive animations.

Avoid unnecessary gradients.

Avoid visual noise.

Avoid generic SaaS templates.

---

# 3. TECHNOLOGY STACK

The intended stack is:

## Frontend

- React

- TypeScript

- Vite

- React Router

- TanStack Query

- React Hook Form

- Zod

- Anime.js

- Font Awesome

- Google Fonts

- Recharts

- React Flow or Cytoscape.js where appropriate

## Backend

Later phase:

- Node.js

- TypeScript

- Express

## Database

Later phase:

- MongoDB

- MongoDB Atlas

- MongoDB Atlas Vector Search

## Cache / Queues

Later phase:

- Redis

- BullMQ

## AI

Later phase:

- OpenAI API

- Embeddings

- RAG architecture

The AI provider must be abstracted behind an internal service interface so that the provider can be replaced later.

## Machine Learning

Later phase:

- Python

- FastAPI

- NumPy

- pandas

- scikit-learn

## Security

Use appropriate security tooling such as:

- Helmet

- secure authentication architecture

- Argon2id

- rate limiting

- Zod validation

- secure cookies/tokens where appropriate

- CSP

- CORS

- audit logging

- dependency auditing

- OWASP-oriented testing

- Semgrep

- OWASP ZAP

- GitHub Dependabot or equivalent

## Deployment

Keep deployment architecture flexible.

Docker should eventually be supported.

---

# 4. IMPORTANT DEVELOPMENT STRATEGY

DO NOT build the entire system at once.

The project must be built using strict development gates.

The phases are:

PHASE 0  
Project analysis and architecture

PHASE 1  
Complete frontend

PHASE 2  
Frontend QA and hardening

PHASE 3  
Backend architecture and API

PHASE 4  
Backend QA

PHASE 5  
Database integration

PHASE 6  
AI and RAG

PHASE 7  
Threat intelligence

PHASE 8  
Behavioral/anomaly detection

PHASE 9  
Threat graph and correlation

PHASE 10  
Response workflows

PHASE 11  
Cybersecurity hardening

PHASE 12  
Full-system integration

PHASE 13  
Final QA, testing, optimization and documentation

---

# 5. ABSOLUTE RULE: FRONTEND FIRST

For the initial implementation, build ONLY the frontend.

Do not implement:

- MongoDB

- Express

- backend APIs

- authentication backend

- AI APIs

- OpenAI

- Python

- Redis

- BullMQ

- external threat intelligence APIs

- real security automation

during the initial frontend phase.

Use realistic mock data and mock services.

The frontend must be fully functional from the user's perspective even though its data is mocked.

The UI must be designed so the future backend can replace the mock services without requiring major frontend restructuring.

---

# 6. FRONTEND-FIRST ARCHITECTURE

Create a clean frontend architecture that separates:

UI  
↓  
Application logic  
↓  
Services  
↓  
Mock data

Do NOT scatter mock data throughout components.

Create a dedicated mock/data/service layer.

For example:

src/

components/  
features/  
layouts/  
pages/  
routes/  
services/  
api/  
mocks/  
hooks/  
utils/  
types/  
schemas/  
animations/  
constants/  
assets/  
styles/

Use feature-oriented organization where appropriate.

---

# 7. FRONTEND PAGES

Build a complete professional application.

At minimum include:

## Public / Entry

- Landing page

- Login

- Register

- Forgot password

- Reset password

- Email verification

- Unauthorized / 403

- Not found / 404

- Error page

## Main Application

### Dashboard

Show:

- overall security posture

- active incidents

- critical alerts

- risk score

- suspicious events

- recent activity

- threat trends

- top indicators

- attack techniques

- system status

---

### Threat Intelligence

Pages/features:

- IOC overview

- IP investigation

- Domain investigation

- URL investigation

- Hash investigation

- IOC submission

- IOC details

- IOC history

---

### Incidents

- Incident list

- Incident details

- incident timeline

- severity

- status

- assigned analyst

- evidence

- related IOCs

- related users

- MITRE techniques

- AI analysis

- recommended actions

- analyst notes

- audit history

---

### Alerts

- Alert list

- Alert details

- severity filters

- confidence

- source

- timestamps

- affected assets

- related events

---

### Threat Graph

Create an interactive visualization showing relationships between:

- IP addresses

- domains

- URLs

- hashes

- users

- incidents

- threat actors

- techniques

Use a suitable graph visualization library.

---

### MITRE ATT&CK

Create:

- technique browser

- tactic overview

- technique details

- mapped incidents

- mapped indicators

---

### AI Security Assistant

The UI should support natural-language investigation.

Examples:

"Why is this incident high risk?"

"What indicators are related to this IP?"

"Show me unusual login activity."

"Summarize Incident #1024."

"Which MITRE techniques are associated with this incident?"

Initially use mocked responses.

Do NOT expose a fake claim that a real AI model is connected.

Clearly architect this as a future AI service.

---

### Investigations

Create an investigation workspace where analysts can:

- search indicators

- inspect relationships

- view timelines

- add notes

- correlate evidence

- review AI findings

- assign incidents

- mark findings

---

### Reports

Include:

- security summary

- incident report

- threat intelligence report

- risk report

- activity report

Reports should have professional presentation and future export capability.

---

### Users

- user list

- user profile

- role

- status

- activity

- permissions

---

### Settings

Include:

- profile

- organization

- security settings

- notification settings

- API settings placeholder

- AI settings placeholder

- appearance

- session/security information

---

### Audit Logs

Create a professional audit log interface.

Show:

- actor

- action

- resource

- timestamp

- IP

- result

- severity

---

# 8. USER ROLES

Design the frontend around RBAC.

At minimum:

## Super Admin

Full access.

## Security Admin

Security configuration and incident management.

## Security Analyst

Threat investigation and incident handling.

## Viewer

Read-only access.

The frontend must visually respect permissions.

However:

IMPORTANT:

Frontend permission checks are NOT security.

Backend authorization will be implemented later.

---

# 9. DESIGN SYSTEM

Create a reusable design system before building individual pages.

Do not style every page independently.

Define:

- colors

- typography

- spacing

- radius

- shadows

- borders

- buttons

- inputs

- cards

- tables

- badges

- alerts

- modals

- drawers

- tooltips

- dropdowns

- tabs

- breadcrumbs

- pagination

- empty states

- loading states

- error states

- skeletons

- charts

- timelines

Everything must be reusable.

---

# 10. ICON RULE

Use:

## Font Awesome

for icons.

Do NOT use:

- emojis

- random Unicode symbols

- mixed icon libraries

- manually drawn SVG icons unless absolutely necessary

- inconsistent icon styles

Maintain one coherent icon system.

Use the most appropriate free Font Awesome icons available.

Icons must have:

- consistent sizing

- consistent visual weight

- accessible labels/tooltips where needed

---

# 11. TYPOGRAPHY

Use Google Fonts.

Select a highly readable professional UI font.

Do not use too many font families.

Prefer:

one primary UI font

and optionally:

one secondary display font only if genuinely useful.

Typography must prioritize readability.

---

# 12. ANIMATIONS

Use Anime.js.

Animations must be:

- subtle

- purposeful

- smooth

- professional

- performant

Use animations for:

- page transitions

- dashboard loading

- number counters

- card entrance

- modal entrance

- dropdowns

- status changes

- graph interactions

- hover states

- alert emphasis

Do NOT animate everything.

Avoid:

- excessive bouncing

- distracting infinite animations

- unnecessary spinning

- excessive parallax

- animation on every mouse movement

Respect:

prefers-reduced-motion

---

# 13. RESPONSIVENESS

The frontend must work correctly across:

- large desktop

- desktop

- laptop

- tablet

- mobile

Do not simply shrink desktop layouts.

Design responsive behavior intentionally.

Special attention:

- tables

- sidebars

- navigation

- filters

- charts

- graph visualization

- incident panels

- modal dialogs

- forms

- command/search interfaces

No:

- horizontal overflow

- clipped content

- inaccessible controls

- overlapping elements

- unusable tables

---

# 14. ACCESSIBILITY

Follow WCAG principles.

Implement:

- semantic HTML

- keyboard navigation

- visible focus states

- appropriate ARIA attributes

- accessible dialogs

- accessible forms

- labels

- error messages

- sufficient contrast

- screen-reader-friendly status messages

Do not use color as the only indicator.

For example:

HIGH

must not be represented only by red.

Use:

icon + label + color.

---

# 15. UX STATES

Every important component must support:

- loading

- loaded

- empty

- error

- success

- disabled

- unauthorized

- no results

Never leave blank screens.

For example:

If there are no incidents:

Show a professional empty state explaining:

"No active incidents"

instead of an empty table.

---

# 16. TABLE UX

Security platforms contain lots of data.

Tables must support:

- sorting

- filtering

- searching

- pagination

- column management where useful

- row actions

- responsive behavior

Do not create massive unusable tables.

---

# 17. SEARCH

Build a global search / command interface.

It should eventually search:

- incidents

- alerts

- IPs

- domains

- URLs

- hashes

- users

- reports

Initially use mock data.

The architecture must allow backend search later.

---

# 18. DASHBOARD DESIGN

The dashboard must not look like a generic admin dashboard.

The first screen should immediately communicate:

"What is happening with my organization's security?"

Include:

- Threat Risk Score

- active incidents

- critical alerts

- unresolved threats

- threat activity timeline

- severity distribution

- top attack techniques

- recent IOCs

- anomaly indicators

- system health

Use charts carefully.

Do not overload the dashboard.

---

# 19. INCIDENT EXPERIENCE

Incident details are one of the most important screens.

Design it like a real investigation workspace.

Include:

## Header

- incident ID

- title

- severity

- confidence

- status

- assigned analyst

## Summary

What happened?

## Timeline

What happened first?

What happened next?

## Evidence

What evidence supports the incident?

## Indicators

IP  
Domain  
URL  
Hash

## MITRE ATT&CK

Related tactics and techniques.

## Behavioral Analysis

Normal behavior vs suspicious behavior.

## AI Analysis

Clearly distinguish:

"AI-generated analysis"

from deterministic security findings.

## Recommended Actions

Clearly label AI-generated recommendations.

## Audit History

Who did what and when?

---

# 20. THREAT INTELLIGENCE UI

Build investigation interfaces for:

### IP

Show:

- IP

- reputation

- country

- ASN

- related domains

- related incidents

- historical activity

- confidence

- risk score

### Domain

Show:

- domain

- reputation

- registration information placeholder

- related IPs

- URLs

- incidents

- risk

### URL

Show:

- URL

- domain

- reputation

- analysis

- related indicators

### Hash

Show:

- hash

- type

- reputation

- related files

- incidents

Use realistic mock data.

---

# 21. THREAT GRAPH UI

The graph should be interactive.

Users should be able to:

- zoom

- pan

- select nodes

- inspect nodes

- expand relationships

- filter node types

- highlight paths

- focus on an indicator

Provide a side panel showing details of the selected node.

Do not make the graph decorative.

It must communicate information.

---

# 22. FRONTEND SECURITY

Even during the frontend-only phase, write secure code.

Do not:

- use dangerouslySetInnerHTML unnecessarily

- inject unsanitized HTML

- store secrets

- expose fake API keys

- trust URL parameters

- execute arbitrary code

- use unsafe eval-like functionality

Validate user input.

Escape untrusted output.

Treat mock external data as untrusted.

---

# 23. MOCK BACKEND CONTRACT

Even though the real backend does not exist yet, define interfaces such as:

ThreatService  
IncidentService  
AlertService  
IOCService  
UserService  
AuthService  
AIService  
ReportService  
AuditService

Example concept:

ThreatService.getIndicator()

The frontend should depend on the service interface, not directly on hardcoded mock arrays.

Later:

MockThreatService

can become:

ApiThreatService

without rewriting UI components.

---

# 24. TYPES

Create strong TypeScript types for:

User  
Role  
Organization  
Incident  
Alert  
Indicator  
IPIndicator  
DomainIndicator  
URLIndicator  
HashIndicator  
ThreatActor  
ThreatTechnique  
AuditLog  
RiskScore  
AIAnalysis  
Recommendation  
SecurityEvent  
Investigation  
Report

Avoid:

any

unless absolutely unavoidable.

If any is used, explain why.

---

# 25. VALIDATION

Use Zod.

Validate:

- forms

- search parameters

- filters

- mock API responses

- AI mock responses

- route parameters where appropriate

The frontend should fail gracefully if data is malformed.

---

# 26. ERROR HANDLING

Create a centralized frontend error-handling strategy.

Handle:

- network errors

- invalid responses

- malformed data

- route errors

- component errors

- unexpected exceptions

Implement Error Boundaries where appropriate.

Never show raw stack traces to normal users.

---

# 27. TESTING

Testing is mandatory.

Use:

- Vitest/Jest

- React Testing Library

- Playwright

Test:

## Unit

- utilities

- validation

- risk calculations

- formatters

- permission logic

## Component

- buttons

- forms

- modals

- tables

- filters

- alerts

## Integration

- navigation

- search

- incident workflow

- investigation workflow

## E2E

Test critical user journeys.

Example:

Login  
→ Dashboard  
→ Incident  
→ Investigation  
→ IOC  
→ Threat Graph  
→ AI Analysis  
→ Report

---

# 28. FRONTEND QUALITY GATE

DO NOT proceed to backend development until ALL of these are true:

- application builds successfully

- TypeScript has no errors

- linting passes

- tests pass

- E2E tests pass

- no console errors

- no console warnings caused by application code

- no broken routes

- no broken links

- no broken buttons

- no dead interactions

- no inaccessible dialogs

- no obvious responsive issues

- no horizontal overflow

- no duplicated UI logic

- no obvious security vulnerabilities

- no placeholder UI accidentally exposed

- loading states work

- empty states work

- error states work

- all mock workflows work

- all major interactions have been manually reviewed

You must perform a final frontend audit before declaring Phase 1 complete.

---

# 29. DO NOT HIDE BUGS

Never:

- disable tests just to make them pass

- remove validation to avoid errors

- suppress warnings without understanding them

- use `// eslint-disable` as a shortcut

- use `any` everywhere

- delete failing tests

- fake successful API responses

- hardcode UI behavior that should be data-driven

- ignore accessibility errors

- ignore mobile problems

Fix the underlying problem.

---

# 30. CODE QUALITY

Code should be:

- modular

- readable

- typed

- documented where necessary

- maintainable

- reusable

- testable

Avoid giant components.

Avoid giant files.

Avoid duplicated code.

Avoid deeply nested conditional rendering.

Extract reusable logic into:

- hooks

- services

- utilities

- components

- feature modules

---

# 31. PERFORMANCE

Optimize for:

- fast initial load

- lazy-loaded routes

- optimized images

- efficient rendering

- memoization only where justified

- virtualized large lists where necessary

- debounced search

- efficient charts

- graph rendering performance

Do not prematurely optimize everything.

Measure first.

---

# 32. FRONTEND DOCUMENTATION

Create documentation explaining:

- architecture

- folder structure

- design system

- component conventions

- state management

- mock services

- testing

- accessibility

- security decisions

- future backend integration

---

# 33. PHASE 2 — BACKEND

Only after the frontend quality gate passes:

Build:

Node.js  

+ Express  
+ TypeScript

Create modular backend architecture.

Suggested:

src/

config/  
controllers/  
services/  
repositories/  
models/  
routes/  
middleware/  
validators/  
security/  
utils/  
workers/  
events/  
types/

Use service/repository separation.

---

# 34. BACKEND SECURITY

Implement:

- authentication

- authorization

- secure password hashing

- session/token security

- rate limiting

- Helmet

- CORS

- request validation

- input sanitization

- secure cookies where appropriate

- CSRF protection where applicable

- secure error handling

- audit logging

- request size limits

Follow OWASP principles.

---

# 35. DATABASE

Implement MongoDB models for:

User  
Organization  
Role  
Incident  
Alert  
SecurityEvent  
Indicator  
ThreatReport  
ThreatActor  
MITRETechnique  
Investigation  
AIAnalysis  
Recommendation  
AuditLog  
RiskAssessment

Use indexes intelligently.

Do not create indexes blindly.

Analyze expected query patterns.

---

# 36. AI ARCHITECTURE

Create an AI abstraction layer.

Example conceptual interface:

AIProvider

methods:

analyzeIncident()  
summarizeIncident()  
explainThreat()  
generateInvestigationSummary()  
generateRecommendations()  
answerSecurityQuestion()

The frontend and core business logic must not directly depend on OpenAI.

---

# 37. RAG

Build RAG using:

MongoDB Atlas Vector Search

Knowledge sources can include:

- MITRE ATT&CK

- internal security documentation

- threat reports

- security playbooks

- historical incidents

Pipeline:

Document  
→ chunk  
→ embedding  
→ vector storage  
→ retrieval  
→ contextual prompt  
→ LLM  
→ structured output  
→ validation

---

# 38. AI SAFETY

Implement:

- prompt injection defenses

- sensitive-data redaction

- output validation

- structured JSON output

- model timeout handling

- retry limits

- token limits

- logging without sensitive data

- provider failure handling

AI must never automatically execute dangerous actions merely because the model suggested them.

---

# 39. RISK ENGINE

Risk calculation must be deterministic.

Do NOT delegate the final risk calculation entirely to an LLM.

Consider:

- threat reputation

- confidence

- behavioral anomaly

- asset criticality

- attack technique

- historical evidence

- number of correlated indicators

AI may explain the score.

AI does not own the score.

---

# 40. THREAT INTELLIGENCE

Build provider abstraction:

ThreatIntelProvider

Potential integrations may include:

- MITRE ATT&CK

- VirusTotal

- other legitimate threat-intelligence providers

Do not tightly couple the application to one provider.

Handle:

- API failures

- quotas

- timeouts

- missing data

- stale data

- provider disagreement

Never present external intelligence as absolute truth.

Display:

source  
timestamp  
confidence  
provider

---

# 41. THREAT CORRELATION

Create correlation logic.

Example:

IP  
→ Domain  
→ URL  
→ Hash  
→ Incident  
→ User  
→ Technique

Generate relationships based on evidence.

Do not fabricate relationships using AI.

AI may suggest possible relationships, but deterministic evidence should be clearly separated.

---

# 42. ANOMALY DETECTION

Create a Python ML service.

Use:

FastAPI  

+ scikit-learn

Start with explainable models such as:

Isolation Forest

Features could include:

- login time

- geographic changes

- request frequency

- resource access

- file downloads

- authentication failures

- unusual endpoint access

The ML service should return:

anomaly score  
confidence  
features contributing to anomaly

Do not start with an unnecessarily complex neural network.

---

# 43. QUEUE ARCHITECTURE

Use:

Redis  

+ BullMQ

For:

- IOC enrichment

- AI analysis

- document processing

- report generation

- ML analysis

- threat-feed synchronization

Jobs must be:

- retryable

- idempotent where possible

- observable

- safely timeout-controlled

---

# 44. REAL-TIME EVENTS

Use Socket.IO for:

- new alerts

- incident updates

- threat intelligence updates

- investigation events

- AI analysis completion

- system status

---

# 45. AUDIT LOGGING

Every security-sensitive action should produce an audit record.

Examples:

LOGIN  
LOGIN_FAILED  
PASSWORD_CHANGED  
ROLE_CHANGED  
INCIDENT_CREATED  
INCIDENT_UPDATED  
IOC_SUBMITTED  
IOC_ANALYZED  
AI_ANALYSIS_REQUESTED  
AI_ANALYSIS_COMPLETED  
RECOMMENDATION_APPROVED  
RECOMMENDATION_REJECTED  
EXPORT_CREATED

Never store secrets in audit logs.

---

# 46. SECURITY TESTING

Perform:

- dependency audit

- static analysis

- OWASP ZAP testing

- authentication testing

- authorization testing

- injection testing

- XSS testing

- CSRF testing where applicable

- SSRF testing

- file-upload security testing

- rate-limit testing

- API abuse testing

- AI prompt injection testing

Document findings and fixes.

---

# 47. FINAL SYSTEM TESTING

Test the complete system.

Example:

User  
→ Login  
→ Dashboard  
→ Submit IOC  
→ Enrichment  
→ Threat intelligence  
→ Correlation  
→ Risk calculation  
→ AI analysis  
→ Incident  
→ Investigation  
→ Recommendation  
→ Human approval  
→ Audit log

Every step must work.

---

# 48. FAILURE TESTING

Intentionally simulate:

- AI provider unavailable

- threat intelligence provider unavailable

- MongoDB unavailable

- Redis unavailable

- malformed AI response

- malicious input

- invalid authentication

- expired token

- unauthorized user

- huge request

- malicious file

- rate-limit abuse

- duplicate events

The application must fail safely.

---

# 49. FINAL SECURITY PRINCIPLE

Assume:

- users can be malicious

- input can be malicious

- uploaded files can be malicious

- external APIs can fail

- external intelligence can be wrong

- AI can hallucinate

- AI can be manipulated

- credentials can leak

- databases can become unavailable

- networks can fail

Design accordingly.

---

# 50. DEVELOPMENT WORKFLOW

For every phase:

1. Inspect current project.

2. Understand existing architecture.

3. Create a plan.

4. Implement a small logical unit.

5. Run tests.

6. Fix errors.

7. Run lint.

8. Run type checking.

9. Run build.

10. Perform security review.

11. Perform UX review.

12. Perform responsive review.

13. Update documentation.

14. Only then move to the next unit.

Never make huge uncontrolled changes.

---

# 51. BEFORE MODIFYING EXISTING CODE

Inspect the repository first.

Understand:

- package.json

- tsconfig

- vite config

- existing source

- routes

- dependencies

- tests

- assets

- environment configuration

Do not overwrite functioning code unnecessarily.

Preserve useful work.

---

# 52. GIT DISCIPLINE

Use logical commits.

Examples:

feat: create application shell  
feat: add authentication screens  
feat: add security dashboard  
feat: add incident workspace  
feat: add threat intelligence views  
test: add incident workflow tests  
fix: resolve mobile navigation issue  
security: harden input validation

Do not make one giant commit containing the entire project.

---

# 53. CLAUDE EXECUTION RULE

You are allowed to work autonomously within the current phase.

However:

DO NOT silently jump from one phase to another.

At the end of every phase:

Provide:

## Completed

What was implemented.

## Tests

What tests were run.

## Results

Pass/fail information.

## Known Issues

Any remaining issue.

## Security Review

Security findings and fixes.

## Next Phase

What should happen next.

---

# 54. CRITICAL STOP CONDITIONS

STOP and ask for human direction if:

- requirements conflict

- an external API requires credentials that are unavailable

- a security decision has significant consequences

- destructive data operations are required

- production credentials are requested

- a dependency introduces significant security concerns

- requirements cannot be implemented safely

- the intended behavior is genuinely ambiguous

Do NOT guess silently.

---

# 55. FRONTEND PHASE START

Begin with:

PHASE 0:  
Repository inspection and architecture.

Then:

PHASE 1:  
Frontend implementation only.

Do not build backend yet.

Do not build database yet.

Do not integrate AI yet.

Do not integrate real threat intelligence APIs yet.

Create realistic mock services and data.

The frontend must feel like a real working cybersecurity platform.

---

# 56. FIRST ACTION

Before writing code:

1. Inspect the repository.

2. Identify the current stack.

3. Identify existing files.

4. Identify existing dependencies.

5. Identify whether anything already exists that should be preserved.

6. Produce a concise implementation plan.

7. Propose the frontend architecture.

8. Propose the page/route structure.

9. Propose the design system.

10. Propose the testing strategy.

Then begin implementation.

Do NOT skip repository inspection.

Do NOT immediately generate hundreds of files.

Build incrementally.

---

# 57. DEFINITION OF DONE

A phase is NOT complete because:

"the page looks good."

A phase is complete only when:

- functionality works

- UI works

- interactions work

- responsive behavior works

- accessibility is acceptable

- errors are handled

- tests pass

- build passes

- TypeScript passes

- lint passes

- security review passes

- no known critical bugs remain

- documentation is updated

---

# FINAL INSTRUCTION

Treat this project as a serious software engineering and cybersecurity product.

Prioritize:

SECURITY  
RELIABILITY  
CORRECTNESS  
MAINTAINABILITY  
ACCESSIBILITY  
PERFORMANCE  
USER EXPERIENCE  
TESTABILITY

over speed of implementation.

Do not optimize for producing many files.

Optimize for producing a system that is:

secure,  
understandable,  
testable,  
maintainable,  
professional,  
and genuinely useful.

START WITH PHASE 0 — REPOSITORY INSPECTION.

DO NOT START BACKEND DEVELOPMENT.

DO NOT START AI DEVELOPMENT.

DO NOT START DATABASE DEVELOPMENT.

FIRST COMPLETE THE FRONTEND.  
THEN TEST AND HARDEN THE FRONTEND.  
ONLY AFTER THE FRONTEND QUALITY GATE PASSES SHOULD THE NEXT PHASE BEGIN.
