# PROJECT ASSETS, SVG SYSTEM & DOCUMENTATION MASTER RULES

This section is an additional mandatory requirement for the entire project.

These requirements apply to:

- Images
- Profile pictures
- Avatars
- Illustrations
- Empty states
- Icons
- Favicon
- Branding
- SVG assets
- Documentation
- Installation
- Local development
- Production preparation

The goal is to ensure the project feels like a complete, professionally engineered product rather than a coding demo.

---

# 1. IMAGE SOURCE — UNSPLASH

Whenever the project genuinely requires photographic imagery:

USE UNSPLASH.

Do not randomly download images from unknown websites.

Do not use copyrighted images from random Google Image results.

Do not use low-quality stock images.

Do not use images merely for decoration.

Images must have a clear UX/product purpose.

Examples:

- User onboarding
- Security team imagery
- Professional workspace imagery
- Documentation illustrations
- Empty states where appropriate
- Marketing/public landing pages
- Security awareness sections

---

# 2. IMAGE USAGE RULE

Do not add images just because the interface "looks empty."

Every image must serve a purpose.

If an image does not improve:

- understanding
- branding
- hierarchy
- emotional connection
- product context

then DO NOT ADD IT.

The application is primarily a cybersecurity platform.

The interface should remain information-focused.

---

# 3. IMAGE QUALITY

Images must be:

- high quality
- professional
- relevant
- properly cropped
- responsive
- optimized

Do not use:

- blurry images
- stretched images
- unrelated stock photography
- overly dramatic hacker imagery
- cliché "hooded hacker" imagery
- cheesy cybersecurity visuals

Avoid stereotypical cybersecurity imagery.

Prefer sophisticated:

- technology
- security operations
- data
- infrastructure
- professional environments

---

# 4. IMAGE PERFORMANCE

Optimize every image.

Use:

- appropriate dimensions
- modern formats where supported
- lazy loading where appropriate
- responsive image sizing

Do not load a 5MB image when a 300KB image is sufficient.

Images must never unnecessarily slow down the application.

---

# 5. IMAGE ATTRIBUTION / SOURCE DOCUMENTATION

When external images are used, document their source where appropriate.

Maintain an asset/source record if required.

Do not embed external image URLs everywhere if the asset should be locally controlled.

Prefer a controlled asset strategy.

---

# 6. PROFILE PICTURES / AVATARS

For profile pictures, avatars, analyst identities, organization profiles, and similar UI:

DO NOT rely on random external profile-photo URLs.

Instead, when appropriate, create premium SVG-based avatar/profile visuals.

Possible approaches:

- abstract geometric avatar
- professional initials avatar
- generated SVG identity
- security analyst avatar
- organization monogram
- deterministic gradient-free SVG avatar

The visual system must remain consistent.

---

# 7. PROFILE AVATAR PRIVACY

Do not use real people's photographs as default profile images unless explicitly provided or authorized.

For default users:

Prefer generated SVG avatars.

Example:

User:

"AR"

Could receive a premium custom SVG identity.

This is safer, lighter, and more consistent than random profile photos.

---

# 8. DETERMINISTIC AVATARS

Generated profile avatars should preferably be deterministic.

The same user should receive the same avatar unless they explicitly change it.

Generate the avatar based on a stable non-sensitive identifier where appropriate.

Do NOT expose sensitive information through avatar generation.

---

# 9. PREMIUM SVG SYSTEM

SVG should be used whenever it provides a better result than raster imagery.

Use SVG for:

- logos
- favicon
- avatars
- abstract illustrations
- empty states
- decorative shapes
- system status illustrations
- premium UI accents
- lightweight interface graphics

SVGs should be:

- optimized
- accessible where relevant
- responsive
- scalable
- lightweight

---

# 10. DO NOT USE SVG AS AN EXCUSE FOR EXCESSIVE DECORATION

SVG does not mean:

"add graphics everywhere."

The design philosophy remains:

MINIMALISM.

Use SVG where it improves the experience.

Avoid unnecessary illustrations.

---

# 11. SVG DESIGN LANGUAGE

All custom SVG assets must share a coherent visual language.

Maintain consistency in:

- stroke width
- corner treatment
- proportions
- geometry
- visual weight
- spacing

Do not use five completely different illustration styles.

---

# 12. PREMIUM SVG AVATARS

Default avatars should look intentionally designed.

Avoid generic:

- colored circles
- emoji faces
- random cartoon characters
- childish illustrations

Instead create sophisticated SVG identity systems.

Possible styles:

- geometric
- abstract
- monogram
- technical
- minimal professional

No emojis.

---

# 13. EMPTY STATES

When an empty state benefits from visual communication:

Create a custom SVG.

Examples:

No incidents

No investigations

No alerts

No threat intelligence

No reports

No notifications

The illustration must communicate the state clearly without being childish.

---

# 14. ERROR STATES

Important error pages may use custom SVG illustrations.

Examples:

404
403
500
Service unavailable

Do not use random external illustrations.

Keep them consistent with the project's design language.

---

# 15. LOADING STATES

Prefer CSS/Anime.js-based loading states or lightweight SVG where appropriate.

Do not load heavy animated images simply to display a loading state.

Never make loading animations distracting.

---

# 16. LOGO

Create a professional SVG logo for the platform if one does not already exist.

The logo must work in:

- light backgrounds
- dark backgrounds
- navigation
- login screen
- favicon
- social metadata
- documentation

Create appropriate variants where necessary.

---

# 17. FAVICON — PREMIUM SVG

The favicon must be intentionally designed.

DO NOT use:

- an emoji
- a random icon
- a screenshot
- a text-heavy logo
- a generic Font Awesome icon directly as the favicon

Create a custom premium SVG favicon.

The favicon must remain recognizable at very small sizes.

Design specifically for:

- 16×16
- 32×32
- 48×48
- browser tab usage
- bookmarks

Avoid tiny details that disappear at small sizes.

---

# 18. FAVICON FILES

Where appropriate provide:

favicon.svg

and compatible fallback formats if required by the browser/platform.

Configure the HTML correctly.

Example concept:

<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">

Do not leave the browser using a default favicon.

---

# 19. FAVICON DESIGN PHILOSOPHY

The favicon should communicate the product identity.

It should feel:

- premium
- secure
- modern
- recognizable
- minimal

It should NOT feel:

- childish
- gaming-oriented
- generic
- overly complex

---

# 20. SVG ACCESSIBILITY

For meaningful SVG graphics:

provide appropriate accessibility information.

For purely decorative SVG:

ensure it does not create unnecessary screen-reader noise.

Do not make decorative graphics keyboard-focusable.

---

# 21. SVG OPTIMIZATION

Optimize SVG files.

Remove:

- unnecessary metadata
- editor information
- unused definitions
- unnecessary whitespace
- redundant paths

Do not sacrifice visual quality.

---

# 22. ASSET ORGANIZATION

Use a clean asset structure.

Example:

assets/

images/
logos/
icons/
svg/
avatars/
illustrations/
favicon/

Do not place every asset into one enormous folder.

Use meaningful filenames.

Examples:

logo-primary.svg

logo-mark.svg

favicon.svg

empty-incidents.svg

empty-investigations.svg

avatar-default-01.svg

---

# 23. NO INLINE SVG CHAOS

Do not copy enormous SVG code directly into dozens of HTML files.

If an SVG is reusable:

store it as an asset.

Reuse it.

Avoid duplication.

---

# 24. ICON SYSTEM

Font Awesome remains the PRIMARY UI icon system.

Custom SVG is primarily for:

- branding
- illustrations
- avatars
- favicon
- specialized visual assets

Do not replace every normal UI icon with a custom SVG.

---

# 25. DOCUMENTATION REQUIREMENT

Documentation is part of the product.

The project MUST include:

README.md

PLUS:

7 additional dedicated Markdown documentation files.

Therefore:

TOTAL CORE DOCUMENTATION:

8 Markdown files

including README.md.

---

# 26. DOCUMENTATION STRUCTURE

Create a dedicated:

docs/

directory.

The final documentation structure should contain:

README.md

docs/
├── 01-architecture.md
├── 02-security.md
├── 03-api.md
├── 04-ai-and-threat-intelligence.md
├── 05-database.md
├── 06-development-and-testing.md
├── 07-deployment-and-operations.md
└── 08-system-requirements-and-local-setup.md

IMPORTANT:

The exact filenames may be changed if a better naming convention is established, but the project MUST contain seven dedicated documentation files PLUS README.md.

---

# 27. DOCUMENTATION FILE #1 — ARCHITECTURE

Document:

- overall architecture
- frontend architecture
- backend architecture
- data flow
- authentication flow
- authorization flow
- AI architecture
- threat intelligence architecture
- queue architecture
- real-time architecture
- external services
- major components
- responsibilities

Include diagrams where useful.

---

# 28. DOCUMENTATION FILE #2 — SECURITY

Document:

- security architecture
- authentication
- authorization
- RBAC
- tenant isolation
- encryption strategy
- secrets
- rate limiting
- input validation
- SSRF protection
- file upload security
- AI security
- prompt injection protection
- audit logging
- security monitoring
- threat model
- vulnerability management

Do not merely write:

"Security is implemented."

Explain HOW it is implemented.

---

# 29. DOCUMENTATION FILE #3 — API

Document:

- API base URL
- authentication
- endpoints
- HTTP methods
- request schemas
- response schemas
- errors
- pagination
- filtering
- rate limiting
- authorization requirements

Include examples where appropriate.

If Swagger/OpenAPI exists:

document how to access it.

---

# 30. DOCUMENTATION FILE #4 — AI & THREAT INTELLIGENCE

Document:

- AI provider
- AI architecture
- AI abstraction
- prompts
- structured outputs
- validation
- hallucination controls
- prompt injection protection
- RAG
- vector search
- MITRE ATT&CK
- threat intelligence providers
- IOC enrichment
- correlation
- confidence
- risk scoring
- AI limitations

Clearly distinguish:

DETERMINISTIC SECURITY LOGIC

from:

AI-GENERATED ANALYSIS.

---

# 31. DOCUMENTATION FILE #5 — DATABASE

Document:

- MongoDB architecture
- collections
- schemas
- indexes
- relationships
- tenant isolation
- data classification
- retention
- backups
- restoration
- migrations where applicable
- vector storage

Include database relationship diagrams where useful.

---

# 32. DOCUMENTATION FILE #6 — DEVELOPMENT & TESTING

Document:

- development workflow
- coding standards
- folder structure
- linting
- formatting
- unit testing
- integration testing
- API testing
- security testing
- frontend testing
- regression testing
- test commands
- debugging approach
- quality gates

A new developer should understand how the project is developed and tested.

---

# 33. DOCUMENTATION FILE #7 — DEPLOYMENT & OPERATIONS

Document:

- production architecture
- environment variables
- deployment
- Docker if used
- CI/CD
- secrets
- database deployment
- Redis deployment
- monitoring
- logging
- backups
- restoration
- rollback
- disaster recovery
- health checks
- scaling
- maintenance

Do not expose actual secrets.

Use placeholders.

---

# 34. DOCUMENTATION FILE #8 — SYSTEM REQUIREMENTS & COMPLETE LOCAL SETUP

This document is EXTREMELY IMPORTANT.

It must be written for:

"A person who has never run this project on their own computer."

Do NOT assume the reader already knows:

- Node.js
- npm
- MongoDB
- Redis
- Git
- environment variables
- terminals
- Docker
- API keys

Explain everything.

---

# 35. SYSTEM REQUIREMENTS

Clearly list:

Required operating systems where supported:

- Windows
- macOS
- Linux

Required software:

- Git
- Node.js
- npm
- MongoDB / MongoDB Atlas
- Redis
- required browser
- Docker if required
- any additional runtime

Include minimum and recommended versions.

Example:

Node.js:
Minimum: XX
Recommended: XX LTS

Do not invent versions.

Use the actual versions required by the project.

---

# 36. HARDWARE REQUIREMENTS

Document realistic:

Minimum:

- RAM
- CPU
- storage
- internet connection

Recommended:

- RAM
- CPU
- storage

If local AI/ML models are NOT required:

explicitly state that.

If GPU is not required:

explicitly state that.

---

# 37. STEP-BY-STEP LOCAL INSTALLATION

The setup documentation must explain:

STEP 1
Install Git

STEP 2
Install Node.js

STEP 3
Verify Node.js

STEP 4
Verify npm

STEP 5
Clone repository

STEP 6
Open project folder

STEP 7
Install dependencies

STEP 8
Create environment files

STEP 9
Configure MongoDB

STEP 10
Configure Redis

STEP 11
Configure AI provider

STEP 12
Configure threat intelligence providers

STEP 13
Run database initialization/seed if required

STEP 14
Run backend

STEP 15
Run frontend

STEP 16
Open application

STEP 17
Create first account

STEP 18
Verify system functionality

Every step must contain the actual command.

---

# 38. WINDOWS SETUP

Because developers may use Windows:

Include Windows-specific instructions where commands differ.

Explain:

- PowerShell
- Command Prompt where relevant
- environment variables
- path behavior
- common permission problems

Do not assume Linux/macOS commands will automatically work on Windows.

---

# 39. MACOS / LINUX SETUP

Where commands differ:

document them.

Use clear sections:

Windows

macOS

Linux

Do not make the setup unnecessarily complicated.

---

# 40. ENVIRONMENT VARIABLES

Document every required environment variable.

Example:

PORT=
MONGODB_URI=
REDIS_URL=
JWT_SECRET=
OPENAI_API_KEY=
THREAT_INTEL_API_KEY=

But NEVER place real credentials in documentation.

Use:

YOUR_VALUE_HERE

or:

<YOUR_API_KEY>

---

# 41. ENVIRONMENT VARIABLE EXPLANATIONS

For every variable explain:

WHAT IT IS

WHY IT IS REQUIRED

WHERE TO GET IT

WHETHER IT IS REQUIRED FOR DEVELOPMENT

WHETHER IT IS REQUIRED FOR PRODUCTION

Example:

OPENAI_API_KEY

Purpose:
Allows the AI service to communicate with the configured OpenAI API.

Required:
Yes for AI functionality.

Do not merely list variable names.

---

# 42. FIRST-RUN EXPERIENCE

The setup documentation must explain exactly what happens after:

npm install

and:

npm run dev

Explain:

- which server starts
- which port
- how frontend communicates with backend
- how database connection is verified
- how Redis is verified
- how AI availability is checked

---

# 43. COMMON ERRORS

Include a troubleshooting section.

Examples:

MongoDB connection failed

Redis connection failed

Port already in use

Node version mismatch

npm install failed

Environment variable missing

AI API key invalid

Threat intelligence API limit reached

CORS error

Authentication error

Database permission error

Build failure

For each:

PROBLEM

CAUSE

SOLUTION

---

# 44. COMPLETE CLEAN INSTALLATION

The documentation must include:

"How to completely remove and reinstall the project."

Explain:

- remove dependencies
- clean build files
- reinstall packages
- reset development database if appropriate
- regenerate environment configuration

Do not provide destructive production commands without warnings.

---

# 45. DATABASE SETUP

Explain both where applicable:

OPTION A
MongoDB Atlas

OPTION B
Local MongoDB

Explain:

- creating database
- obtaining connection string
- creating user
- permissions
- network access
- environment variable configuration

Never recommend unnecessarily opening MongoDB to the entire internet.

---

# 46. REDIS SETUP

Explain:

- local Redis
- Docker Redis if supported
- managed Redis if applicable

Explain how to verify Redis connectivity.

---

# 47. AI SETUP

Explain:

- how to obtain the required AI API key
- where to place it
- how to test it
- how to disable AI during development if supported
- what happens if the provider is unavailable

Never expose the API key in frontend code.

---

# 48. THREAT INTELLIGENCE SETUP

For every external provider:

Explain:

- provider purpose
- account creation if required
- API key acquisition
- environment variable
- rate limits
- optional/required status

The application must still fail gracefully if an optional provider is unavailable.

---

# 49. DEVELOPMENT COMMANDS

Document all important commands.

Examples:

npm install

npm run dev

npm run build

npm start

npm test

npm run lint

npm run typecheck

npm run audit

npm run seed

Use ONLY commands that actually exist in package.json.

Never document fictional commands.

---

# 50. PROJECT SCRIPTS VALIDATION

Before finalizing documentation:

COMPARE DOCUMENTATION

against:

package.json

and actual project scripts.

Every documented command must actually work.

---

# 51. DOCUMENTATION ACCURACY

Documentation must describe the ACTUAL implementation.

Do not document:

features that do not exist.

Do not claim:

"Redis is used"

if Redis is not actually configured.

Do not claim:

"AI uses RAG"

if RAG has not been implemented.

Documentation must never become marketing fiction.

---

# 52. README REQUIREMENTS

README.md should provide a high-quality overview.

Include:

- project name
- project purpose
- problem being solved
- core features
- architecture overview
- technology stack
- security approach
- AI capabilities
- threat intelligence
- screenshots where useful
- installation summary
- links to documentation
- testing
- deployment overview
- limitations
- license

Do not duplicate the entire documentation inside README.

README should be the entry point.

---

# 53. DOCUMENTATION NAVIGATION

README must link to all seven documentation files plus the setup document.

Create a clear:

Documentation

section.

A new developer should be able to navigate the entire technical documentation from README.

---

# 54. DOCUMENTATION WRITING STYLE

Documentation must be:

- clear
- professional
- structured
- beginner-friendly where appropriate
- technically accurate

Avoid unnecessary corporate language.

Avoid unexplained acronyms.

When using an acronym:

explain it the first time.

Example:

RBAC (Role-Based Access Control)

---

# 55. DOCUMENTATION EXAMPLES

Use realistic examples.

Do not expose:

- real API keys
- real credentials
- private IPs
- private customer data
- production secrets

Use safe placeholders.

---

# 56. DOCUMENTATION MAINTENANCE

Whenever architecture changes:

UPDATE THE DOCUMENTATION.

Whenever an environment variable changes:

UPDATE THE DOCUMENTATION.

Whenever an API changes:

UPDATE THE API DOCUMENTATION.

Whenever setup changes:

UPDATE THE SETUP DOCUMENTATION.

Outdated documentation is considered a project defect.

---

# 57. ASSET + DOCUMENTATION QUALITY GATE

Before declaring the project complete, verify:

[ ] Images are properly sourced

[ ] No random copyrighted imagery was used

[ ] Images are optimized

[ ] Profile avatars are professionally designed

[ ] No emojis are used

[ ] Custom SVG system is consistent

[ ] Logo exists

[ ] Premium SVG favicon exists

[ ] Favicon works in browser

[ ] Empty states are polished

[ ] Error states are polished

[ ] Assets are organized

[ ] README exists

[ ] Seven dedicated documentation files exist

[ ] Complete local setup documentation exists

[ ] System requirements are documented

[ ] Windows setup is documented

[ ] macOS/Linux setup is documented where applicable

[ ] Environment variables are documented

[ ] MongoDB setup is documented

[ ] Redis setup is documented

[ ] AI setup is documented

[ ] Threat intelligence setup is documented

[ ] Development commands are documented

[ ] Testing commands are documented

[ ] Common errors are documented

[ ] Clean installation is documented

[ ] Documentation matches the actual codebase

[ ] No fictional commands exist in documentation

[ ] No secrets exist in documentation

---

# FINAL RULE

The project is not complete when:

"the code works."

The project is complete when:

THE CODE WORKS
+
THE UI WORKS
+
THE SECURITY WORKS
+
THE TESTS PASS
+
THE ASSETS ARE POLISHED
+
THE DOCUMENTATION IS COMPLETE
+
A NEW DEVELOPER CAN SET IT UP WITHOUT ASKING THE ORIGINAL DEVELOPER FOR HELP.

The final repository must feel like a professionally engineered product that another developer can clone, understand, install, run, test, secure, maintain, and eventually deploy.
