# DEVELOPMENT_PLAN.md

**Status:** Phase 0 — Blueprint. No phase beyond 0 has begun.

---

## 1. How Phases Work

The project is built in small, controlled phases. This is a working discipline, not a
formality.

### The cycle for every phase

```
   1. Read the docs        ← PROJECT_SPEC, ARCHITECTURE, DEVELOPMENT_PLAN,
      │                       DECISIONS, CURRENT_STATE
      ▼
   2. Confirm scope        ← what is in, what is out, which files will change
      │
      ▼
   3. Implement            ← only the files this phase names
      │
      ▼
   4. Test locally         ← run it in VS Code; confirm it works
      │
      ▼
   5. Fix                  ← iterate until it actually works
      │
      ▼
   6. Commit to Git        ← a clean, described commit
      │
      ▼
   7. Update CURRENT_STATE ← record what was completed
      │
      ▼
   8. Stop                 ← do not roll into the next phase
```

Step 8 is not optional. A phase that silently continues into the next one is a phase whose
scope was never really defined.

### Rules that hold across all phases

An implementing session must **never**:

- Rewrite the whole project
- Refactor code unrelated to the current phase
- Rename unrelated files
- Move unrelated folders
- Modify modules outside the current task
- Mix frontend and backend logic
- Touch the database or AI layers unless the phase explicitly calls for it
- Install dependencies the phase does not require
- Add features that "seemed useful while I was in there"

If something outside the current scope looks wrong, the correct response is to **note it**,
not to fix it. Record it in DECISIONS.md or as a follow-up item, and continue with the
phase as scoped.

### A note on ordering

Phases 2–8 build the user interface before Phase 10 builds the backend and database. This
is intentional. Building the UI first forces the data shapes to be decided from the
consumer's side, produces something visible and demonstrable early, and keeps motivation
high through the long middle of the project.

The cost is that the UI is initially built against **mock data**. That is acceptable, with
one condition: the mock data must live behind a clearly isolated boundary — a single,
obvious module per domain — so that Phase 10 can replace it with real API calls without
rewriting components. If mock data is scattered inline through components, Phase 10 becomes
a rewrite, which violates the core discipline. Treat the mock layer as a contract with the
backend that does not yet exist.

---

## 2. The Phases

### Phase 0 — Project Blueprint
**Status: COMPLETE**

Establish the permanent planning and architecture documentation. No application code.

**Scope**
- `docs/PROJECT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT_PLAN.md`
- `docs/DECISIONS.md`
- `docs/CURRENT_STATE.md`

**Explicitly out of scope:** all code, all folders beyond `docs/`, all dependencies.

**Done when:** the five documents exist and a fresh session can read them and understand
what is being built, how it is shaped, why, and what comes next.

---

### Phase 1 — Project Foundation

Create the repository skeleton and make both applications start.

**Scope**
- Git repository initialised, `.gitignore` for Node and Python
- Top-level `frontend/` and `backend/` directories — the separation made physical from day
  one
- Next.js + TypeScript + Tailwind initialised in `frontend/`, running with a default page
- Python virtual environment and FastAPI initialised in `backend/`, serving a single health
  endpoint
- `README.md` at root: what this is, how to run it
- Environment variable examples (`.env.example`), no real secrets

**Out of scope:** any page, any real endpoint, any database, any AI, Docker.

**Done when:** `npm run dev` serves the frontend, the backend serves `/health`, both are
committed, and the two directories are visibly independent.

---

### Phase 2 — Website Shell

Build the application frame that all eleven pages will live inside.

**Scope**
- Root layout, navigation structure covering all eleven pages
- Routing so every page path resolves to a placeholder
- Shared visual language: colour tokens, typography scale, spacing
- Core reusable primitives (page container, card, status badge, table shell, empty state)
- Responsive behaviour of the shell

**Out of scope:** real page content, data of any kind, backend calls.

**Done when:** every page in PROJECT_SPEC §6 is reachable by navigation and renders inside a
consistent shell.

**Note:** the visual language decided here propagates through six subsequent phases. Worth
spending the time.

---

### Phase 3 — Dashboard UI

The landing page and the place an incident is first noticed.

**Scope**
- Operational health summary
- Active incidents overview
- System status indicators (the seven NovaCommerce systems)
- Key business metrics with trend indication
- Current AI activity panel
- Mock data behind an isolated module

**Out of scope:** real data, charts requiring backend aggregation, drill-through to pages
not yet built.

**Done when:** the Dashboard communicates, at a glance, that something is wrong — and makes
a reviewer want to click into it.

---

### Phase 4 — Incidents UI

**Scope**
- Incident list: filterable by status and severity, sortable
- Incident detail: the problem, its timeline, severity, detection source, current status
- Status representation consistent with the domain model
- Navigation from Dashboard into an incident
- Mock data extended

**Out of scope:** creating incidents, investigation content, actions.

**Done when:** an incident can be browsed from the list to full detail.

---

### Phase 5 — Investigations UI

The most important UI phase. This is where the system's reasoning becomes visible, and it
is the page that distinguishes this project from a CRUD application.

**Scope**
- Investigation timeline: ordered steps, each showing the agent's reasoning, the tool
  invoked, and the evidence returned
- Evidence display, attributed to source system and time
- Findings and root cause presentation
- Confidence level, shown honestly (including low confidence)
- Link back to the parent incident
- Representation of an investigation still in progress

**Out of scope:** running a real investigation, recommendations, approvals.

**Done when:** a reader can follow the agent's chain of reasoning and judge for themselves
whether the conclusion is warranted.

**Design note:** the failure mode is a wall of JSON. The goal is a narrative a human can
read.

---

### Phase 6 — Approvals UI

**Scope**
- Approval queue
- Approval detail: what is proposed, why, expected effect, risk assessment, supporting
  evidence
- Approve / reject / modify controls
- Decision history with who, when, what

**Out of scope:** actually executing anything on approval.

**Done when:** a human could look at a queued approval and have genuinely enough context to
make a responsible decision. Insufficient context is the real failure mode of
human-in-the-loop systems.

---

### Phase 7 — Actions UI

**Scope**
- Action list with status (pending, executing, succeeded, failed)
- Action detail: target system, parameters, result, timestamps
- Traceability display: Action → Approval → Recommendation → Investigation → Incident
- Verification outcome display

**Out of scope:** executing actions.

**Done when:** any action can be traced back to the reasoning that produced it.

---

### Phase 8 — Reports UI

**Scope**
- Report list
- Report detail: full incident lifecycle narrative — what happened, what was found, what was
  done, whether it worked, what to do differently
- Readable, printable layout

**Out of scope:** report generation.

**Done when:** a report reads as something a competent operations engineer would have
written.

---

### Phase 9 — NovaCommerce Simulation

The first substantial backend phase. Build the world before building the observer.

**Scope**
- Simulated subsystems: sales, orders, payments, inventory, customer complaints, website
  health, deployments
- Realistic baseline behaviour with daily/weekly patterns and plausible noise
- **Causal coupling between subsystems** — the requirement that makes everything downstream
  meaningful
- Scenario injection: the ability to trigger a specific fault on demand
- The reference scenario fully working: payment gateway failure → payment failures rise →
  orders fall → revenue falls → complaints mention checkout
- Reversibility: switching to the backup gateway causes recovery

**Out of scope:** AI, tools, the Command Center's own data model, frontend integration.

**Done when:** a fault can be injected and its downstream effects observed across multiple
subsystems — and reversed.

**This phase carries the project's realism.** If the subsystems are independent random
generators, every later phase is a demonstration of nothing.

---

### Phase 10 — Backend & Database

**Scope**
- PostgreSQL provisioned
- SQLAlchemy models for the Command Center domain: incidents, investigations, steps,
  evidence, root causes, recommendations, approvals, actions, verifications, reports, audit
  log entries
- NovaCommerce simulation data persisted, logically separated
- Migrations
- REST API covering the domain
- **Frontend switched from mock data to real API calls** — replacing the isolated mock
  modules established in Phases 3–8

**Out of scope:** AI, tools, agent logic.

**Done when:** every UI page built in Phases 3–8 displays real data from the database, and
the mock modules are removed.

**Risk:** this is the phase where an inadequately isolated mock layer turns into a UI
rewrite. Phase 2's discipline pays off or costs here.

---

### Phase 11 — AI Agent Foundation

**Scope**
- LLM API integration in the backend
- Agent scaffolding: context assembly, invocation, response handling
- Tool-calling mechanism wired up
- One or two trivial read tools, to prove the loop
- Agent step recording persisted as it happens
- API key handling via environment only

**Out of scope:** the full tool catalogue, autonomous investigation, write tools.

**Done when:** the agent can be given a question, choose to call a tool, receive a result,
and produce a response — with every step recorded.

---

### Phase 12 — Investigation Tools

**Scope**
- Full read-tool catalogue against the NovaCommerce simulation: sales, orders, payments,
  inventory, complaints, website health, deployments
- Argument schemas and validation
- Structured, consistent result formats
- Informative error handling
- Tool invocation recording feeding both Investigations timeline and Audit Log
- Systems & Tools page populated with the real catalogue

**Out of scope:** write tools, agentic decision-making.

**Done when:** each tool can be invoked and returns evidence in a form the agent can reason
over and the UI can display.

**Design note:** tool *descriptions* are effectively prompt engineering. The agent chooses
tools based on how they describe themselves. This deserves real attention.

---

### Phase 13 — Agentic Investigation

The phase the project exists for.

**Scope**
- Agent autonomously investigates an incident: reasons, selects tools, gathers evidence,
  and **decides what to examine next based on what it found**
- Investigation loop with termination conditions (confidence reached, step limit, no
  further useful avenues)
- Root cause synthesis with confidence level and supporting evidence
- Recommendation generation
- The full reference scenario working end to end: sales drop → autonomous investigation →
  payment gateway identified as root cause → backup gateway recommended
- Investigations UI displaying real agent output

**Out of scope:** execution, approval enforcement, verification.

**Done when:** the agent investigates the sales drop without being told to check payments,
and its path through the systems is visibly driven by the evidence it encountered.

**This is the phase that determines whether the project is what it claims to be.** A fixed
sequence dressed in agent vocabulary is not an agent. The test: inject a *different* fault —
an inventory problem, say — and see whether the agent takes a different path.

---

### Phase 14 — Approval + Action + Verification

Close the loop.

**Scope**
- Risk assessment of recommendations against a configurable threshold
- Approval request creation and routing to the queue
- Approvals UI wired to real decisions
- Write tools, executed by the domain layer only — never by the agent
- Action execution against the simulation
- Verification: re-check the original symptom after execution
- Incident resolution on successful verification; **reopening on failure**
- Report generation from the complete lifecycle
- Full audit trail across all of it

**Out of scope:** professional polish, deployment.

**Done when:** the complete PROJECT_SPEC §10 path works: dashboard → incident →
investigation → root cause → recommendation → approval → execution → verification →
report → audit log.

**Do not skip the reopen path.** A system that only handles the success case is
demonstrating optimism, not engineering.

---

### Phase 15 — Professionalization

**Scope**
- Remaining pages completed: Knowledge Base, Analytics, Audit Logs, Settings
- Error handling, loading states, and empty states throughout
- Accessibility pass
- Performance pass
- Visual consistency audit
- Documentation for a reader: README with screenshots, setup instructions, architecture
  summary

**Out of scope:** new capability.

**Done when:** the application feels finished rather than assembled — and a stranger can run
it from the README alone.

---

### Phase 16 — Testing & Deployment

**Scope**
- Backend tests: domain logic, tool layer, agent orchestration (with the LLM mocked)
- Frontend tests: critical paths
- End-to-end test of the reference scenario
- Dockerfiles for frontend and backend
- `docker-compose.yml` for the three-container setup
- Environment configuration documented
- Deployment verified from a clean checkout

**Done when:** someone clones the repository, sets environment variables, runs
`docker compose up`, and gets a working AI Operations Command Center.

---

## 3. Phase Map

```
  DOCUMENTATION
  Phase 0   Blueprint                         ✅ complete

  FOUNDATION
  Phase 1   Project Foundation
  Phase 2   Website Shell

  USER INTERFACE  (mock data, isolated)
  Phase 3   Dashboard UI
  Phase 4   Incidents UI
  Phase 5   Investigations UI          ◄── the differentiating page
  Phase 6   Approvals UI
  Phase 7   Actions UI
  Phase 8   Reports UI

  BACKEND
  Phase 9   NovaCommerce Simulation    ◄── carries the project's realism
  Phase 10  Backend & Database         ◄── mock data replaced with real

  ARTIFICIAL INTELLIGENCE
  Phase 11  AI Agent Foundation
  Phase 12  Investigation Tools
  Phase 13  Agentic Investigation      ◄── the phase the project exists for
  Phase 14  Approval + Action + Verification

  COMPLETION
  Phase 15  Professionalization
  Phase 16  Testing & Deployment
```

### The three phases that decide the outcome

**Phase 9** — if the simulation's subsystems are not causally linked, there is nothing real
to discover and every later phase is theatre.

**Phase 13** — if the agent follows a fixed sequence, the project is a workflow engine with
an LLM attached.

**Phase 14** — if verification is skipped or only the happy path is handled, the system
cannot tell whether it succeeded, and the central claim fails.

Phases 3–8 are the visible work. These three are the real work.
