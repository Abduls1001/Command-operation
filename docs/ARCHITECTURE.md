# ARCHITECTURE.md

**Status:** Phase 0 — Blueprint. Conceptual only. Nothing described here is implemented.

This document describes *shape*, not code. It deliberately avoids file layouts, class names,
schema definitions, and endpoint signatures. Those belong to the phases that build them.

---

## 1. High-Level Architecture

```
                    ┌──────────────────┐
                    │       User       │
                    └────────┬─────────┘
                             │  HTTPS
                             ▼
              ┌────────────────────────────┐
              │      Next.js Frontend      │
              │   TypeScript · Tailwind    │
              │                            │
              │  Presentation only.        │
              │  No business rules.        │
              │  No AI logic.              │
              │  No database access.       │
              └─────────────┬──────────────┘
                            │
                            │  REST  (JSON over HTTP)
                            │  — the only channel between the two —
                            ▼
              ┌────────────────────────────┐
              │      FastAPI Backend       │
              │          Python            │
              │                            │
              │  ┌──────────────────────┐  │
              │  │      API Layer       │  │  request/response, validation
              │  └──────────┬───────────┘  │
              │             ▼              │
              │  ┌──────────────────────┐  │
              │  │   Domain / Service   │  │  incident lifecycle rules
              │  │        Layer         │  │
              │  └───┬──────────────┬───┘  │
              │      │              │      │
              │      ▼              ▼      │
              │  ┌────────┐   ┌──────────┐ │
              │  │  Data  │   │    AI    │ │
              │  │ Access │   │  Agent   │ │
              │  └───┬────┘   └────┬─────┘ │
              │      │             │       │
              │      │             ▼       │
              │      │      ┌──────────┐   │
              │      │      │   Tool   │   │
              │      │      │  Layer   │   │
              │      │      └────┬─────┘   │
              └──────┼───────────┼─────────┘
                     │           │
                     ▼           ▼
          ┌────────────────┐  ┌──────────────────────┐
          │   PostgreSQL   │  │  NovaCommerce        │
          │                │  │  Simulation          │
          │  Command       │  │                      │
          │  Center state  │  │  Sales, orders,      │
          │                │  │  payments, inventory,│
          │                │  │  complaints, health, │
          │                │  │  deployments         │
          └────────────────┘  └──────────────────────┘
                                         │
                                         └── also persisted in PostgreSQL,
                                             but logically a separate domain
```

Read top to bottom. Each layer talks only to the layer directly beneath it. The user never
reaches the database. The frontend never reaches the agent. The agent never reaches
NovaCommerce systems except through tools.

---

## 2. Frontend / Backend Separation

### The rule

The frontend and the backend are separate applications. They share nothing but an HTTP
contract.

### What this means concretely

**The frontend may:**
- Render data it was given
- Manage its own view state (what's open, what's selected, what's loading)
- Format and present values
- Call backend REST endpoints
- Decide what a user *sees*

**The frontend may not:**
- Contain business rules about the incident lifecycle
- Decide whether an action requires approval
- Call an LLM
- Connect to PostgreSQL
- Read NovaCommerce systems directly
- Contain logic that would need to be duplicated if a second client existed

**The backend may:**
- Own all domain rules
- Own all persistence
- Own all AI orchestration
- Decide what is *true*

**The backend may not:**
- Return presentation-shaped data that only makes sense for one specific UI component
- Assume a browser is calling it
- Render HTML

### Why this matters here specifically

An AI agent that investigates incidents is long-running and stateful. If any part of that
lived in the browser, an investigation would die when a user closed a tab. The separation
is not stylistic; it is what makes the agent a server-side process that continues without
an observer.

The practical test: **if the frontend were deleted entirely, the system would still be able
to detect an incident, investigate it, and produce a report.** Only the ability to *watch*
would be lost. If that is not true, business logic has leaked into the UI.

### The seam

REST, JSON, over HTTP. One documented contract. Versioned if it needs to be. Nothing else
crosses.

---

## 3. AI Agent Position

The agent sits **inside the backend**, beneath the domain layer, above the tool layer.

```
   Domain / Service Layer
            │
            │  "investigate incident 42"
            ▼
   ┌─────────────────────────────────────────┐
   │              AI Agent                   │
   │                                         │
   │   ┌─────────────────────────────────┐   │
   │   │  Context: incident, evidence    │   │
   │   │  gathered so far, tools available│  │
   │   └───────────────┬─────────────────┘   │
   │                   ▼                     │
   │   ┌─────────────────────────────────┐   │
   │   │  LLM reasoning:                 │   │
   │   │  "what should I check next?"    │   │
   │   └───────────────┬─────────────────┘   │
   │                   ▼                     │
   │   ┌─────────────────────────────────┐   │
   │   │  Tool selection + invocation    │   │
   │   └───────────────┬─────────────────┘   │
   │                   ▼                     │
   │   ┌─────────────────────────────────┐   │
   │   │  Evidence recorded              │   │
   │   └───────────────┬─────────────────┘   │
   │                   │                     │
   │      ┌────────────┘                     │
   │      │  loop until confident,           │
   │      │  or step limit reached           │
   │      ▼                                  │
   │   ┌─────────────────────────────────┐   │
   │   │  Root cause + recommendation    │   │
   │   └─────────────────────────────────┘   │
   └─────────────────────────────────────────┘
            │
            ▼
   back to Domain Layer for approval routing
```

### Design properties

**The agent is a component, not the application.** The system is an incident management
platform that happens to use an agent for investigation. If the agent were replaced with a
human analyst, or a rules engine, or a different model provider, the rest of the system
would be unaffected. This is deliberate. It keeps the agent replaceable and the system
testable.

**The agent decides its own path.** This is the core architectural commitment. The agent is
not a fixed sequence of "check sales, then check payments, then check inventory." At each
step it receives the evidence gathered so far and chooses the next tool based on what that
evidence suggests. Elevated payment failures lead it to payments. Normal payments but
abnormal stock levels lead it to inventory. The branching is the agent's, not the code's.

**The agent cannot act directly on the world.** It can *recommend*. Execution passes back
through the domain layer, which enforces the approval gate. The agent has no path to a
state-changing operation that bypasses this. This is a hard boundary and the most important
safety property in the design.

**The agent's work is fully recorded.** Every step — the reasoning, the tool chosen, the
arguments, the result — is persisted as it happens. The Investigations page reads this
record. This serves three purposes at once: it makes the UI possible, it makes the system
auditable, and it makes the agent debuggable.

**Single agent, initially.** One agent with a broad toolset and a clear objective. Not a
planner delegating to specialist sub-agents. See DECISIONS.md for the reasoning; the short
version is that multi-agent coordination adds substantial complexity and the single-agent
design has not yet been shown to be insufficient.

---

## 4. Database Position

PostgreSQL sits at the bottom. Nothing above the data access layer touches it.

### Access path

```
API Layer  →  Domain Layer  →  Data Access Layer  →  PostgreSQL
```

The API layer does not write SQL. The domain layer does not write SQL. Only the data access
layer, via SQLAlchemy, speaks to the database. The agent reaches data through tools, which
reach data through the same data access layer.

### Two logical domains, one physical database

The database holds two conceptually distinct bodies of data:

**Command Center state** — incidents, investigations, steps, evidence, root causes,
recommendations, approvals, actions, verifications, reports, audit log entries, users,
settings. This is the platform's own data.

**NovaCommerce business data** — sales records, orders, payment transactions, inventory
levels, customer complaints, website health samples, deployment history. This is the
simulated company's data, which the platform *observes*.

They share a PostgreSQL instance for operational simplicity. They are kept logically
separate — separate schemas or a clear naming boundary — because they mean different things.
Command Center data is the system's own record of its work. NovaCommerce data is the
external world it investigates. Blurring them would make it unclear what the agent is
allowed to modify.

### Access asymmetry

The agent's relationship to each domain is different, and the architecture should enforce it:

| | Command Center data | NovaCommerce data |
|---|---|---|
| Agent reads | Yes (its own context) | Yes (via tools) |
| Agent writes | Yes (evidence, findings) | **Only via approved Actions** |

The agent can freely record what it has learned. It cannot change the world it is observing
without passing the approval gate.

---

## 5. Tool Layer

The tool layer is the agent's hands. It is the only way the agent interacts with anything
outside its own reasoning.

### Concept

A tool is a named, described, typed capability. The agent is given a catalogue of tools; it
selects one, supplies arguments, and receives a structured result. The LLM's function-calling
capability is the mechanism.

### Two categories, one important distinction

**Read tools (investigative).** Gather evidence. Safe. No side effects. Callable freely by
the agent during an investigation.

Examples of what read tools cover:
- Sales figures over a period, with comparison to baseline
- Order volumes and completion rates
- Payment transaction outcomes and failure rates by gateway
- Inventory levels and anomalies
- Recent customer complaints, searchable by content
- Website health and error rates
- Deployment history within a time window

**Write tools (remedial).** Change the state of a NovaCommerce system. Not safe. **Never
invoked directly by the agent.** The agent may only *recommend* them. The domain layer
executes them, after approval where required.

Examples of what write tools cover:
- Switch the active payment gateway
- Disable a failing integration
- Trigger a rollback of a deployment
- Adjust a configuration value

### Why the separation is architectural rather than a convention

If read and write tools were in one undifferentiated catalogue, the only thing preventing
the agent from executing a rollback mid-investigation would be the prompt. Prompts are not
a security boundary. By making write tools structurally unreachable from the agent's
invocation path, the guarantee holds regardless of what the model decides to do.

### Tool layer responsibilities

- Expose a catalogue with names, descriptions, and argument schemas
- Validate arguments before execution
- Execute against the target simulated system
- Return structured, consistent results
- Record every invocation — tool, arguments, result, duration, outcome
- Fail informatively: a tool that errors returns a usable error, not a crash

Tool invocation records are what populate both the Investigations timeline and the Audit
Log. One recording mechanism, two views.

---

## 6. NovaCommerce Simulation

The simulation is a **peer subsystem** within the backend, not part of the Command Center's
own logic. It represents the external business systems being observed.

### Structure

```
   Tool Layer
        │
        ▼
   ┌──────────────────────────────────────────┐
   │       NovaCommerce Simulation            │
   │                                          │
   │   Sales  │  Orders  │  Payments          │
   │  ────────┼──────────┼──────────          │
   │ Inventory│Complaints│ Website Health     │
   │  ────────┴──────────┴──────────          │
   │           Deployments                    │
   │                                          │
   │   ┌──────────────────────────────────┐   │
   │   │  Scenario / fault injection      │   │
   │   │  — makes incidents happen        │   │
   │   └──────────────────────────────────┘   │
   └──────────────────────────────────────────┘
                     │
                     ▼
              PostgreSQL
```

### Design requirements

**Causally coupled.** This is the requirement that makes the simulation worth building. The
subsystems must be linked so that a fault in one produces realistic symptoms in others:

```
payment gateway fault
   ↓
payment transactions begin failing
   ↓
orders do not complete
   ↓
sales revenue falls
   ↓
customers complain about checkout
```

If sales figures and payment figures were generated independently, the agent would have
nothing real to discover. The investigation would be theatre. The causal chain is the
substance of the project.

**Baseline realism.** Normal operation needs texture — daily and weekly patterns, plausible
noise — so that an anomaly is genuinely an anomaly rather than a flat line with a step in it.

**Controllable faults.** Scenarios must be injectable on demand so that a specific incident
can be triggered for demonstration and for testing. The payment gateway failure is the
reference scenario; others (inventory stockout, deployment regression, traffic anomaly) are
natural extensions.

**Reversible.** A write tool switching to the backup gateway must actually cause payment
success rates to recover, so that Verification has something true to verify. Without this,
the final third of the workflow is unfalsifiable.

**Replaceable.** The simulation sits behind the tool layer's interface. In principle a real
integration could take its place without the agent knowing the difference.

---

## 7. Data Flow

### Flow A — A user views a page

```
User clicks "Incidents"
  → Next.js page requests data
  → REST call to backend
  → API layer validates and routes
  → Domain layer applies rules and assembles the response
  → Data access layer queries PostgreSQL
  → response travels back up
  → Next.js renders
```

Straightforward. The point is that it is the *only* path — there is no second, shorter route
for the frontend to obtain data.

### Flow B — An investigation runs

```
Incident exists (reported or detected)
  → Domain layer opens an Investigation
  → Agent is invoked with incident context

  ┌─► Agent reasons: "what do I need to know next?"
  │     → selects a read tool
  │     → Tool layer validates and executes
  │     → NovaCommerce simulation returns data
  │     → result recorded as Evidence (persisted immediately)
  │     → tool invocation recorded in Audit Log
  │     → agent's context updated
  └──── loop, until confident or step limit reached

  → Agent produces Root Cause + confidence + supporting evidence
  → Agent produces Recommendation
  → Domain layer persists both
  → Investigation status updated
```

Evidence is persisted as it arrives, not batched at the end. An investigation that fails
halfway still leaves behind everything it learned, and the UI can display progress live.

### Flow C — Approval, action, verification

```
Recommendation exists
  → Domain layer assesses risk against threshold
  │
  ├─ below threshold ──────────────► proceed to execution
  │
  └─ at or above threshold
       → Approval request created, queued
       → appears on Approvals page
       → human decides
       │
       ├─ rejected ──► Action not created; outcome recorded; investigation closes
       │
       └─ approved
            → Domain layer invokes the write tool
            → Tool layer executes against the simulation
            → Action result recorded
            → wait for effect to propagate
            → Verification: re-read the original symptom via read tools
            │
            ├─ recovered ──► Incident resolved → Report generated
            │
            └─ not recovered ──► Incident reopened → back to Flow B
```

The loop back on failed verification is essential. A system that cannot tell whether it
succeeded is not an operations employee; it is a suggestion box.

### Cross-cutting: the audit trail

Every significant event in all three flows writes to the Audit Log. This is not an optional
feature bolted on at the end — it is how the system earns trust. It should be a concern
threaded through the domain layer from the beginning, not retrofitted.

---

## 8. Future Deployment Architecture

Intended direction. Nothing here is built in Phase 0, and deployment work is Phase 16.

### Containerisation

Three containers, orchestrated with Docker Compose for local and single-host deployment:

```
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │   frontend   │   │   backend    │   │  postgres    │
   │              │   │              │   │              │
   │   Next.js    │──►│   FastAPI    │──►│   database   │
   │   node       │   │   uvicorn    │   │   + volume   │
   └──────────────┘   └──────────────┘   └──────────────┘
          │                   │
          └───────┬───────────┘
                  ▼
          docker-compose network
```

One container per concern. The same boundaries that exist logically in the code become
process boundaries at runtime — which is a useful forcing function, because a leak across
layers becomes a deployment failure rather than a quiet coupling.

### Configuration

Environment-based. No credentials, API keys, or connection strings in the repository. The
LLM API key in particular lives only in the backend's environment; it is never exposed to
the frontend.

### Data

PostgreSQL uses a named volume so that data survives container restarts. Schema changes are
applied by migration, not by hand.

### Production considerations (directional, not committed)

- Frontend served from a static/edge host or a Node runtime, depending on rendering needs
- Backend behind a reverse proxy handling TLS
- Managed PostgreSQL rather than a container, if hosted
- Structured logging to a collector
- Health check endpoints on both services

### What is deliberately not planned

No Kubernetes. No service mesh. No message queue. No autoscaling. These solve problems this
project does not have. If one of them becomes necessary, that necessity should be
demonstrable and recorded in DECISIONS.md before it is adopted.

---

## 9. Architectural Invariants

A short list of properties that must remain true. If a change would violate one of these,
it is the wrong change, or the invariant needs an explicit, recorded revision.

1. The frontend never accesses the database.
2. The frontend never calls an LLM.
3. The frontend contains no incident lifecycle rules.
4. The agent never executes a write tool directly.
5. Every write tool execution is traceable to a Recommendation and, where required, an
   Approval.
6. Every tool invocation is recorded before its result is used.
7. All database access goes through the data access layer.
8. NovaCommerce simulation data is only reachable through the tool layer.
9. An incident is never marked resolved without a Verification.
10. The system's own state and NovaCommerce's business data remain logically distinct.
