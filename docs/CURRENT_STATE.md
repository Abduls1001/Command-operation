# CURRENT_STATE.md

**This file is the project's status pointer. It is updated at the end of every phase.**
If anything in this document contradicts your assumptions, this document is correct.

---

## Status

| | |
|---|---|
| **Current phase** | Phase 12 — AI Agent Tools Layer (**Phase 12 completed**) |
| **Status** | **Complete (implementation)** — Reports list, summary cards, search, four combinable filters, and a full report detail view (executive summary, incident, investigation, evidence, root cause, recommendation, approval, action, verification & outcome, timeline, report actions) are live on their own static dataset. **Not build-verified** — see the testing note below |
| **Application code** | Dashboard, Incidents, Investigations, Approvals, Actions, and Reports have real content; the other five routes remain Phase 2 placeholders |
| **Next phase** | Phase 13 — AI Agent Foundation (LLM + tool calling) |
| **Last updated** | Phase 12 completion |

---

## What Was Completed in Phase 12

**Phase 12 — AI Agent Tools Layer: Completed.** Six read-only Python functions the future AI
agent will call to look at NovaCommerce data. No LLM, agent loop, actions or approvals yet.
Phase 11 API, `requirements.txt`, database schema, models, Phase 9 simulation and the frontend
were not changed.

- **Tools** (`app/tools/novacommerce_tools.py`, exported from `app/tools/__init__.py`):
  `get_orders`, `get_payments`, `get_products`, `get_inventory`, `get_complaints`,
  `get_health_metrics`. Each takes optional `limit` (1–2000, default 50) and `offset`, returns a
  JSON-serializable list of dicts, and has a docstring describing its fields (these become the
  LLM tool descriptions later). A `TOOLS` dict maps name → function.
- **How they get data** — they call the Phase 11 query functions (`app/db/queries.py`) through
  the existing session (`app.db.session.get_db`) and serialize with the existing response
  schemas, so a tool returns exactly what the matching `GET /api/...` endpoint returns. No new
  models, connection or data. Database errors propagate as exceptions
  (`DatabaseNotConfigured`, SQLAlchemy `OperationalError`); the agent layer will handle them.
- **Validation** — `cd backend && python -m app.tools.validate` (read-only, exit 0 = pass).
- **Files:** new `app/tools/__init__.py`, `app/tools/novacommerce_tools.py`,
  `app/tools/validate.py`; modified `docs/CURRENT_STATE.md`.

**Tested (real local PostgreSQL 16, database `nova_commerce`, not re-seeded):** 36 checks, all
pass. For each of the six tools: record count equals the database row count (orders 1494,
payments 1494, products 12, inventory 12, complaints 51, health metrics 1392), output survives a
JSON round-trip, output is identical to the matching REST endpoint, default limit is 50,
`limit`/`offset` paging is correct, `limit=0` is rejected. Also checked: tools raise
`OperationalError` (database unreachable) and `DatabaseNotConfigured` (no settings); all seven
Phase 11 endpoints still return 200; Phase 9 validation exits 0. The same tool validation also
passed in a scratch environment with SQLAlchemy 2.1.1 (project pin unchanged).

**Known limitations:** tools can only page, not filter (no date range, status or id lookup yet —
the agent will need these for efficient investigation; adding them means extending
`queries.py`, a Phase 11 file); no automated test suite beyond the validation script; tested on
Python 3.12 (sandbox), not 3.14; `backend/requirements.txt` still pins `sqlalchemy==2.0.36` from
Phase 10 although the dev environment runs 2.1.x (left untouched as instructed).

---

## What Was Completed in Phase 11

**Phase 11 — Backend API Layer: Completed.** The read-only NovaCommerce API started in Phase 10
was finished and hardened. Frontend, Phase 9 simulation and database models were not changed.
(Scope note: the original roadmap called Phase 11 "AI Agent Foundation"; the Phase 11 brief was
redefined as this API layer, so the agent work moves to Phase 12.)

- **APIs implemented** — `GET /health` (unchanged) and `GET /api/orders`, `/products`,
  `/payments`, `/inventory`, `/complaints`, `/health-metrics`. Pydantic response schemas;
  `limit` (1–2000, default 50) and `offset` paging; newest first. Swagger at `/docs`.
- **Changes this phase** — SQL moved out of the routes into `app/db/queries.py`;
  `/api/system-health` renamed to `/api/health-metrics`; max `limit` raised from 500 to 2000 so
  a full table can be fetched in one call; new `DatabaseNotConfigured` exception; `main.py`
  handlers turn database problems into HTTP **503** JSON (not configured, unreachable, or tables
  missing / seed not run) instead of a 500 stack trace. `/health` still returns 200 and reports
  the `database` state.
- **Files:** new `app/db/queries.py`; modified `api/routes/novacommerce.py`, `db/session.py`,
  `main.py`, `docs/CURRENT_STATE.md`.

**Tested (real local PostgreSQL 16, database `nova_commerce`, uvicorn over HTTP):** seed loaded;
`/health` 200 with `database: ok`; `/docs` 200 and OpenAPI lists all seven paths; all six `/api`
endpoints returned HTTP 200 with JSON, row counts read from the database: orders 1494,
products 12, payments 1494, inventory 12, complaints 51, health-metrics 1392 (orders and
health-metrics also cross-checked against `psql` counts). Failure modes: no DB config → 503,
DB unreachable → 503, empty database without tables → 503; `/health` stayed 200 in all three.
Phase 9 validation: exit 0, 14 PASS, 0 FAIL.

**Known limitations:** no filters, sorting options, single-record lookups or aggregates yet; no
authentication (out of scope); no automated test suite (checks were run by hand); no migrations
(`create_all` in the seed); I did not open `/docs` in a browser, only confirmed it serves 200 and
lists the routes.

---

## What Was Completed in Phase 10

**Phase 10 — Backend & Database: Completed.** The Phase 9 NovaCommerce simulation can now be
loaded into PostgreSQL and read back through FastAPI. Frontend untouched; still mock data.

- **PostgreSQL connection** — `core/config.py` reads `DATABASE_URL` or `POSTGRES_*` from the
  environment (repo-root `.env` loaded via python-dotenv). No credentials in code; with nothing
  configured the app still starts and DB routes fail cleanly. `db/session.py` creates the
  engine lazily and provides the per-request `get_db` dependency.
- **SQLAlchemy models** (`app/db/models.py`) — eight `nc_`-prefixed tables mirroring the Phase 9
  dataclasses: customers, products, orders, order_items, payments, inventory, complaints,
  health_metrics. Relationships: Customer → Orders, Order → Items, Order → Payment (one-to-one),
  Item → Product → Inventory, Customer/Order → Complaints. Tables are created with
  `create_all` (no migrations yet).
- **NovaCommerce seed** — `cd backend && python -m app.db.seed [--seed 42]` creates the tables
  and loads `generate_novacommerce_data()`. Re-runnable (replaces NovaCommerce rows only).
  Seed 42: 150 customers, 12 products, 1,494 orders, 2,979 order items, 1,494 payments,
  12 inventory rows, 51 complaints, 1,392 health metrics.
- **Basic API** — `GET /health` (now also reports `database`: ok / unavailable /
  not_configured; `status` stays liveness-only) and read-only `GET /api/orders`, `/products`,
  `/payments`, `/inventory`, `/complaints`, `/health-metrics` (renamed from `/system-health` in Phase 11). Newest first, `limit` (1–500,
  default 50) and `offset` only. No filters, no writes.
- **Dependencies added** (`requirements.txt`): sqlalchemy 2.0.36, psycopg[binary] 3.2.3,
  python-dotenv 1.0.1 (already a transitive dependency of uvicorn[standard]).
- **Files:** new `app/db/{__init__,session,models,seed}.py`, `app/api/schemas.py`,
  `app/api/routes/novacommerce.py`; modified `core/config.py`, `main.py`,
  `api/routes/health.py`, `requirements.txt`, `.env.example`. No Phase 9 simulation file and no
  frontend file was changed.

**Validation (real PostgreSQL 16, local instance):** tables created; seed loaded and re-ran
cleanly; row counts equal the simulation's; relationship traversal works in both directions;
in the database every payment status agrees with its order status and every order total equals
its item sum; payment failure rate is 2.1% before vs 25.8% in the 06:00–12:00 problem window.
All six `/api` endpoints and `/health` returned database rows over live HTTP (uvicorn);
`limit=9999` is rejected with 422. With no DB config `/health` reports `not_configured`, with an
unreachable DB `unavailable`. `python -m app.simulation.validate` still passes (all checks).

**Known issues / notes:**

- No automated test suite; verification was scripted checks run by hand.
- Frontend build/lint still unverified for Phases 7–8 (unchanged from before; not in scope).
- No migrations (Alembic) — schema changes need a manual drop/recreate until one is added.
- `/api/*` returns HTTP 500 when the database is not configured or reachable.
- Command Center tables (incidents, investigations, …) do not exist yet.

---

## What Was Completed in Phase 9

**Phase 9 completed.** NovaCommerce simulation data and the payment gateway degradation
scenario were added as a small, dependency-free package: `backend/app/simulation/`.

- `models.py` — typed dataclasses: Customer, Product, Order/OrderItem, Payment,
  InventoryRecord, Complaint, HealthMetric, and the `NovaCommerceData` container
- `generator.py` — `generate_novacommerce_data(seed=42, scenario=True)`; stdlib
  `random.Random`, so the same seed gives identical data. 15 days of hourly history
  (2026-09-15 → 2026-09-29 12:00 UTC): 150 customers, 12 products, ~1k orders
- `metrics.py` — `compute_metrics()` (orders, revenue, successful/failed payments, failure
  rate, complaints) and `compare_to_baseline()` (problem window vs. per-day average of the
  same hours over the prior 7 days)
- `validate.py` — `cd backend && python -m app.simulation.validate`

**Scenario:** on 2026-09-29 06:00–12:00 the PayFlow gateway fails ~27% of payments
(baseline ~2%). Effects are causal: failed payment → order `payment_failed` (no revenue) →
possible complaint; gateway health metrics are derived from the actual payments. Other
systems stay healthy. Reversal/backup-gateway recovery and other scenarios are **not** built.

**Validation (seed 42, 06:00–12:00):** normal vs. problem — orders 32.7 vs 31, successful
payments 31.6 vs 23, revenue 6,584 vs 4,316, payment failures 1.1 vs 8 (3.5% vs 25.8%),
complaints 0.7 vs 2. Failures ↑, successful orders ↓, revenue ↓, complaints ↑; all
relationship checks pass.

**Not done / notes:** no API endpoints, database, frontend integration, or new dependencies;
the Phase 3–8 mock figures (27% / -34% / -18.4%) are approximated, not matched exactly.
Complaint counts in a 6-hour window are small-sample. FastAPI was not installed in this
environment, so `app.main` was not re-imported (untouched).

---

## What Was Completed in Phase 8

`frontend/src/app/reports/page.tsx` was replaced (no longer `PagePlaceholder`), and a new
route, `frontend/src/app/reports/[id]/page.tsx`, was added. Nothing outside the Reports
domain was modified — no Phase 2–7 file, no backend file, no dependency.

**Data model** (`frontend/src/lib/mock/reports.ts`) — the sixth isolated mock module in the
project, per DECISIONS.md D-012:

- `Report` type: `id`, `incidentId`, optional `investigationId`, `title`, `summary`,
  `severity`, `status`, `outcome`, `createdAt`/`updatedAt` (ISO), plus the section payloads:
  `executiveSummary`, `incident`, optional `investigation`, `evidence`, optional `rootCause`,
  optional `recommendation`, optional `approval`, optional `action`, `verification`, and
  `timeline`
- `ReportStatus` = `draft | under_review | completed | archived`; `ReportOutcome` =
  `resolved | resolved_without_action | unresolved | in_progress`. Outcome is deliberately
  **not** the same field as `verification.status`: verification says whether one action
  worked, the outcome says how the incident as a whole finished (`REP-5007` is the case that
  proves the distinction — its action verified as *failed*, but the incident was still
  resolved, by other means)
- Section types: `ExecutiveSummary` (the five questions a report must answer, structured
  rather than one prose blob), `ReportIncidentSummary`, `ReportInvestigationSummary`,
  `ReportEvidenceItem` (label/value **plus the source system**), `ReportRootCause`,
  `ReportRecommendation`, `ReportApprovalSummary`, `ReportActionSummary`,
  `ReportVerification`, `ReportEvent`
- Severity, confidence, risk, and verification vocabularies are reused from Phases 4/5/6/7 as
  **type-only** imports (`IncidentSeverity`, `IncidentStatus`, `AffectedSystem`,
  `ConfidenceLevel`, `InvestigationStatus`, `InvestigationStage`, `RiskLevel`,
  `VerificationStatus`), so none of those files was modified and a severity means the same
  thing on a report as on the incident it describes
- Like Approval (Phase 6) and Action (Phase 7), a Report *references* the records that
  produced it by id rather than being a sixth restatement under new field names. It does
  carry its own summary prose — executive summary, business impact, key findings — because
  that text is written for the report and exists nowhere else
- 8 hand-written reports, one per incident with a story worth recording, covering every
  status (draft ×2, under review ×2, completed ×2, archived ×2), every outcome, and four
  severities. Every report's content agrees with the earlier datasets — verified
  programmatically (see Testing), including that each report's `severity`, incident `status`,
  and `affectedSystem` match the Phase 4 incident record exactly
- `REP-5004` (certificate renewal) is the clean end-to-end example: detection → investigation
  → root cause → recommendation → approval → action → passed verification → resolved.
  `REP-5005` resolved without any action. `REP-5006` is honest about an inconclusive
  investigation and a rejected rollback — it has no `rootCause` at all, and the UI says so
  rather than inventing one. `REP-5007` is the failed-verification case
- `getReportById()`, `RESOLVED_OUTCOMES` (the outcomes the "Resolved" card counts), and
  `formatReportTimestamp()` — absolute, UTC-pinned dates, because a report is read long after
  the fact, unlike the live queues' relative labels

**Components created** (`frontend/src/components/reports/`):

- `ReportStatusBadge.tsx` (also exports `ReportOutcomeBadge`), `ReportSeverityBadge.tsx`,
  `ReportVerificationBadge.tsx` (also exports `ReportConfidenceBadge`) — scoped to the
  Reports domain, per the per-domain badge convention every previous phase followed
- `ReportSummaryCard.tsx` — one of the four overview numbers
- `ReportFilters.tsx` — search plus four combinable selects; presentational only
- `ReportTable.tsx` — the list on the shared `TableShell` primitive; root cause shown as its
  one-line summary so the row stays readable
- `ReportHeader.tsx` — masthead: id, title, standfirst, status/severity/outcome badges,
  incident and investigation links, created/updated dates
- `ExecutiveSummary.tsx` — the five structured questions
- `ReportIncidentSummary.tsx` — named for the domain because `IncidentSummary` is already the
  Dashboard's active-incident component, which this has nothing to do with
- `ReportInvestigationSummary.tsx` — id/status/stage/duration/key findings, with an honest
  "no investigation record" state for incidents handled without one
- `ReportEvidenceSummary.tsx` — the simulated figures, each attributed to its source system
- `RootCauseSummary.tsx` — the visually distinct tinted conclusion panel (the same `ring`
  treatment Phase 5 used, rather than a border-colour override), with a confidence badge and
  supporting-evidence references; says so plainly when no root cause was established
- `RecommendationSummary.tsx`, `ApprovalSummary.tsx`, `ActionSummary.tsx` — each with an
  honest empty state for reports where that step never happened
- `VerificationSummary.tsx` — expected/observed/verification time plus a called-out Final
  Outcome block; a failed verification is shown as plainly as a passed one
- `ReportTimeline.tsx` — the full lifecycle in one column, with absolute timestamps
- `ReportActions.tsx` — View Incident / Investigation / Approval / Action links (all real,
  all destinations exist). **Export / Print Report is a disabled placeholder** carrying the
  same "Coming in a later phase" badge the Phase 2 placeholders use: the brief rules out PDF
  generation and printing logic, so rather than wire up a control that half-works, it has no
  click handler at all

**Routes:**

- `frontend/src/app/reports/page.tsx` — replaced; the list, summary cards, search, filters
- `frontend/src/app/reports/[id]/page.tsx` — new; the detail view, `async` (Next 16 passes
  dynamic `params` as a `Promise`), calls `notFound()` for an unrecognised id

**Search and filters** — all client-side, against the static `REPORTS` array:

- Search matches `id`, `incidentId`, `investigationId`, `title`, the root-cause summary, and
  the final outcome, case-insensitively
- Status, severity, outcome, and verification-status filters all combine with each other and
  with search
- Summary cards are computed once via `useMemo` from the full array, independent of the list
  filters: Total Reports 8, Resolved 4, Pending Review 2, Critical Incidents 2 — verified
  independently against the dataset
- Empty state: "No reports match your current filters." with a "Clear filters" action

**Data rule honored:** no calls to PostgreSQL, FastAPI, an LLM, the NovaCommerce simulation,
or n8n. No report is generated, no PDF is produced, no document is printed, nothing is
persisted. The backend was not touched, and no dependency was added or changed
(`package.json`/`package-lock.json` untouched).

**Testing results — read the limitation first:**

> **This phase could not be build-verified, for the same reason Phase 7 could not.** The
> environment has no network access, so `npm install` fails (registry 403) and `node_modules`
> does not exist. `npm run build`, `npm run lint`, and `npm run dev` could **not** be run, and
> no page was rendered in a browser or fetched over HTTP. Whoever picks this up should run
> `npm install && npm run lint && npm run build` and click through `/reports` — and the five
> earlier pages — before treating Phases 7 and 8 as verified.

What *was* verified, statically:

- The dataset was executed directly under Node (type-stripping) and its derived numbers
  confirmed: 8 reports; Total 8, Resolved 4, Pending Review 2, Critical Incidents 2 — exactly
  what the four summary cards compute. Status spread draft 2 / under review 2 / completed 2 /
  archived 2; outcomes in progress 3 / resolved 2 / resolved without action 2 / unresolved 1
- All report ids unique; every timeline chronological with unique event ids; no duplicate
  evidence labels within a report; `updatedAt` never before `createdAt`; incident `closedAt`
  never before `detectedAt`; action `completedAt` never before `startedAt`; every root-cause
  supporting-evidence reference resolves to an actual evidence item in the same report
- Every `incidentId`, `investigationId`, approval id, and action id referenced was checked
  against the Phase 4/5/6/7 datasets — all resolve, no dangling references
- Each report's `severity`, incident `status`, and `affectedSystem` were compared field by
  field against the Phase 4 incident record: all eight match exactly
- `getReportById()` returns the right record for a known id and `undefined` for an unknown
  one; `formatReportTimestamp()` renders an em dash for an absent timestamp
- `lib/mock/reports.ts` type-checks clean under a standalone `tsc --strict`
- The whole Phase 8 surface (16 components + both routes + the data module) was type-checked
  under `tsc --strict` against minimal hand-written stubs for `react`/`next`. It reported only
  `TS7006` implicit-`any` on `select` `onChange` handlers — a stub artifact, confirmed again
  by a control run including Phase 6's `ApprovalFilters.tsx`, which builds clean in the real
  project and produced the identical error on the identical pattern
- No Phase 0–7 file was modified: only `src/app/reports/page.tsx` (replaced),
  `src/app/reports/[id]/page.tsx` (new), `src/components/reports/*` (new),
  `src/lib/mock/reports.ts` (new), and this document

**Known issues / carried-forward gaps:**

- **No build, lint, or runtime verification was possible** (see the block above). Still the
  one real gap, now across two phases.
- The "Verification: Pending" filter option matches nothing in the current dataset — a report
  is written after verification has finished, so no report sits at `pending`. Selecting it
  exercises the empty state, which is arguably useful, but it is worth deciding in Phase 10
  whether that option should exist at all.
- Reports are not linked *from* the Incidents, Investigations, Approvals, or Actions detail
  pages — the links all point one way, into the earlier records. Adding the reverse link
  means editing Phase 4–7 components, outside this phase's file boundary. Now that the whole
  chain exists in mock form, this is the obvious small follow-up for whoever next has those
  pages in scope, and it would also close the Phase 5/6/7 notes below about the Incident
  detail page's unlinked lifecycle placeholders.
- `REP-5006`'s `createdAt` is 09:52, after the shared `DEMO_NOW` instant of 09:42, because it
  follows `APR-3004`'s decision time of 09:50 — which was already future-dated in Phase 6's
  dataset. Kept consistent with that existing record rather than silently diverging from it;
  the relative-time helper renders it as "Just now". Worth normalising whenever Phase 6's
  data is next touched.
- No pagination on the Reports table. Not needed at 8 rows.

---

## What Was Completed in Phase 7

`frontend/src/app/actions/page.tsx` was replaced (no longer `PagePlaceholder`), and a new
route, `frontend/src/app/actions/[id]/page.tsx`, was added. Nothing outside the Actions
domain was modified — no Phase 2–6 file, no backend file, no dependency.

**Data model** (`frontend/src/lib/mock/actions.ts`) — the fifth isolated mock module in the
project, per DECISIONS.md D-012:

- `Action` type: `id`, `incidentId`, optional `investigationId`, optional `approvalId`,
  `title`, `description`, `actionType`, `affectedSystem`, `riskLevel`, `status`, `reason`,
  `expectedOutcome`, `evidenceSummary` (concise bullets), `approvalRequired`, optional
  `approvedBy`, `executor`, optional `executionNote`, `requestedAt` plus optional
  `approvedAt`/`startedAt`/`completedAt` (all ISO), `verification`, and `timeline`
- `ActionStatus` = `pending_approval | approved | executing | completed | failed | cancelled`;
  `VerificationStatus` = `not_started | pending | passed | failed`; `ActionType` is a small
  closed list (Traffic Failover, Data Re-sync, Integration Pause, Deployment Rollback, Batch
  Retry, Capacity Scaling, Configuration Change, Certificate Renewal, Cache Purge)
- `ActionVerification` (`status`, `expectedResult`, optional `observedResult`, optional
  `verifiedAt`) and `ActionEvent` (`id`, `timestamp`, `title`, `description`)
- `riskLevel` reuses Phase 6's `RiskLevel` and `affectedSystem` reuses Phase 4's
  `AffectedSystem` — both **type-only** imports, so neither of those files was modified and a
  risk level or a system means the same thing on an action as on the approval it came from
- Like Phase 6's Approval, an Action is a thin record that *references* what produced it
  rather than re-stating it. Every `incidentId`, `investigationId`, and `approvalId` in the
  dataset resolves to a real record in `lib/mock/incidents.ts`,
  `lib/mock/investigations.ts`, and `lib/mock/approvals.ts` — verified programmatically, see
  Testing below — and every action's state agrees with the approval behind it: the three
  actions whose approvals are still `pending` are `pending_approval`; the action behind the
  rejected `APR-3004` is `cancelled`; the two behind approved `APR-3005`/`APR-3006` are
  `completed`
- Some low-risk actions carry **no** `approvalId`. They fall below the configurable approval
  threshold DEVELOPMENT_PLAN Phase 14 describes, and are marked `approvalRequired: false`
  with an explicit `approvedBy` ("Automatic — below the approval threshold") so the UI never
  implies a human reviewed something no human saw. This was the smallest honest way to show
  `approved` and `executing` states without inventing approval records that Phase 6's dataset
  doesn't contain — recorded as a deliberate choice, not an oversight
- 10 hand-written actions covering every status, every verification status, four risk levels
  and seven affected systems: switch payment traffic to the backup gateway, manual inventory
  re-sync, pause the notification integration, increase sync frequency, scale the
  order-processing worker pool, retry a failed order-sync batch, renew a TLS certificate,
  purge a stale CDN cache (failed execution), re-run support auto-triage (executed cleanly
  but **failed verification**), and roll back a canary deployment (cancelled)
- `ACT-4006` is the flagship end-to-end example, and its timeline matches the Phase 7 brief's
  worked example exactly: recommendation created → human approval received → execution
  started → execution completed → verification passed
- `ACTION_LIFECYCLE_STAGES` (Recommended → Approval → Approved → Execution → Verification →
  Completed) and `lifecycleIndexOf()`, which reads the current node from the action's own
  static status. A `completed` action that has not been verified stops at Verification rather
  than claiming the final node — "executed" and "confirmed working" are different claims
- `getActionById()` (the detail route's lookup; `undefined` for an unknown id) and
  `formatDuration()`, which returns `undefined` rather than a fabricated figure when an
  action hasn't finished

**Components created** (`frontend/src/components/actions/`):

- `ActionStatusBadge.tsx`, `ActionRiskBadge.tsx`, `ActionVerificationBadge.tsx` — scoped to
  the Actions domain, kept separate from the other domains' badges per existing convention
- `ActionSummaryCard.tsx` — one of the five overview numbers
- `ActionFilters.tsx` — search plus four combinable selects; presentational only, the page
  owns the state
- `ActionTable.tsx` — the list, on the shared `TableShell` primitive, with a coloured left
  edge per row so pending / approved / executing / completed / failed are distinguishable at
  a glance without reading each badge
- `ActionHeader.tsx` — "Action Information": id, title, description, links to the related
  incident / investigation / approval, affected system, action type, risk, status,
  verification, requested/approved times
- `ActionLifecycle.tsx` — the six-node lifecycle stepper, current stage highlighted; recolors
  for `failed` ("Stopped at this stage") and `cancelled`, and flags a completed action whose
  verification failed
- `ActionContext.tsx` — why the action was recommended, expected outcome, related evidence
  summary, affected system, risk. Concise structured content only — no hidden model
  chain-of-thought, per the brief
- `ActionExecution.tsx` — execution status, started/completed times, duration, executor,
  approval requirement, and any execution note; labeled "Simulated / demo data", with unset
  values shown as "—" rather than invented figures
- `ActionVerificationPanel.tsx` — verification status, expected result, observed result,
  verification time; a failed verification is called out as the case that should reopen an
  incident rather than close it. Named `...Panel` because `ActionVerification` is already the
  type name in the mock module
- `ActionTimeline.tsx` — the chronological action history, using the same vertical-timeline
  treatment as `InvestigationTimeline`
- `ActionControls.tsx` — View Incident / View Investigation / View Approval links, plus the
  demo-only **Execute Action** button, shown only for an `approved` action. It is a local
  `useState` flag and nothing more: no backend call, no database write, no n8n trigger, no
  LLM call, no real operation. It labels itself as a demo interaction and offers a reset

**Routes:**

- `frontend/src/app/actions/page.tsx` — replaced; the list, summary cards, search, filters
- `frontend/src/app/actions/[id]/page.tsx` — new; the detail view, `async` (Next 16 passes
  dynamic `params` as a `Promise`), calls `notFound()` for an unrecognised id

**Search and filters** — all client-side, against the static `ACTIONS` array:

- Search matches `id`, `title`, `incidentId`, `investigationId`, `approvalId`, and
  `affectedSystem`, case-insensitively
- Status, risk-level, affected-system, and verification-status filters all combine with each
  other and with search (simple `Array.filter` predicates ANDed together)
- Summary cards are computed once via `useMemo` from the full array, independent of the list
  filters, matching every previous phase: Pending Actions 3, Approved 1, Executing 1,
  Completed 3, Failed 1 — verified independently against the dataset (see Testing)
- Empty state: "No actions match your current filters." with a "Clear filters" action

**Data rule honored:** no calls to PostgreSQL, FastAPI, an LLM, the NovaCommerce simulation,
or n8n. No real action is executed anywhere. The backend was not touched, and no dependency
was added or changed (`package.json`/`package-lock.json` untouched).

**Testing results — read the limitation first:**

> **This phase could not be build-verified.** The environment this session ran in has no
> network access, so `npm install` fails (the registry returns 403) and `node_modules` does
> not exist. That means `npm run build`, `npm run lint`, and `npm run dev` could **not** be
> run, and no page was rendered in a browser or fetched over HTTP. Every previous phase
> verified itself that way; this one could not. Whoever picks this up should run
> `npm install && npm run lint && npm run build` and click through `/actions` before treating
> Phase 7 as verified.

What *was* verified, statically:

- The dataset was executed directly under Node (type-stripping) and its derived numbers
  confirmed: 10 actions; Pending Approval 3, Approved 1, Executing 1, Completed 3, Failed 1,
  Cancelled 1 — exactly what the five summary cards compute; verification statuses Not
  Started 6, Pending 1, Passed 2, Failed 1, so all four verification states render somewhere
- All ids unique; every `requestedAt → approvedAt → startedAt → completedAt` sequence is in
  chronological order; every `verifiedAt` falls after its `completedAt`; every timeline is in
  chronological order with unique event ids
- `lifecycleIndexOf()` returns a valid stage for all ten actions, and `getActionById()`
  returns the right record for a known id and `undefined` for an unknown one
- Every `incidentId`, `investigationId`, and `approvalId` referenced was checked against the
  Phase 4/5/6 datasets: all resolve, no dangling references, and every investigation↔incident
  pairing matches Phase 5's own pairing. Every `affectedSystem` is a member of Phase 4's
  `AFFECTED_SYSTEMS`
- `lib/mock/actions.ts` type-checks clean under a standalone `tsc --strict`
- The whole Phase 7 surface (10 components + both routes + the data module) was type-checked
  under `tsc --strict` against minimal hand-written stubs for `react`/`next` (the real type
  packages aren't installed). It reported only `TS7006` implicit-`any` on `select`
  `onChange` handlers — a stub artifact: a control run including Phase 6's
  `ApprovalFilters.tsx`, which builds clean in the real project, produced the identical error
  on the identical pattern. No other error was reported
- No Phase 0–6 file was modified: only `src/app/actions/page.tsx` (replaced),
  `src/app/actions/[id]/page.tsx` (new), `src/components/actions/*` (new),
  `src/lib/mock/actions.ts` (new), and this document

**Known issues / carried-forward gaps:**

- **No build, lint, or runtime verification was possible** (see the block above). This is the
  one real gap in this phase and it should be closed first.
- The Approvals detail page does not yet link forward to the action it produced, the way the
  Action detail page links back to its approval. Left alone deliberately — linking forward
  would mean editing a Phase 6 component, outside this phase's file boundary. Worth adding
  once Reports (Phase 8) exists and the whole chain has a destination at both ends.
- The Incident detail page's "Recommended Action," "Approval," and "Resolution" lifecycle
  placeholders still don't link into the matching approval or action. Same reasoning as
  above, and now genuinely possible — a good small task for whoever next has Incidents in
  scope.
- Low-risk auto-approved actions (`approvalRequired: false`) have no Approvals-page
  counterpart, by design. If Phase 14 makes the approval threshold real, that behaviour
  should be driven by the threshold rather than by a hand-set flag in the mock data.
- No pagination on the Actions table. Not needed at 10 rows.

---

## What Was Completed in Phase 6

`frontend/src/app/approvals/page.tsx` was replaced (no longer `PagePlaceholder`), and a new
route, `frontend/src/app/approvals/[id]/page.tsx`, was added.

**Data model** (`frontend/src/lib/mock/approvals.ts`) — the fourth isolated mock module in the
project, per DECISIONS.md D-012:

- `Approval` type: `id`, `incidentId`, optional `investigationId`, `title`, `description`,
  `requestedAction`, `reason`, `relevantEvidence` (concise bullets), `observedImpact`,
  `expectedBenefit`, `riskConsiderations`, `evidenceSummary` (`EvidenceMetric[]` —
  label/value demo figures), `potentialDownside`, `riskLevel`, `status`, `affectedSystem`
  (reuses the `AffectedSystem` type from `lib/mock/incidents.ts` — a type-only import, that
  file was not modified), `requestedBy`, `requestedAt`/`expiresAt` (ISO), and an optional
  `decision` (`ApprovalDecision`: `decision`, `decisionBy`, `decisionAt`, `comment`) for
  entries already decided in the demo dataset
- `ApprovalStatus` = `pending | approved | rejected | expired`; `RiskLevel` = `critical |
  high | medium | low`
- Per CURRENT_STATE.md's own Phase 6 preview note, an `Approval` is a thin wrapper around a
  Recommendation rather than a re-statement under new field names: `APR-3001` (→ `INV-1042` /
  `INC-2031`, switch to backup payment gateway) and `APR-3002` (→ `INV-1041` / `INC-2030`,
  manual inventory re-sync) are the two pending approvals built directly from the two
  investigations already sitting at `awaiting_approval`, carrying over their real
  action/reason/evidence rather than inventing new ones
- 7 hand-written approvals total, covering every status (`pending` ×3, `approved` ×2,
  `rejected` ×1, `expired` ×1) and every risk level, across realistic NovaCommerce actions:
  switch payment traffic to backup gateway, manual inventory re-sync, pause a faulty
  notification integration, roll back a canary deployment, retry a stalled order-sync batch,
  renew a TLS certificate, restart the storefront web tier
- `getApprovalById()` — the lookup the detail route uses; returns `undefined` for an unknown
  id, which the route turns into Next's standard not-found page
- `formatExpiry()` — a small local helper, deliberately **not** reusing Phase 5's
  `formatRelativeToDemoNow()` (`lib/mock/time.ts`, imported read-only for its shared
  `DEMO_NOW` constant): that helper assumes the timestamp already happened and mislabels a
  still-open future expiry window as "Just now." `formatExpiry()` handles the future case
  explicitly ("Expires in 56 minutes") instead.

**Components created** (`frontend/src/components/approvals/`):

- `ApprovalStatusBadge.tsx`, `ApprovalRiskBadge.tsx` — scoped to the Approvals domain's own
  types, kept separate from the Incidents/Investigations domains' badge components on purpose
- `ApprovalSummaryCard.tsx` — one of the four overview numbers (Pending Approval, High Risk,
  Approved Today, Rejected Today)
- `ApprovalFilters.tsx` — search input plus combinable status/risk-level/affected-system
  selects; purely presentational, the page owns the state
- `ApprovalTable.tsx` — the queue list, built on the same `TableShell` primitive
  Incidents/Investigations use
- `ApprovalHeader.tsx` — detail-page header: id, title, incident/investigation links,
  status/risk badges, requested-by, requested/expiry times (the brief's "Request Information")
- `ApprovalContext.tsx` — "Recommendation Context": relevant evidence bullets, observed
  impact, expected benefit, risk considerations — concise structured findings only, no hidden
  model chain-of-thought
- `ApprovalEvidence.tsx` — "Evidence Summary": the simulated numeric metrics (e.g. payment
  failure rate, revenue impact), explicitly labeled "Demo / static figures"
- `ApprovalRiskImpact.tsx` — "Risk & Impact": risk level, expected impact, potential
  downside, affected system
- `ApprovalDecision.tsx` — "Recommended Action" plus the only interactive part of the page:
  demo Approve/Reject buttons, a simple confirmation step ("Approve/Reject this operational
  action?") with an optional decision comment, and the Audit Preview (Decision, Decision By,
  Decision Time, Decision Comment). All of this is local `useState` only — it never calls a
  backend, never writes back to `lib/mock/approvals.ts`, and never executes anything. A
  "Reset demo decision" control (shown only after a decision made in the current session)
  makes that local-only choice reversible, since nothing was persisted in the first place.

**Routes:**

- `frontend/src/app/approvals/page.tsx` — replaced; the queue, summary cards, search, and
  filters
- `frontend/src/app/approvals/[id]/page.tsx` — new; the detail/review workspace, `async`
  (Next 16 passes dynamic `params` as a `Promise`), calls `notFound()` for an unrecognised id

**Search and filters** — all client-side, against the static `APPROVALS` array:

- Search matches `id`, `title`, `incidentId`, `requestedAction`, and `affectedSystem`,
  case-insensitively
- Status, risk-level, and affected-system filters combine with each other and with search
- Summary cards are computed once via `useMemo` from the full array, independent of the list
  filters, matching the Incidents/Investigations pattern: Pending Approval (3), High Risk —
  critical + high combined (3), Approved Today (1), Rejected Today (1), where "Today" means
  the same UTC calendar day as the shared `DEMO_NOW` instant — verified independently against
  the dataset and matching the rendered HTML exactly
- Empty state: "No approvals match your current filters." with a "Clear filters" action

**Approval detail/review workspace** (`/approvals/[id]`), all pieces the brief asked for:
Request Information (header), Recommendation Context, Evidence Summary, Risk & Impact,
Recommended Action, demo Approve/Reject with confirmation, and an Audit Preview. No approval,
evidence, or decision logic runs anywhere — all of it is static, hand-written content, and
the interactive decision state is explicitly local-only and clearly labeled as such in the UI.

**Data rule honored:** no calls to PostgreSQL, FastAPI, an LLM, the NovaCommerce simulation,
or n8n. The backend was not touched. No new dependencies were installed
(`package-lock.json` is byte-identical before and after `npm install`).

**Testing results:**

- `npm run build` — compiles clean; `/approvals/[id]` correctly reported as a dynamic (ƒ)
  route alongside `/incidents/[id]` and `/investigations/[id]`, every other route still
  static (○)
- `npm run lint` — zero warnings, zero errors
- Dev server manually verified: every existing route still returns its expected status
  (`/` → 307, all nav pages → 200, an unmapped path → 404); `/approvals/APR-3001` → 200,
  `/approvals/APR-9999` (unknown id) → 404
- `/approvals` HTML confirmed to contain all four summary labels, the "Pending human review"
  indicator, every filter's "All …" option, and all seven approval ids
- Summary-card numbers cross-checked against the dataset independently (Pending 3, High Risk
  3, Approved Today 1, Rejected Today 1) and matched the rendered HTML exactly
- `/approvals/APR-3001` (pending, critical risk) HTML confirmed to contain Approve/Reject
  controls, Recommendation Context, Evidence Summary, Risk & Impact, and the Audit Preview
  section
- `/approvals/APR-3004` (a demo entry already `rejected` in the static data) HTML confirmed
  to show its pre-filled decision (decision-by "J. Alvarez", a decision comment) and no
  Approve/Reject controls, since it isn't `pending`
- Confirmed Dashboard, Incidents, and Investigations pages still render their expected
  content, and the sidebar's five built-page links (Dashboard, Incidents, Investigations,
  Actions, Approvals) are all present in the rendered Approvals page
- No errors in the dev server log during any of the above requests
- Manual interactive testing of the Approve/Reject buttons, the confirmation step, and the
  "Reset demo decision" control was reasoned through the component's logic and verified via
  the rendered HTML for each state (default pending, and the two demo-decided approvals) —
  a real browser click-through was not performed in this environment; noted below as a gap
- No new dependencies were installed; `package-lock.json` confirmed byte-identical before and
  after `npm install`

**Known issues / carried-forward gaps:**

- The interactive Approve → confirm → Approved (and Reject → confirm → Rejected) client-side
  state transitions were verified by reasoning through `ApprovalDecision.tsx`'s logic and by
  rendering each resulting state directly (via the pre-decided demo entries `APR-3004`,
  `APR-3005`, `APR-3006`), rather than by driving a real browser. Worth a manual click-through
  in a browser before considering this fully verified.
- `lib/mock/approvals.ts` imports `AffectedSystem` (type-only) from `lib/mock/incidents.ts`
  and `DEMO_NOW` (value) from `lib/mock/time.ts`, rather than duplicating either — unlike
  Phase 5's deliberate duplication of `DEMO_NOW` itself. This was judged the smaller change:
  neither import requires modifying the Phase 4/5 files themselves, and re-deriving a third
  independent "current moment" or a ninth-system list would have been a bigger deviation from
  D-012's "no scattered mock data" spirit than one read-only cross-module import.
- No pagination on the Approvals table. Not needed at 7 rows.
- The Incident detail page's "Approval" lifecycle placeholder (see Phase 4/5 notes below)
  does not yet link into a matching incident's approval the way "Investigation" links into
  its investigation. Left as-is to keep this phase's change surface to the Approvals domain
  only, per the strict file-boundary instructions for this phase; worth revisiting once
  Actions (Phase 7) exists and there's a full picture of what an incident's lifecycle cards
  should point to.

---

## What Was Completed in Phase 5

`frontend/src/app/investigations/page.tsx` was replaced (no longer `PagePlaceholder`), and a
new route, `frontend/src/app/investigations/[id]/page.tsx`, was added.

**Data model** (`frontend/src/lib/mock/investigations.ts`, `frontend/src/lib/mock/time.ts`) —
the third isolated mock module in the project, per DECISIONS.md D-012:

- `Investigation` type: `id`, `incidentId`, `title`, `status`, `stage`, `startedAt`/`updatedAt`
  (ISO), optional `confidence`, `timeline: TimelineEvent[]`, `evidence: EvidenceItem[]`,
  `findings: Finding[]`, optional `rootCause: RootCause`, optional
  `recommendation: Recommendation`
- `InvestigationStatus` = `running | completed | awaiting_approval | failed | paused`
- `InvestigationStage` = `initializing | collecting_evidence | analyzing |
  root_cause_identified | recommendation_ready | awaiting_approval | completed` — exactly the
  seven stages named in the Phase 5 brief
- `TimelineEvent` (`timestamp`, `title`, `description`, optional `source`), `EvidenceItem`
  (`title`, `source`, `collectedAt`, `observation`, `relevance`), `Finding` (`observation`,
  `analysis`, `relatedEvidenceIds` — the explicit link back to the evidence a finding draws
  on), `RootCause` (`summary`, `explanation`, `confidence`, `supportingEvidenceIds`),
  `Recommendation` (`action`, `reason`, `expectedEffect`, `approvalRequired`)
- `PROGRESS_STAGES` (the seven-node lifecycle: Started → Evidence Collection → Analysis →
  Root Cause → Recommendation → Approval → Resolution, per the brief's diagram) and
  `STAGE_TO_PROGRESS_INDEX`, a 1:1 mapping from each `InvestigationStage` to its position on
  that stepper
- `lib/mock/time.ts` — a small shared `DEMO_NOW` constant and `formatRelativeToDemoNow()` /
  `formatClockTime()` helpers, deliberately **not** imported from Phase 4's
  `lib/mock/incidents.ts` (which has its own copy of the same logic) so that this phase's file
  boundary ("do not unnecessarily modify Phase 4 Incidents") stays honored. Both copies use
  the identical `DEMO_NOW` instant, so the two pages still agree on "now" — recorded here as a
  small, deliberate duplication rather than a shared dependency.
- 7 hand-written investigations, each tied by `incidentId` to a real incident from Phase 4
  (`INC-2031`, `INC-2030`, `INC-2028`, `INC-2026`, `INC-2027`, `INC-2029`, `INC-2023`),
  covering every status and a spread of stages. `INV-1042` (tied to `INC-2031`) is the
  flagship example: it follows PROJECT_SPEC.md §5's worked payment-gateway scenario end to
  end — a 10-step timeline, 5 evidence items, 3 findings, a high-confidence root cause, and a
  recommendation awaiting approval — and its content is a direct elaboration of the AI
  Activity feed already on the Dashboard (Phase 3) for the same incident. Investigations still
  at an earlier stage (`INV-1040`, `INV-1037`, `INV-1036`) deliberately have no `rootCause` or
  `recommendation` yet, and the detail page says so rather than inventing one. Two incidents
  (`INC-2025`, `INC-2024`) have no investigation at all, to exercise that state too.

**Components created** (`frontend/src/components/investigations/`):

- `InvestigationStatusBadge.tsx`, `InvestigationStageBadge.tsx` (also exports
  `ConfidenceBadge`) — scoped to the Investigations domain's own types, kept separate from
  the Incidents and Dashboard domains' badge components on purpose
- `InvestigationSummaryCard.tsx` — one of the four overview numbers (Total, Running,
  Completed, Awaiting Approval)
- `InvestigationFilters.tsx` — search input plus combinable status/stage selects
- `InvestigationTable.tsx` — the list, built on the same `TableShell` primitive Incidents uses
- `InvestigationHeader.tsx` — detail-page header: id, title, a link back to the related
  incident, status/stage badges, started/updated times
- `InvestigationProgress.tsx` — the seven-node lifecycle stepper (Started → … → Resolution),
  highlighting the current stage; recolors the current node red/amber when the investigation's
  status is `failed`/`paused` so the stepper doesn't imply normal progress when there isn't any
- `InvestigationTimeline.tsx` — chronological event list with an optional per-event tool/source
  label, labeled "Simulated"
- `EvidenceList.tsx` — factual observations with a relevance badge, labeled "Simulated
  observations" per the brief's explicit instruction not to imply real systems produced them
- `FindingsPanel.tsx` — interpretation drawn from evidence, each finding showing which
  evidence items it draws on (as small badges), kept visibly distinct from the Evidence
  section above it
- `RootCausePanel.tsx` — the visually distinct conclusion area (tinted background + ring,
  not a conflicting border-color override — see the code comment on why `ring` was used
  instead of `border-accent`), with a confidence badge and supporting-evidence list; shows an
  honest "not yet identified" state for investigations that haven't reached this stage
- `RecommendationPanel.tsx` — action/reason/expected-effect, an "Approval Required" badge, and
  an explicit note that nothing here executes anything; also shows a "not yet reached" state
  when appropriate

**Routes:**

- `frontend/src/app/investigations/page.tsx` — replaced; the list, summary cards, search,
  and filters
- `frontend/src/app/investigations/[id]/page.tsx` — new; the detail workspace, `async`
  (Next 16 passes dynamic `params` as a `Promise`), calls `notFound()` for an unrecognised id

**Search and filters** — all client-side, against the static `INVESTIGATIONS` array:

- Search matches `id`, `incidentId`, and `title`, case-insensitively
- Status and stage filters combine with each other and with search
- Summary cards are computed once via `useMemo` from the full array, independent of the list
  filters, for the same reason as Phase 4's Incidents summary cards — verified independently
  against the dataset (Total 7, Running 1, Completed 2, Awaiting Approval 2), matching what
  the page itself renders
- Empty state: "No investigations match your current filters." with a "Clear filters" action

**Investigation detail workspace** (`/investigations/[id]`), all seven pieces the brief asked
for:

1. **Header** — id, title, related-incident link (into Phase 4's `/incidents/[id]`),
   status/stage badges, started/updated times
2. **Progress** — the seven-stage stepper, current stage highlighted, `failed`/`paused`
   recolored and annotated
3. **Timeline** — chronological events with timestamp, title, description, and an optional
   source label
4. **Evidence** — title, source, collected time, observation, relevance badge; labeled
   "Simulated observations"
5. **Findings** — observation + analysis + which evidence it relates to, visibly separate
   from the Evidence section so interpretation is never confused with fact
6. **Root Cause** — a visually distinct, tinted panel: summary, explanation, confidence
   badge, supporting-evidence list
7. **Recommendation** — action, reason, expected effect, an approval-required badge, and an
   explicit "nothing is executed here" note

No investigation, evidence, root-cause, or recommendation logic runs anywhere — all of it is
static, hand-written content clearly labeled as simulated, per the brief's "Future Agent
Placeholders" instruction (no hidden chain-of-thought is exposed or implied; what's shown is
concise structured events, findings, and evidence summaries, exactly as instructed).

**Incident ↔ Investigation integration (small, in-scope):**
`components/incidents/IncidentDetail.tsx`'s "Investigation" lifecycle card was upgraded: for
an incident with a real investigation (via the new `getInvestigationsByIncidentId()`), it now
links straight into that investigation's workspace instead of a generic placeholder; an
incident with no investigation yet (`INC-2025`, `INC-2024`) still shows the original "not
built yet" placeholder. The "Evidence" placeholder card was removed from that same list, since
evidence is now a real part of the Investigation workspace rather than a separate future
incident-level feature; "Root Cause," "Recommended Action," "Approval," and "Resolution"
remain placeholders there, since an incident-level rollup of those (as opposed to a specific
investigation's) still doesn't exist. No other part of `IncidentDetail.tsx` or any Phase 4
data changed.

**Data rule honored:** no calls to PostgreSQL, FastAPI, an LLM, the NovaCommerce simulation,
or n8n. The backend was not touched.

**Testing results:**

- `npm run build` — compiles clean; `/investigations/[id]` correctly reported as a dynamic
  (ƒ) route alongside `/incidents/[id]`, every other route still static (○)
- `npm run lint` — zero warnings, zero errors
- Dev server manually verified: every existing route still returns its expected status
  (`/` → 307, all nav pages → 200, an unmapped path → 404); `/investigations/INV-1042` → 200,
  `/investigations/INV-9999` (unknown id) → 404
- `/investigations` HTML confirmed to contain all four summary labels, both filter "All …"
  options, the search placeholder, and all seven investigation ids
- `/investigations/INV-1042` HTML confirmed to contain every section (header, progress
  stages, timeline events, evidence items, findings, root cause, recommendation)
- Confirmed the progress stepper's `failed`/`paused` styling and copy ("Stalled at this
  stage" / "Paused at this stage") render only on `INV-1036`/`INV-1037` and not on a
  `completed` investigation
- Confirmed `INV-1040`/`INV-1037`/`INV-1036` (pre-root-cause stages) render the "not yet
  identified"/"not yet reached" states instead of fabricated content
- Confirmed `/incidents/INC-2031` now links to `/investigations/INV-1042`, and
  `/incidents/INC-2025` (no investigation) still shows the original placeholder
- Summary-card numbers cross-checked against the dataset independently (Total 7, Running 1,
  Completed 2, Awaiting Approval 2) and matched the rendered HTML exactly
- No console errors surfaced; no new dependencies were installed

**Known issues / carried-forward gaps:**

- `lib/mock/time.ts` duplicates `DEMO_NOW` and the relative-time formatter that already exist
  in `lib/mock/incidents.ts`, by design (see above) — Phase 10's real-API migration should
  collapse this into one shared time utility once both domains are being refactored anyway.
- The Incident detail page's "Root Cause," "Recommended Action," "Approval," and
  "Resolution" placeholders don't yet link into the matching section of a linked
  investigation's workspace the way "Investigation" now does. Left as-is to keep this phase's
  change to `IncidentDetail.tsx` minimal; worth revisiting once Approvals (Phase 6) and
  Actions (Phase 7) exist and there's a real destination for "Approval" and "Resolution" to
  point to as well.
- No pagination on the Investigations table. Not needed at 7 rows.

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
│   │   ├── investigations/page.tsx  Phase 5 — real Investigations list
│   │   ├── investigations/[id]/page.tsx  Phase 5 — investigation detail route
│   │   ├── actions/page.tsx         Phase 7 — real Actions list
│   │   ├── actions/[id]/page.tsx    Phase 7 — action detail route
│   │   ├── approvals/page.tsx       Phase 6 — real Approvals queue
│   │   ├── approvals/[id]/page.tsx  Phase 6 — approval detail route
│   │   ├── systems/page.tsx         Placeholder (Systems & Tools)
│   │   ├── knowledge-base/page.tsx  Placeholder
│   │   ├── analytics/page.tsx       Placeholder
│   │   ├── reports/page.tsx         Phase 8 — real Reports list
│   │   ├── reports/[id]/page.tsx    Phase 8 — report detail route
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
│   │   └── IncidentDetail.tsx      Phase 5: "Investigation" card now links out
│   ├── src/components/investigations/  Phase 5 — Investigations-only components
│   │   ├── InvestigationStatusBadge.tsx
│   │   ├── InvestigationStageBadge.tsx   (also exports ConfidenceBadge)
│   │   ├── InvestigationSummaryCard.tsx
│   │   ├── InvestigationFilters.tsx
│   │   ├── InvestigationTable.tsx
│   │   ├── InvestigationHeader.tsx
│   │   ├── InvestigationProgress.tsx
│   │   ├── InvestigationTimeline.tsx
│   │   ├── EvidenceList.tsx
│   │   ├── FindingsPanel.tsx
│   │   ├── RootCausePanel.tsx
│   │   └── RecommendationPanel.tsx
│   ├── src/components/approvals/   Phase 6 — Approvals-only components
│   │   ├── ApprovalStatusBadge.tsx
│   │   ├── ApprovalRiskBadge.tsx
│   │   ├── ApprovalSummaryCard.tsx
│   │   ├── ApprovalFilters.tsx
│   │   ├── ApprovalTable.tsx
│   │   ├── ApprovalHeader.tsx
│   │   ├── ApprovalContext.tsx
│   │   ├── ApprovalEvidence.tsx
│   │   ├── ApprovalRiskImpact.tsx
│   │   └── ApprovalDecision.tsx
│   ├── src/components/actions/     Phase 7 — Actions-only components
│   │   ├── ActionStatusBadge.tsx
│   │   ├── ActionRiskBadge.tsx
│   │   ├── ActionVerificationBadge.tsx
│   │   ├── ActionSummaryCard.tsx
│   │   ├── ActionFilters.tsx
│   │   ├── ActionTable.tsx
│   │   ├── ActionHeader.tsx
│   │   ├── ActionLifecycle.tsx
│   │   ├── ActionContext.tsx
│   │   ├── ActionExecution.tsx
│   │   ├── ActionVerificationPanel.tsx
│   │   ├── ActionTimeline.tsx
│   │   └── ActionControls.tsx
│   ├── src/components/reports/     Phase 8 — Reports-only components
│   │   ├── ReportStatusBadge.tsx        (also exports ReportOutcomeBadge)
│   │   ├── ReportSeverityBadge.tsx
│   │   ├── ReportVerificationBadge.tsx  (also exports ReportConfidenceBadge)
│   │   ├── ReportSummaryCard.tsx
│   │   ├── ReportFilters.tsx
│   │   ├── ReportTable.tsx
│   │   ├── ReportHeader.tsx
│   │   ├── ExecutiveSummary.tsx
│   │   ├── ReportIncidentSummary.tsx
│   │   ├── ReportInvestigationSummary.tsx
│   │   ├── ReportEvidenceSummary.tsx
│   │   ├── RootCauseSummary.tsx
│   │   ├── RecommendationSummary.tsx
│   │   ├── ApprovalSummary.tsx
│   │   ├── ActionSummary.tsx
│   │   ├── VerificationSummary.tsx
│   │   ├── ReportTimeline.tsx
│   │   └── ReportActions.tsx
│   ├── src/lib/mock/
│   │   ├── dashboard.ts            Phase 3 — isolated mock data (D-012)
│   │   ├── incidents.ts            Phase 4 — isolated mock data (D-012)
│   │   ├── investigations.ts       Phase 5 — isolated mock data (D-012)
│   │   ├── approvals.ts            Phase 6 — isolated mock data (D-012)
│   │   ├── actions.ts              Phase 7 — isolated mock data (D-012)
│   │   ├── reports.ts              Phase 8 — isolated mock data (D-012)
│   │   └── time.ts                 Phase 5 — shared "demo now" + relative-time helpers
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

- The Dashboard (`/dashboard`), Incidents (`/incidents`, `/incidents/[id]`), Investigations
  (`/investigations`, `/investigations/[id]`), Approvals (`/approvals`, `/approvals/[id]`),
  Actions (`/actions`, `/actions/[id]`), and Reports (`/reports`, `/reports/[id]`) have real
  content as of Phases 3–8. The other five pages are unchanged — still the same "Coming in a
  later phase" placeholder, per their own title and description
- No real AI reasoning, tool calls, or agent logic anywhere — every investigation's timeline,
  evidence, findings, root cause, and recommendation is hand-written static content, clearly
  labeled "Simulated"
- No approval or action *logic* — the Approvals and Actions pages exist, but approving is a
  local-only demo interaction and **nothing has ever been executed**. Every execution
  timestamp, duration, executor, and verification result in `lib/mock/actions.ts` is
  hand-written demo content. The Incidents detail page's "Root Cause," "Recommended
  Action," "Approval," and "Resolution" cards are still labeled placeholders
- No incident or investigation creation — the Incidents page's "Create Incident" button has
  no handler, and there is no equivalent control on Investigations (none was asked for)
- No mock data for Systems & Tools, Knowledge Base, Analytics, or Audit Logs yet — only
  `lib/mock/dashboard.ts`, `lib/mock/incidents.ts`, `lib/mock/investigations.ts`,
  `lib/mock/approvals.ts`, `lib/mock/actions.ts`, and `lib/mock/reports.ts` (plus the small
  shared `lib/mock/time.ts`) exist so far; Phase 15 adds whatever the remaining pages need
- No report generation of any kind, and no document export — every report in
  `lib/mock/reports.ts` is hand-written, and the detail page's Export / Print control is a
  disabled placeholder. No PDF library is installed
- No migrations, and no Command Center tables (incidents, investigations, …) — only the eight NovaCommerce tables exist in PostgreSQL
- No AI agent, no LLM integration, no tools
- NovaCommerce data is seeded into PostgreSQL and exposed by read-only `/api` endpoints (Phase 10); no UI uses it
- No authentication — the header's "Operator" profile is a static placeholder
- No Docker configuration
- No tests
- No API endpoints beyond `GET /health` and the read-only NovaCommerce `/api` endpoints
- No frontend-to-backend calls — CORS is configured, but nothing uses it yet

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
| 5 | Investigations UI | ✅ Complete | List + search/filter + full detail workspace; build + lint clean. |
| 6 | Approvals UI | ✅ Complete | Queue + search/filter + full detail/review workspace; build + lint clean. |
| 7 | Actions UI | ✅ Complete (not build-verified) | List + search/4 filters + detail, lifecycle, execution, verification, timeline. No build/lint/browser run possible — see Phase 7 notes. |
| 8 | Reports UI | ✅ Complete (not build-verified) | List + search/4 filters + full report detail with executive summary, evidence, root cause, approval, action, verification, timeline. No build/lint/browser run possible — see Phase 8 notes. |
| 9 | NovaCommerce Simulation | ✅ Complete | Deterministic in-memory data layer + payment gateway degradation scenario. `python -m app.simulation.validate` passes. |
| 10 | Backend & Database | ✅ Complete | PostgreSQL + SQLAlchemy models, NovaCommerce seed, read-only API. Verified against a real local PostgreSQL 16; Phase 9 validation still passes. |
| 11 | Backend API Layer | ✅ Complete | Read-only `/api` endpoints, 503 on database errors; tested against real PostgreSQL. (Redefined from "AI Agent Foundation".) |
| 12 | AI Agent Tools Layer | ✅ Complete | Six read-only tools over the Phase 11 data layer; validated against real PostgreSQL. |
| 13 | AI Agent Foundation & Agentic Investigation | ⬜ Not started | Next. LLM + tool calling using the Phase 12 tools. |
| 14 | Approval + Action + Verification | ⬜ Not started | |
| 15 | Professionalization | ⬜ Not started | |
| 16 | Testing & Deployment | ⬜ Not started | |

---

## Next Phase Preview — Phase 9: NovaCommerce Simulation

Summarised here so the next session knows the target without hunting for it. The full
definition is in `DEVELOPMENT_PLAN.md`.

**This is the first substantial backend phase.** The UI phases (2–8) are done; Phase 9 builds
the world the agent will later observe, and it is one of the three phases DEVELOPMENT_PLAN
names as deciding the project's outcome.

**Goal:** a simulated NovaCommerce whose subsystems are **causally coupled**, so a fault
genuinely propagates and can genuinely be reversed.

**In scope:**
- Simulated subsystems: sales, orders, payments, inventory, customer complaints, website
  health, deployments
- Realistic baseline behaviour with daily/weekly patterns and plausible noise
- Causal coupling between subsystems — the requirement that makes everything downstream
  meaningful
- Scenario injection: trigger a specific fault on demand
- The reference scenario working end to end: payment gateway failure → payment failures rise
  → orders fall → revenue falls → complaints mention checkout
- Reversibility: switching to the backup gateway causes recovery

**Out of scope:** AI, tools, the Command Center's own data model, frontend integration.

**Done when:** a fault can be injected, its downstream effects observed across multiple
subsystems, and then reversed.

**Note:** the mock UI already describes exactly this scenario in six places — the Dashboard's
AI Activity feed, `INC-2031`, `INV-1042`, `APR-3001`, `ACT-4001`, and `REP-5001`. Those
figures (payment failure rate 27% vs. a 2% baseline, completed orders -34%, revenue -18.4%
vs. forecast) are the numbers Phase 9's simulation should be able to actually produce, and
Phase 10 will then serve them for real. They are a specification, not decoration.

**Before starting: close the verification gap.** Phases 7 and 8 were implemented in an
environment with no network access, so neither was build- or lint-verified and no page was
opened in a browser. Run `npm install && npm run lint && npm run build` and click through all
six built pages first — fixing a frontend defect is much cheaper now than after a backend
lands on top of it.

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
