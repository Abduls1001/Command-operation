# CURRENT_STATE.md

**This file is the project's status pointer. It is updated at the end of every phase.**
If anything in this document contradicts your assumptions, this document is correct.

---

## Status

| | |
|---|---|
| **Current phase** | Phase 4 — Incidents UI |
| **Status** | **Complete** — Incidents list, filters/search/sort, and a detail route are live and built on their own static dataset |
| **Application code** | Dashboard and Incidents have real content; the other nine routes remain Phase 2 placeholders |
| **Next phase** | Phase 5 — Investigations UI |
| **Last updated** | Phase 4 completion |

---

## What Was Completed in Phase 4

`frontend/src/app/incidents/page.tsx` was replaced (no longer `PagePlaceholder`), and a new
route, `frontend/src/app/incidents/[id]/page.tsx`, was added.

**Data model** (`frontend/src/lib/mock/incidents.ts`) — the second isolated mock module in
the project (after Phase 3's `lib/mock/dashboard.ts`), per DECISIONS.md D-012:

- `Incident` type: `id`, `title`, `description`, `severity`, `status`, `source`,
  `affectedSystem`, `createdAt`/`updatedAt` (real ISO timestamps), `operationalContext`
- `IncidentStatus` = `open | investigating | awaiting_approval | resolved | closed`,
  matching the lifecycle status list in PROJECT_SPEC.md §7 exactly. This intentionally
  reads "Open" rather than the takeover brief's "Detected" label — Phase 3 already
  established `open → "Open"` for the Dashboard's incident badges, and PROJECT_SPEC.md §7
  is the authoritative domain vocabulary, so Phase 4 stayed consistent with both rather than
  introduce a second label for the same state. Recorded here per the project's own rule that
  a document conflict should be resolved in favour of the docs, not silently reinterpreted.
- `IncidentSeverity` = `critical | high | medium | low`
- `IncidentSource` = `Automated Monitoring | Customer Report | Manual Report | Deployment Alert`
- `AffectedSystem` — 8 named NovaCommerce systems. 7 of them reuse the exact names already on
  the Dashboard's System Status grid; the 8th, "Notification Service", is new — the incident
  categories named in DEVELOPMENT_PLAN's Phase 4 scope require it, but no System Status tile
  for it exists yet. Recorded as a known gap below, for whoever builds Systems & Tools.
- 9 hand-written incidents, one or more per category named in the Phase 4 brief (payment
  failure, checkout degradation, order delay, inventory sync, notification failure,
  website/API degradation, plus a deployment-canary and a support-backlog example), covering
  every severity, every status, and every source at least once. `INC-2031`, `INC-2030`, and
  `INC-2027` are the same three incidents already on the Dashboard (same id, title, severity)
  so the two pages agree and the Dashboard can link into a real detail page.
- `formatRelativeToDemoNow()` — formats an ISO timestamp against a fixed reference instant
  (`DEMO_NOW`, matching the Dashboard's "Last updated: Today at 9:42 AM"), not the real clock.
  This keeps every render deterministic while still sorting on genuine `Date` values rather
  than a hand-ordered array — closer to how a real API's timestamps will behave in Phase 10.
- `getIncidentById()` — the lookup the detail route uses; returns `undefined` for an unknown
  id, which the route turns into Next's standard not-found page.

**Components created** (`frontend/src/components/incidents/`):

- `IncidentSeverityBadge.tsx`, `IncidentStatusBadge.tsx` — severity/status → `Badge` variant,
  scoped to the Incidents domain's own types (kept separate from Phase 3's
  `components/dashboard/statusStyles.ts` deliberately, so the two feature areas don't import
  each other's internals)
- `IncidentSummaryCard.tsx` — one of the five overview numbers (Total, Active, Critical,
  Investigating, Resolved)
- `IncidentFilters.tsx` — search input, status/severity/affected-system selects (combinable),
  a sort select, and a conditional "Clear filters" button; purely presentational, the page
  owns the state
- `IncidentTable.tsx` — the list, built on `TableShell` (Phase 2's structural table primitive,
  which had no consumer until now — see the note carried in this file since Phase 2)
- `IncidentDetail.tsx` — the detail view: the incident's current record, plus six clearly
  labeled placeholder cards (Investigation, Evidence, Root Cause, Recommended Action,
  Approval, Resolution) reusing the same `Badge variant="accent"` + `EmptyState` +
  `ClockIcon` "Coming in a later phase" pattern Phase 2 established, so an unbuilt section
  looks the same everywhere in the app

**Routes:**

- `frontend/src/app/incidents/page.tsx` — replaced; the list, summary cards, filters, search,
  and sort
- `frontend/src/app/incidents/[id]/page.tsx` — new; the detail route, `async` (Next 16 passes
  dynamic `params` as a `Promise`), calls `notFound()` for an unrecognised id

**Search, filter, and sort** — all client-side, against the static `INCIDENTS` array, no
network call:

- Search matches `id`, `title`, `description`, and `affectedSystem`, case-insensitively
- Status, severity, and affected-system filters combine with each other and with search
  (all are simple `Array.filter` predicates ANDed together)
- Sort: Newest first (default), Oldest first, Severity (highest first, ties broken by
  newest) — all real comparisons against `createdAt`/severity rank, not a fixed order
- Summary cards are computed once from the full `INCIDENTS` array via `useMemo` and do not
  change when the list below is filtered — an overview that shifted with the filters would
  be more confusing than useful, and this way the numbers can never contradict the dataset
- Empty state: "No incidents match your current filters." with a "Clear filters" action,
  using the existing `EmptyState` primitive

**Incident detail:** implemented as a dedicated route (`/incidents/[id]`) rather than a
modal, per Phase 3's own note anticipating this ("that page doesn't exist until Phase 4") and
consistent with the project being one application with real routes per PROJECT_SPEC.md §6.
Shows id, title, description, severity, status, affected system, source, created/updated
time, and a short operational-context note, followed by the six lifecycle placeholders
listed above. No investigation, evidence, or action logic runs anywhere on this page.

**Dashboard integration (small, in-scope):** `components/dashboard/IncidentSummary.tsx` had
each row wrapped in a `next/link` to `/incidents/[id]`, per Phase 4's explicit
"navigation from Dashboard into an incident" scope item. No data in
`lib/mock/dashboard.ts` was changed — this was a template-only edit, and the ids it already
used (`INC-2031`, `INC-2030`, `INC-2027`) now resolve to real detail pages because Phase 4's
dataset defines the same ids.

**Data rule honored:** no calls to PostgreSQL, FastAPI, an LLM, the NovaCommerce simulation,
or n8n. The backend was not touched. "Create Incident" is a static button with a `title`
tooltip noting it's UI-only — it has no click handler.

**Testing results:**

- `npm run build` — compiles clean; `/incidents/[id]` correctly reported as a dynamic (ƒ)
  route, every other route still static (○)
- `npm run lint` — zero warnings, zero errors
- Dev server manually verified: every existing route still returns its expected status
  (`/` → 307, the eleven nav pages → 200, an unmapped path → 404); `/incidents/INC-2031` →
  200, `/incidents/INC-9999` (unknown id) → 404
- `/incidents` HTML confirmed to contain: all five summary labels, the "Create Incident"
  button, the search placeholder, every filter's "All …" option, "Newest first", and all
  nine incident ids
- `/incidents/INC-2031` HTML confirmed to contain: the back link, the incident's title, the
  operational-context heading, and all six lifecycle placeholder titles with their
  "Coming in a later phase" badge
- Dashboard HTML confirmed to now contain a real `href="/incidents/INC-2031"` link
- Summary-card math cross-checked against the dataset independently (Total 9, Active 5,
  Critical 2, Investigating 2, Resolved 2) — matches what the page's own `useMemo` computes,
  so the cards cannot contradict the list
- No console errors surfaced; no new dependencies were installed

**Known issues / carried-forward gaps:**

- "Notification Service" (used as `INC-2029`'s affected system) has no corresponding tile on
  the Dashboard's System Status grid. Not a defect of this phase — Systems & Tools, which
  should own each system's canonical capability/health list, hasn't been built yet. Whoever
  builds Systems & Tools should reconcile this list with `AFFECTED_SYSTEMS` in
  `lib/mock/incidents.ts`.
- The Incidents list and the Dashboard's incident summary are two separate mock modules that
  happen to agree on three ids by hand (`INC-2031`, `INC-2030`, `INC-2027`). This is
  intentional for Phase 4 — Phase 3's module was already shipped and out of this phase's file
  boundary — but Phase 10 (real API) should serve both pages from one source so they can't
  drift apart the way two hand-maintained arrays eventually could.
- No pagination on the Incidents table. Not needed at 9 rows; worth revisiting if/when the
  mock dataset (or the real one in Phase 10) grows substantially.

---

## What Was Completed in Phase 3

`frontend/src/app/dashboard/page.tsx` was replaced. It no longer renders
`PagePlaceholder`; it renders the real Dashboard, reusing the Phase 2 shell,
design tokens, and UI primitives (`PageContainer`, `Card`, `Badge`)
unchanged.

**Sections built**, per DEVELOPMENT_PLAN.md's Phase 3 scope:

1. **Page header** — "Operations Dashboard" title, a short description, and
   a static "Last updated" placeholder.
2. **KPI cards** (`KpiCard`) — four reusable cards: Active Incidents,
   Revenue Today, Orders Today, System Health. Each shows a headline value
   and a trend/delta line (an up/down glyph plus a comparison string), not
   just a bare number.
3. **Operational Health** (`OperationalHealth`) — a compact, quick-glance
   strip for the four systems most relevant to the current demo scenario
   (Payment System, Website, Order Processing, Inventory), each with a
   status dot and a one-line detail.
4. **Active Incidents** (`IncidentSummary`) — three static incidents, each
   with ID, title, severity badge, status badge, detection time, and a short
   description. No drill-through, since `/incidents/[id]` doesn't exist
   until Phase 4 (explicitly out of scope for Phase 3).
5. **AI Activity** (`AiActivity`) — a static vertical timeline of six
   activity entries (investigation started → evidence collected ×2 → root
   cause identified → recommendation generated → waiting for approval),
   all UI only. No real AI runs.
6. **System Status** (`SystemStatus`) — a detailed grid covering all seven
   NovaCommerce systems named in PROJECT_SPEC.md §3 (Storefront & Checkout,
   Order Management, Payment Processing, Inventory Management, Customer
   Support, Website Health & Uptime, Deployment Pipeline), each with a
   status badge, uptime, response time, and last-checked time.

All six sections describe one coherent scenario — a payment-gateway
incident in progress — so the Dashboard reads as a real snapshot rather
than six disconnected widgets, per Phase 3's "done when" criterion.

**Components created** (`frontend/src/components/dashboard/`):

- `KpiCard.tsx`
- `OperationalHealth.tsx`
- `IncidentSummary.tsx`
- `AiActivity.tsx`
- `SystemStatus.tsx`
- `statusStyles.ts` — shared status/severity → `Badge` variant mappings, so
  every dashboard component colors the same status the same way

**Mock data module** (`frontend/src/lib/mock/dashboard.ts`) — the first mock
module in the project, per DECISIONS.md D-012. All Dashboard data (KPIs,
operational health, incidents, AI activity, system status, the "last
updated" string) lives here as typed, hand-written static values — nothing
random. Components import from this module and contain no inline literals
of their own. This is the file Phase 10 will delete and replace with real
API calls; the exported types are written as that future contract.

**Data rule honored:** no calls to PostgreSQL, FastAPI, an LLM, or the
NovaCommerce simulation. The backend was not touched.

**Testing results:**

- `npm run build` — compiles clean, zero TypeScript errors, all thirteen
  routes (eleven pages + `/` + `/_not-found`) prerender as static content
- `npm run lint` — zero warnings, zero errors
- Dev server manually verified: `/dashboard` returns HTTP 200 and its HTML
  contains every new section ("Operations Dashboard", "Active Incidents",
  "Operational Health", "AI Activity", "System Status", and incident
  `INC-2031`); root `/` still 307-redirects to `/dashboard`; all ten other
  routes still return 200 with their Phase 2 placeholder; an unmapped path
  still 404s
- No console errors surfaced; no new dependencies were installed (still
  only `next`, `react`, `react-dom` in `dependencies`)

**Known issues:** none. The sidebar's "Dashboard" nav item and the header's
derived title both continue to work unchanged, since neither `navigation.ts`
nor any shell file was modified.

---

## What Was Completed in Phase 2

- Reusable application shell: `AppShell` composes a `Sidebar`, a `Header`, and
  a main content region — the frame every page now renders inside
- Sidebar with all eleven navigation links, correct active-route state
  (`aria-current="page"`), a desktop collapse toggle (icon-only rail), and a
  mobile off-canvas drawer with a backdrop
- Header that derives the current page title from the route, plus a
  NovaCommerce status indicator and a static profile placeholder (no
  authentication, as scoped)
- The project's visual language decided and encoded as CSS custom properties
  in `globals.css`: a light neutral content theme with a fixed-dark sidebar,
  an indigo accent, and reserved status colors for later phases
- Five reusable UI primitives — `PageContainer`, `Card`, `Badge`,
  `EmptyState`, `TableShell` — matching the primitives DEVELOPMENT_PLAN.md
  names for Phase 2
- Eleven placeholder route pages, one per page in PROJECT_SPEC.md §6, each
  rendering inside the shell with its title, its PROJECT_SPEC description,
  and a "Coming in a later phase" placeholder
- Root route (`/`) now redirects to `/dashboard`, the documented default
  landing page
- Hand-drawn inline SVG icons for the sidebar — no icon library was
  installed, since none existed already and the phase scope said not to add
  one unless necessary
- Verified: production build passes, ESLint passes with zero warnings, all
  eleven routes return HTTP 200, the root redirect returns 307 to
  `/dashboard`, an unmapped path returns 404, and the correct nav item
  carries the active marker on every route

---

## What Was Completed in Phase 1

- Repository skeleton created, with `frontend/` and `backend/` as physically separate
  top-level applications
- Git repository initialised; `.gitignore` covering Node, Python, Next.js, and env files
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 scaffolded and running
- A minimal starter page confirming the frontend serves — **not** the Dashboard
- FastAPI application with a modular package structure
- `GET /health` returning the expected JSON
- CORS configured so the frontend origin can reach the backend
- `.env.example` template with no real secrets
- Root `README.md` with setup and run instructions

---

## What Exists

```
ai-operations-command-center/
│
├── frontend/                       Next.js 16 · TypeScript · Tailwind v4
│   ├── src/app/
│   │   ├── layout.tsx              Root layout — wraps children in AppShell
│   │   ├── page.tsx                Root route — redirects to /dashboard
│   │   ├── globals.css             Design tokens: the Phase 2 visual language
│   │   ├── favicon.ico
│   │   ├── dashboard/page.tsx       Phase 3 — real Dashboard content
│   │   ├── incidents/page.tsx       Phase 4 — real Incidents list
│   │   ├── incidents/[id]/page.tsx  Phase 4 — incident detail route
│   │   ├── investigations/page.tsx  Placeholder
│   │   ├── actions/page.tsx         Placeholder
│   │   ├── approvals/page.tsx       Placeholder
│   │   ├── systems/page.tsx         Placeholder (Systems & Tools)
│   │   ├── knowledge-base/page.tsx  Placeholder
│   │   ├── analytics/page.tsx       Placeholder
│   │   ├── reports/page.tsx         Placeholder
│   │   ├── audit-logs/page.tsx      Placeholder
│   │   └── settings/page.tsx        Placeholder
│   ├── src/components/layout/
│   │   ├── AppShell.tsx            Composes Sidebar + Header + content region
│   │   ├── Sidebar.tsx             Nav, active state, collapse, mobile drawer
│   │   ├── Header.tsx              Page title, mobile menu trigger, profile
│   │   ├── PagePlaceholder.tsx     Shared "coming later" body, all 11 pages use it
│   │   ├── navigation.ts           Single source of truth: the 11 nav items
│   │   └── icons.tsx               Hand-drawn inline SVG icons — no dependency
│   ├── src/components/ui/
│   │   ├── PageContainer.tsx       Width-constraining wrapper
│   │   ├── Card.tsx                Bordered surface panel
│   │   ├── Badge.tsx               Status pill, 6 variants
│   │   ├── EmptyState.tsx          Centered "nothing here" content
│   │   └── TableShell.tsx          Structural table chrome — first used in Phase 4
│   ├── src/components/dashboard/   Phase 3 — Dashboard-only components
│   │   ├── KpiCard.tsx
│   │   ├── OperationalHealth.tsx
│   │   ├── IncidentSummary.tsx     Phase 4: rows now link to /incidents/[id]
│   │   ├── AiActivity.tsx
│   │   ├── SystemStatus.tsx
│   │   └── statusStyles.ts         Shared status/severity → Badge mappings
│   ├── src/components/incidents/   Phase 4 — Incidents-only components
│   │   ├── IncidentSeverityBadge.tsx
│   │   ├── IncidentStatusBadge.tsx
│   │   ├── IncidentSummaryCard.tsx
│   │   ├── IncidentFilters.tsx
│   │   ├── IncidentTable.tsx
│   │   └── IncidentDetail.tsx
│   ├── src/lib/mock/
│   │   ├── dashboard.ts            Phase 3 — isolated mock data (D-012)
│   │   └── incidents.ts            Phase 4 — isolated mock data (D-012)
│   ├── public/                     Empty (.gitkeep)
│   ├── AGENTS.md / CLAUDE.md       Auto-generated by next dev — see Notes
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   └── .gitignore
│
├── backend/                        Python 3.12 · FastAPI — untouched this phase
│   ├── app/
│   │   ├── main.py                 Entry point, CORS, router registration
│   │   ├── core/config.py          Env-based configuration
│   │   └── api/routes/health.py    GET /health
│   ├── requirements.txt            fastapi, uvicorn[standard] — nothing else
│   └── venv/                       Local only, git-ignored
│
├── docs/
│   ├── PROJECT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT_PLAN.md
│   ├── DECISIONS.md
│   └── CURRENT_STATE.md            ← you are here
│
├── .env.example
├── .gitignore
└── README.md
```

---

## What Does Not Exist

Stated explicitly so no session assumes otherwise:

- The Dashboard (`/dashboard`) and Incidents (`/incidents`, `/incidents/[id]`)
  have real content as of Phase 3 and Phase 4. The other nine pages are
  unchanged — still the same "Coming in a later phase" placeholder, per
  their own title and description
- No charts, no investigation content, evidence, root cause, recommendation,
  approval, or action logic anywhere (Phase 5 onward) — the Incidents detail
  page's six lifecycle sections are labeled placeholders only
- No incident creation — the Incidents page's "Create Incident" button has
  no handler
- No mock data for Investigations, Actions, Approvals, Systems & Tools,
  Knowledge Base, Analytics, Reports, or Audit Logs yet — only
  `lib/mock/dashboard.ts` and `lib/mock/incidents.ts` exist so far; each
  later UI phase adds its own isolated module per DECISIONS.md D-012
- No database, no PostgreSQL connection, no SQLAlchemy, no models, no migrations
- No AI agent, no LLM integration, no tools
- No NovaCommerce simulation
- No authentication — the header's "Operator" profile is a static placeholder
- No Docker configuration
- No tests
- No API endpoints other than `GET /health`
- No frontend-to-backend calls — CORS is configured, but nothing uses it yet
- No backend files were touched this phase

---

## How to Run

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Serves on `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Serves on `http://localhost:3000`. It redirects to `http://localhost:3000/dashboard`.

### Verify the shell

With the frontend running, open `http://localhost:3000` in a browser. It should redirect
to the Dashboard. Confirm:

- The sidebar lists all eleven pages and highlights the current one
- Clicking each sidebar link loads that page, with a matching header title and a
  "Coming in a later phase" placeholder
- The collapse button (desktop, bottom of sidebar) shrinks it to an icon-only rail
- Below the `lg` breakpoint, the sidebar hides and the header's menu button opens it as
  an overlay drawer

### Verify the health endpoint

```bash
curl http://localhost:8000/health
```

```json
{ "status": "ok", "service": "ai-operations-command-center-backend" }
```

---

## Notes and Known Issues

**No known defects.** Both applications build, lint, and run clean.

Phase 2 additions, worth knowing:

4. **The sidebar theme is fixed-dark, independent of the content area's theme.** This was
   a deliberate design choice for a "command center" product (see the comment block at
   the top of `globals.css`), not an oversight. It does not follow the reader's OS
   light/dark preference.

5. **No icon library was installed.** None existed after Phase 1, and the task scope said
   not to add a large one unless necessary. `icons.tsx` has eleven small hand-drawn inline
   SVGs instead.

6. **Components live under `src/components/`, not `frontend/components/`.** The Phase 2
   brief's example path was `frontend/components/layout/...`; this project put
   `src/` under `frontend/` in Phase 1 (`create-next-app --src-dir`), so components follow
   that existing convention instead, at `frontend/src/components/`.

7. **`TableShell` has no consumer yet.** It exists because DEVELOPMENT_PLAN.md lists a
   table shell as Phase 2 scope. It is structural chrome only — no columns, no data — and
   the first page to actually use it will be Incidents (Phase 4).

Three things carried over from Phase 1:

1. **No webfont.** The Next.js scaffold ships with Geist loaded via `next/font/google`. It
   was removed in favour of a system font stack, so the build requires no network access.
   Typography is a Phase 2 decision; pinning a typeface in Phase 1 would have been the right
   choice made in the wrong phase. Phase 2 may adopt a webfont deliberately.

2. **`frontend/AGENTS.md` and `frontend/CLAUDE.md` are generated by `next dev`.** They are
   regenerated automatically whenever the dev server runs, so deleting them is pointless.
   They are Next.js tooling artifacts, not project documentation. Leave them tracked; ignore
   their contents.

3. **`globals.css` is not a design decision.** It holds a background/foreground variable pair
   and nothing else. The project's visual language — palette, type scale, spacing — is
   decided in Phase 2, because those choices propagate through six subsequent UI phases.

---

## How to Continue

### Before implementing anything

A session picking up this project must read all five documents first, in this order:

1. **`PROJECT_SPEC.md`** — what the system is, the core workflow, the eleven pages, and the
   domain vocabulary. Pay particular attention to §7: the distinctions between Incident and
   Investigation, and between Recommendation and Action, are precise and load-bearing.

2. **`ARCHITECTURE.md`** — the layering, the agent's position, the tool layer, and the data
   flows. §9 lists the architectural invariants. Those are not guidelines.

3. **`DEVELOPMENT_PLAN.md`** — the phase you are about to build, its scope, and — equally
   important — what it explicitly excludes.

4. **`DECISIONS.md`** — why the stack and the structure are what they are. If you are about
   to do something differently, the reasoning against it is probably already recorded here.

5. **`CURRENT_STATE.md`** — this file. Where the project actually stands, which may differ
   from what the plan anticipated.

Reading these is not a formality. The documents encode decisions that are expensive to
rediscover and easy to accidentally contradict.

### The working cycle

```
  Read the five documents
        ↓
  Confirm the phase scope — what's in, what's out, which files change
        ↓
  Implement only what the phase names
        ↓
  Test locally in VS Code
        ↓
  Fix until it actually works
        ↓
  Commit to Git, with a message naming the phase
        ↓
  Update CURRENT_STATE.md
        ↓
  STOP
```

### Rules that apply to every phase

Do **not**:

- Rewrite the whole project
- Refactor code unrelated to the current phase
- Rename unrelated files
- Move unrelated folders
- Modify modules outside the current task
- Mix frontend and backend logic
- Touch the database or AI layers unless the phase explicitly calls for it
- Install dependencies the phase does not require
- Continue into the next phase automatically

If you notice a problem outside the current scope: **note it, do not fix it.** Record it in
DECISIONS.md under Open Questions, or mention it in the final report. Fixing it costs the
integrity of the phase boundary, which is the one thing holding this project together.

### Updating this file

At the end of each phase, update the status table, **What Exists**, **What Does Not Exist**,
and the **Phase Log**. Keep it accurate. A stale CURRENT_STATE.md is worse than none,
because it will be trusted.

---

## Phase Log

| Phase | Name | Status | Notes |
|---|---|---|---|
| 0 | Project Blueprint | ✅ Complete | Five planning documents. No code. |
| 1 | Project Foundation | ✅ Complete | Frontend + backend run. `GET /health` verified. |
| 2 | Website Shell | ✅ Complete | All 11 routes live, shell verified, build + lint clean. |
| 3 | Dashboard UI | ✅ Complete | Real Dashboard built on static mock data; build + lint clean. |
| 4 | Incidents UI | ✅ Complete | List + filters/search/sort + detail route; build + lint clean. |
| 5 | Investigations UI | ⬜ Not started | Next. |
| 6 | Approvals UI | ⬜ Not started | |
| 7 | Actions UI | ⬜ Not started | |
| 8 | Reports UI | ⬜ Not started | |
| 9 | NovaCommerce Simulation | ⬜ Not started | |
| 10 | Backend & Database | ⬜ Not started | |
| 11 | AI Agent Foundation | ⬜ Not started | |
| 12 | Investigation Tools | ⬜ Not started | |
| 13 | Agentic Investigation | ⬜ Not started | |
| 14 | Approval + Action + Verification | ⬜ Not started | |
| 15 | Professionalization | ⬜ Not started | |
| 16 | Testing & Deployment | ⬜ Not started | |

---

## Next Phase Preview — Phase 5: Investigations UI

Summarised here so the next session knows the target without hunting for it. The full
definition is in `DEVELOPMENT_PLAN.md`. This is called out there as the most important UI
phase — the one that distinguishes this project from a CRUD application.

**Goal:** make the AI's reasoning legible — a reader should be able to follow the chain of
evidence to the conclusion and judge for themselves whether it's warranted.

**In scope:**
- Investigation timeline: ordered steps, each showing the agent's reasoning, the tool
  invoked, and the evidence returned
- Evidence display, attributed to source system and time
- Findings and root cause presentation, with an honestly-shown confidence level
- Link back to the parent incident
- Representation of an investigation still in progress
- Mock data extended — a new, isolated `lib/mock/investigations.ts`-style module (per
  DECISIONS.md D-012)

**Out of scope:** running a real investigation, recommendations, approvals.

**Done when:** a reader can follow the agent's chain of reasoning and judge for themselves
whether the conclusion is warranted. Design note from DEVELOPMENT_PLAN.md: the failure mode
is a wall of JSON — the goal is a narrative a human can read.

**Note:** `IncidentDetail`'s "Investigation" placeholder card (this phase) is exactly where
Phase 5's real content will go — replacing the placeholder, not adding a new section. Phase 5
should also decide how an Investigation refers back to its Incident: `lib/mock/incidents.ts`
does not currently carry an `investigationId` field or similar, since Phase 4 had no
investigation data to link to yet.

---

## Known Risks Carried Forward

Flagged so they are not discovered late.

**Phase 2 — the visual language.** Decisions made in the shell propagate through six
subsequent UI phases. Changing them in Phase 7 is expensive.

**Phases 3–8 — mock data isolation.** Mock data must live behind a small number of obvious
per-domain modules. Scattered inline through components, it turns Phase 10 into a rewrite.
See DECISIONS.md D-012.

**Phase 9 — causal coupling.** If the NovaCommerce subsystems are independent generators,
there is nothing real for the agent to discover and every later phase demonstrates nothing.
The payment fault must genuinely propagate to orders, revenue, and complaints — and must be
reversible, so Verification has something true to check.

**Phase 13 — genuine agency.** A fixed sequence with agent vocabulary is not an agent. The
test: inject a different fault, such as an inventory problem, and confirm the agent takes a
different path.

**Phase 14 — the reopen path.** A system that only handles successful verification is
demonstrating optimism. Failed verification must reopen the incident.
