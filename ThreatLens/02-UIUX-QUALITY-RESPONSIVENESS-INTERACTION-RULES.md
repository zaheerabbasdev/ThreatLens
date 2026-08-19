# UI/UX QUALITY, RESPONSIVENESS & INTERACTION MASTER RULES

This section is a STRICT extension of the main project requirements.

These rules apply to EVERY frontend page, component, layout, interaction, animation, transition, modal, form, table, chart, navigation element, card, button, input, dropdown, tooltip, notification, and future UI feature.

Do not treat these requirements as optional design suggestions.

They are mandatory product requirements.

---

# 1. RESPONSIVE BY DESIGN — NOT RESPONSIVE AS AN AFTERTHOUGHT

The entire application MUST be fully responsive across:

- Large desktop monitors

- Desktop

- Laptop

- Small laptop

- Tablet landscape

- Tablet portrait

- Large smartphones

- Small smartphones

- Touchscreen laptops

- Hybrid devices

- Different browser viewport sizes

- Different pixel densities

Do not design desktop first and simply "shrink" it for mobile.

Every layout must have an intentional responsive strategy.

The UI must remain:

- readable

- usable

- balanced

- accessible

- visually consistent

- performant

at every supported viewport.

---

# 2. RESPONSIVE BREAKPOINTS

Do not blindly rely on a small number of conventional breakpoints.

Design based on CONTENT BREAKPOINTS.

If a component becomes unusable at a certain width, create a breakpoint where the component actually needs to change.

Examples:

Desktop navigation  
→ compact navigation  
→ mobile navigation

Large data table  
→ condensed table  
→ horizontally scrollable table where appropriate  
→ card/list representation where necessary

Multi-column dashboard  
→ reduced columns  
→ stacked layout

Large investigation workspace  
→ split panel  
→ collapsible panel  
→ full-screen investigation view

Do not force desktop UI into mobile.

---

# 3. TOUCH-FIRST INTERACTION SUPPORT

The application must support multiple input methods.

At minimum:

- Mouse

- Touch

- Keyboard

- Trackpad

- Stylus / pen where supported

Do not design interactions that depend exclusively on hover.

A feature that works on mouse must have an equivalent usable interaction on touch.

Example:

A desktop hover tooltip must have an accessible tap/focus alternative.

A hover-only menu must not contain critical functionality.

A hover-only action must never be the only way to discover an important function.

---

# 4. POINTER AND TOUCH RESPONSE

Every interactive element should provide an appropriate response to user input.

Support:

- hover

- focus

- active/pressed

- touch feedback

- disabled

- loading

- success

- error

Do not create exaggerated effects.

Interactions should feel:

- immediate

- smooth

- soft

- controlled

- intentional

Avoid:

- excessive scaling

- violent movement

- flashing

- bouncing

- unnecessary cursor-following effects

- distracting magnetic buttons

- gimmicky pointer trails

The interface is a cybersecurity product.

It must feel sophisticated rather than playful.

---

# 5. BUTTON INTERACTIONS

Every button must communicate its state.

States:

DEFAULT  
→ HOVER  
→ FOCUS  
→ ACTIVE/PRESSED  
→ LOADING  
→ SUCCESS  
→ ERROR  
→ DISABLED

Buttons must not suddenly change size in a way that causes layout shifts.

Do not use generic arrows for every button.

Use a contextually appropriate Font Awesome icon when an icon adds meaning.

Examples:

Investigate → search/magnifying-glass icon

View incident → eye icon

Download report → download icon

Create incident → plus icon

Security settings → shield/gear icon

Do not add icons merely for decoration.

---

# 6. MICRO-INTERACTIONS

Every meaningful user interaction should have an appropriate micro-interaction.

Examples:

- Button press

- Toggle

- Checkbox

- Dropdown

- Tab change

- Search

- Filter

- Pagination

- Modal opening

- Modal closing

- Drawer opening

- Notification

- Form validation

- Save operation

- Successful action

- Failed action

- Navigation

- Table row selection

- Graph node selection

- Incident status change

Micro-interactions must communicate system state.

Do not animate interactions merely because animation is available.

---

# 7. ANIMATION PHILOSOPHY

Animations must make the application feel:

- smooth

- soft

- premium

- responsive

- intelligent

- controlled

The user should feel:

"Everything responds naturally to me."

Not:

"Everything is constantly moving."

Use Anime.js for meaningful animations where appropriate.

Prefer:

- subtle opacity transitions

- controlled transforms

- smooth scale changes

- soft movement

- progressive reveal

- staggered content appearance

- state transitions

Avoid:

- excessive bouncing

- aggressive spring effects

- endless animations

- distracting particle systems

- excessive parallax

- unnecessary 3D effects

- animations that delay interaction

---

# 8. BUTTERY FEEL

The application must have a "buttery" interaction experience.

Meaning:

- no sudden visual jumps

- no harsh transitions

- no flickering

- no layout shifting

- no abrupt component replacement

- no unnecessarily long animations

- no interaction lag

Animations must never make the interface feel slower.

If animation conflicts with performance:

PERFORMANCE WINS.

---

# 9. REDUCED MOTION

Respect:

`prefers-reduced-motion`

Users who disable animation must still receive a complete and understandable interface.

Do not make functionality dependent on animation.

---

# 10. LOADING EXPERIENCE

Avoid blank screens.

Use appropriate:

- skeleton loaders

- progress indicators

- subtle transitions

- loading placeholders

Skeletons should resemble the final content layout.

Do not show skeletons unnecessarily for extremely fast operations.

Avoid flashing:

Loading  
→ Content  
→ Loading  
→ Content

Use stable loading states.

---

# 11. ERROR EXPERIENCE

Errors must be understandable.

Never expose:

- stack traces

- raw exceptions

- database errors

- internal server information

- API secrets

- debugging information

Instead communicate:

WHAT HAPPENED

WHY IT MATTERS

WHAT THE USER CAN DO

Example:

"Threat intelligence could not be retrieved."

"External intelligence provider is temporarily unavailable."

"Try again in a few moments."

---

# 12. FORM UX

Forms must feel professional.

Implement:

- clear labels

- appropriate placeholders

- helpful descriptions

- validation

- inline errors

- success feedback

- loading state

- disabled state

- keyboard navigation

Do not rely exclusively on placeholder text as labels.

Validation should be helpful rather than aggressive.

Do not make users lose entered information after an error.

---

# 13. DATA-DENSE SECURITY UI

This platform will contain large amounts of security information.

Prioritize:

INFORMATION HIERARCHY.

Users should immediately understand:

1. What happened?

2. How serious is it?

3. What is affected?

4. Why does it matter?

5. What evidence exists?

6. What should happen next?

Do not overwhelm users with every piece of information simultaneously.

Use:

- sections

- tabs

- expandable panels

- progressive disclosure

- side panels

- tooltips

- contextual information

---

# 14. SECURITY SEVERITY VISUAL LANGUAGE

Severity must be understandable without relying only on color.

For example:

CRITICAL  
HIGH  
MEDIUM  
LOW  
INFORMATIONAL

Use combinations of:

- color

- icon

- text

- shape

- positioning

Never communicate critical information using color alone.

---

# 15. COLOR SYSTEM

The color palette MUST communicate:

- trust

- security

- professionalism

- intelligence

- premium quality

- calmness

- confidence

Use:

- strong primary colors

- refined neutrals

- restrained accent colors

- soft gradients

- breathable surfaces

Use gradients carefully.

Gradients should support hierarchy and atmosphere.

They must NOT overpower content.

---

# 16. ABSOLUTE PURPLE BAN

PURPLE IS STRICTLY FORBIDDEN.

Do NOT use:

- purple

- violet

- lavender

- indigo leaning toward purple

- magenta-purple

- blue-purple

- purple gradients

- purple shadows

- purple glow

- purple borders

- purple accents

Do not accidentally introduce purple through:

- chart palettes

- gradients

- hover states

- focus states

- illustrations

- third-party components

- default library themes

If a third-party library introduces purple automatically:

OVERRIDE IT.

Purple is not an acceptable fallback color.

---

# 17. COLOR DIRECTION

Prefer a sophisticated security-oriented palette built from combinations such as:

- deep navy

- charcoal

- graphite

- warm white

- off-white

- muted blue

- refined teal

- controlled cyan

- restrained green

- premium amber/gold for selected accents

Do not use all colors simultaneously.

Build a hierarchy.

The application must not look like a rainbow.

---

# 18. GRADIENT RULE

Gradients must be:

- subtle

- soft

- breathable

- low-noise

- premium

Avoid:

- neon gradients

- highly saturated gradients

- rainbow gradients

- purple gradients

- excessive glow

- cheap-looking gaming aesthetics

Gradients should support the interface rather than become the interface.

---

# 19. MINIMALISM

The design philosophy is:

MINIMALISM WITH DEPTH.

Not:

EMPTY UI.

Every visible element must have a reason to exist.

Remove unnecessary:

- borders

- icons

- labels

- decorations

- shadows

- buttons

- cards

- animations

Do not confuse "premium" with "more elements."

Premium design comes from:

- spacing

- typography

- hierarchy

- consistency

- restraint

- precision

---

# 20. PREMIUM UI

The application must feel:

HIGH CLASS  
PROFESSIONAL  
MATURE  
TRUSTWORTHY  
INTELLIGENT  
POLISHED

Avoid generic:

- Bootstrap-like dashboards

- template-looking cards

- excessive rounded rectangles

- random glassmorphism

- excessive neon

- excessive gradients

- childish illustrations

- gaming aesthetics

- excessive glow

Use visual depth selectively.

---

# 21. GLASS / BLUR EFFECTS

Glass-like surfaces may be used where they improve the visual hierarchy.

However:

Do not make the entire application glassmorphic.

Do not sacrifice:

- readability

- contrast

- performance

- accessibility

for visual effects.

Glass should be an accent, not the foundation of the entire design.

---

# 22. SHADOWS

Use shadows carefully.

Avoid huge:

- black shadows

- glowing shadows

- colored shadows

Prefer subtle elevation.

Cards should not look like floating blocks everywhere.

Use spacing and borders as primary hierarchy tools.

---

# 23. BORDER RADIUS

Use a consistent radius system.

Do not randomly mix:

4px  
7px  
11px  
17px  
23px  
29px

Define a small reusable radius scale.

The entire product should feel like one coherent system.

---

# 24. SPACING SYSTEM

Create a consistent spacing system.

Do not manually invent spacing values for every component.

Use design tokens.

Example concept:

xs  
sm  
md  
lg  
xl  
2xl

Maintain consistency across:

- cards

- forms

- sections

- navigation

- tables

- modals

- dashboards

---

# 25. TYPOGRAPHY HIERARCHY

Typography must clearly communicate:

- page title

- section title

- card title

- body

- metadata

- labels

- status

- supporting information

Avoid excessive font sizes.

Avoid excessive font weights.

Typography should feel calm and authoritative.

---

# 26. ICONOGRAPHY

Use Font Awesome as the primary icon system.

Do NOT mix:

- Font Awesome

- emojis

- random SVG icon packs

- Unicode symbols

- platform-specific icons

unless there is a documented technical reason.

Icons should have consistent:

- size

- alignment

- spacing

- visual weight

Do not use icons as decoration everywhere.

---

# 27. ABSOLUTE EMOJI BAN

DO NOT USE EMOJIS ANYWHERE IN THE PRODUCT UI.

This includes:

- buttons

- navigation

- cards

- notifications

- empty states

- alerts

- dashboards

- tables

- forms

- tooltips

- headings

- authentication pages

- error pages

Use Font Awesome icons instead.

Do not substitute emojis for proper UI icons.

---

# 28. NAVIGATION

Navigation must feel effortless.

Desktop:

- clear hierarchy

- active state

- hover state

- keyboard focus

- accessible labels

Mobile:

- accessible menu

- obvious open/close state

- smooth transition

- sufficient touch target size

- no accidental navigation

The current page must always be visually identifiable.

Do not use ugly permanent underlines as the primary active indicator.

Use a refined active state such as:

- background

- border

- subtle accent

- pill

- indicator

depending on the design.

---

# 29. MOBILE NAVIGATION

Mobile navigation must be treated as a first-class experience.

It must have:

- clear menu trigger

- clear close action

- accessible overlay

- body scroll handling

- keyboard support where applicable

- focus management

- smooth entrance/exit

- correct z-index behavior

When navigation closes, return focus appropriately.

---

# 30. TOUCH TARGETS

Interactive elements must have comfortable touch targets.

Avoid tiny buttons.

Do not place important actions too close together.

Ensure:

- buttons

- tabs

- filters

- close buttons

- menu items

- table actions

are usable with fingers.

---

# 31. MOBILE TABLES

Do NOT force massive desktop tables onto small screens.

Depending on the content, use:

- horizontal scrolling

- condensed columns

- expandable rows

- card/list layouts

- priority-based column hiding

The user must still be able to access important information.

---

# 32. MOBILE INVESTIGATION EXPERIENCE

Threat investigation is one of the most complex parts of the application.

On mobile:

Desktop:

Main content  

+ investigation side panel

may become:

Main content  
↓  
expandable investigation panel

or:

Main content  

+ full-screen investigation drawer.

Do not simply squeeze both panels into half-width columns.

---

# 33. CHARTS

Charts must be:

- responsive

- readable

- accessible

- meaningful

Avoid charts simply for decoration.

Every chart should answer a question.

Example:

"What is happening to threat activity?"

"Which severity dominates?"

"Which techniques are appearing most frequently?"

Use responsive chart dimensions.

---

# 34. THREAT GRAPH

The Threat Graph must remain usable on:

- desktop

- tablet

- mobile

Provide alternate ways of inspecting relationships.

If a complex graph is difficult to operate on mobile, provide:

- relationship list

- node details

- expandable connections

Do not force a desktop graph interaction model onto a phone.

---

# 35. UX COPY

The interface language must be:

- professional

- concise

- calm

- respectful

- human

Avoid:

- aggressive language

- fear-based messaging

- unnecessary technical jargon

- robotic copy

- meaningless placeholder text

For security warnings:

Be serious without creating unnecessary panic.

---

# 36. "CURIOSITY-BUILDING UI"

The product should create a natural desire to investigate.

The interface should make users think:

"What happened?"

"Why is this risky?"

"What is connected to this?"

"What happened next?"

"Why did the risk increase?"

"Which account is involved?"

"What does the evidence show?"

This must be achieved through:

- information hierarchy

- progressive disclosure

- meaningful summaries

- contextual relationships

- timelines

- visual correlation

- intelligent previews

NOT through:

- clickbait

- misleading notifications

- fake alerts

- artificial urgency

- deceptive UI

The goal is:

CURIOUS → INVESTIGATE → UNDERSTAND → ACT.

---

# 37. PERFORMANCE IS A DESIGN FEATURE

The application must feel fast.

Optimize:

- bundle size

- lazy loading

- route loading

- images

- fonts

- animations

- charts

- graph rendering

- data rendering

- unnecessary re-renders

Do not load large libraries for features that could be implemented efficiently without them.

---

# 38. THIRD-PARTY LIBRARIES

Third-party libraries are allowed when they genuinely improve:

- usability

- accessibility

- performance

- visualization

- interaction

- maintainability

But every dependency must be evaluated.

Before adding a library, consider:

- Is it actively maintained?

- Is it widely used?

- Is it compatible with the project?

- Does it have known vulnerabilities?

- Is the license appropriate?

- Is the bundle size reasonable?

- Does it introduce unnecessary dependencies?

- Can the feature be implemented more simply?

- Does it work correctly on mobile?

- Does it support accessibility?

- Does it introduce a default visual style that conflicts with our design system?

Do NOT install libraries simply because they look impressive.

---

# 39. DEPENDENCY SECURITY

Do not install random packages from unknown sources.

Prefer:

- established libraries

- reputable maintainers

- active projects

- well-documented packages

- appropriate licenses

Before introducing important dependencies:

review package health and security.

Run dependency/security audits regularly.

If a dependency has a known critical vulnerability:

DO NOT IGNORE IT.

Investigate:

- upgrade

- replacement

- mitigation

- removal

---

# 40. THIRD-PARTY VISUAL COMPONENTS

If a third-party component library is used:

DO NOT blindly accept its default theme.

Customize it to match the project's design system.

Remove:

- unwanted colors

- purple defaults

- inconsistent typography

- inconsistent radius

- excessive shadows

- inconsistent spacing

The application must still look like ONE PRODUCT.

---

# 41. NO DESIGN INCONSISTENCY

The following must NEVER randomly change between pages:

- button height

- button radius

- typography

- icon size

- spacing

- card radius

- input height

- shadows

- colors

- transitions

- active states

Create reusable components and tokens.

If two components perform the same type of action, they should look and behave consistently.

---

# 42. NO DEAD UI

Every visible interactive element must work.

Do not create:

- fake buttons

- decorative buttons

- dead navigation links

- fake filters

- fake dropdowns

- non-functional modals

- non-functional tabs

- meaningless controls

During frontend development, mock functionality where the backend does not exist yet.

But the interaction itself must work.

---

# 43. NO PLACEHOLDER UI

Do not leave:

"Lorem ipsum"

"Coming soon"

"Test"

"Button"

"Example"

"Lorem"

or obviously fake security information visible in the finished frontend.

Mock data should look realistic and professional.

Clearly separate mock architecture from production data.

---

# 44. VISUAL QA

After every major UI feature:

Test:

- desktop

- laptop

- tablet

- mobile

Test:

- hover

- click

- focus

- keyboard

- touch

- scrolling

- resizing

- orientation changes where appropriate

Look for:

- clipping

- overflow

- overlapping

- layout shifts

- broken animations

- unreadable text

- inaccessible controls

- inconsistent spacing

Fix issues before continuing.

---

# 45. BROWSER QA

Test the application in modern browsers where practical.

At minimum consider:

- Chromium-based browser

- Firefox

- Safari/WebKit where available

Do not assume Chromium behavior automatically represents all browsers.

---

# 46. ACCESSIBILITY QA

Test:

- keyboard navigation

- focus visibility

- screen-reader semantics where appropriate

- form labels

- dialog behavior

- contrast

- reduced motion

- touch interaction

Accessibility is not optional.

---

# 47. SEO

Although this is primarily an authenticated application, optimize appropriate public-facing pages.

Implement where relevant:

- semantic HTML

- meaningful title

- meta description

- canonical URLs where appropriate

- Open Graph metadata

- structured metadata where useful

- clean URLs

- robots configuration

- sitemap for public pages where appropriate

Do NOT attempt to expose private application pages to search engines.

Authenticated/private security data must not be indexable.

---

# 48. SECURITY + UX BALANCE

Security controls should not make the product unnecessarily painful to use.

The goal is:

SECURE + USABLE.

Examples:

Good:

"Your session will expire in 5 minutes. Continue session?"

Bad:

"SESSION INVALID."

Good:

"Additional verification is required because this sign-in is unusual."

Bad:

"ACCESS DENIED."

Security messages should explain enough for legitimate users without revealing sensitive security information.

---

# 49. FINAL UI QUALITY STANDARD

Before declaring the frontend complete, ask:

Does this look like a serious cybersecurity product?

Does it feel premium?

Does it feel trustworthy?

Does it feel fast?

Does it feel calm?

Does every interaction respond naturally?

Does mobile feel intentionally designed?

Does touch interaction work?

Does keyboard interaction work?

Are animations subtle and meaningful?

Is the UI consistent?

Is purple completely absent?

Are emojis completely absent?

Are icons consistent?

Are third-party components visually integrated?

Are there any dead interactions?

Are there any layout bugs?

Are there any overflow problems?

Are there any accessibility problems?

Are there any performance problems?

Are there any unnecessary visual effects?

If the answer to any of these is NO:

DO NOT DECLARE THE FRONTEND COMPLETE.

FIX IT FIRST.

---

# 50. FINAL DESIGN PHILOSOPHY

The final product should feel like:

A premium security command center.

Not:

a generic admin dashboard.

Not:

a colorful SaaS template.

Not:

a gaming interface.

Not:

an AI toy.

Not:

a portfolio demo.

The user should feel:

"I can trust this system."

"I understand what is happening."

"I can investigate quickly."

"I know what requires attention."

"The interface respects my time."

"The interface responds naturally."

"The product feels expensive."

"Everything has a purpose."

---

# ABSOLUTE RULES — NEVER VIOLATE

1. NO PURPLE.

2. NO PURPLE-RELATED COLORS.

3. NO EMOJIS.

4. NO RANDOM ICON LIBRARIES.

5. FONT AWESOME IS THE PRIMARY ICON SYSTEM.

6. GOOGLE FONTS FOR TYPOGRAPHY.

7. ANIME.JS FOR ANIMATION WHERE APPROPRIATE.

8. NO HOVER-ONLY IMPORTANT INTERACTIONS.

9. NO DESKTOP-ONLY UX.

10. NO MOBILE AFTERTHOUGHTS.

11. NO EXCESSIVE ANIMATIONS.

12. NO PERFORMANCE SACRIFICE FOR VISUAL EFFECTS.

13. NO UNNECESSARY THIRD-PARTY DEPENDENCIES.

14. NO UNSAFE OR UNTRUSTED LIBRARIES.

15. NO DEAD UI.

16. NO FAKE FUNCTIONALITY.

17. NO ACCESSIBILITY NEGLECT.

18. NO INCONSISTENT DESIGN PATTERNS.

19. NO RAW ERRORS EXPOSED TO USERS.

20. NO FINISHING A FEATURE WITHOUT TESTING IT.

21. NO DECLARING FRONTEND COMPLETE WHILE KNOWN UI/UX BUGS EXIST.

22. NO BACKEND DEVELOPMENT UNTIL THE FRONTEND QUALITY GATE PASSES.

The goal is not to make the UI "fancy."

The goal is to make it feel:

**EFFORTLESS.**

**INTELLIGENT.**

**PRECISE.**

**TRUSTWORTHY.**

**PREMIUM.**
