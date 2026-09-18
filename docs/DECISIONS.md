# DECISIONS.md

A record of significant architectural decisions, why they were made, and what was given up.

**Format:** each entry states the decision, the reasoning, the alternatives considered, and
the trade-off accepted. A decision without a stated trade-off is usually a decision that was
not really examined.

**Maintenance:** append new entries as they are made. Do not delete superseded entries —
mark them superseded and record what replaced them and why. The history of reversed
decisions is often more useful than the decisions themselves.

All decisions below were made in Phase 0.

---

## D-001 — Next.js + TypeScript for the frontend

**Date:** Phase 0
**Status:** Accepted

**Decision:** The user interface is a Next.js application written in TypeScript.

**Reasoning:**
Next.js provides routing, layouts, and server-side rendering without assembling them from
parts, which matters for an eleven-page application with a shared shell. Its file-based
routing maps cleanly onto the page structure in PROJECT_SPEC §6.

TypeScript is the more consequential half of this decision. The domain model has many
similar-looking entities — Incident, Investigation, Recommendation, Action — with
relationships that must not be confused. Static types make the distinction between a
Recommendation and an Action enforceable by the compiler rather than by memory. Given that
Phases 3–8 build against mock data and Phase 10 swaps in real API responses, types also act
as the contract that makes the swap verifiable.

**Alternatives considered:**
- *Plain React with Vite* — lighter, but routing and layout composition would be hand-rolled
  across eleven pages.
- *JavaScript instead of TypeScript* — faster to write initially; the domain's entity
  confusion risk makes this a poor trade.

**Trade-off accepted:** Next.js brings framework conventions and a build system heavier than
strictly needed. Accepted for the routing and layout benefits.

---

## D-002 — FastAPI + Python for the backend

**Date:** Phase 0
**Status:** Accepted

**Decision:** The backend is a Python application using FastAPI.

**Reasoning:**
The decisive factor is that the AI agent must be written in Python (D-005). Given that, the
backend being Python removes a process boundary that would otherwise exist purely for
language reasons — no separate AI service, no inter-service protocol, no duplicated domain
models across two languages.

FastAPI specifically: Pydantic-based request and response validation gives typed contracts
on the server side that pair with TypeScript on the client side, and automatic OpenAPI
documentation means the REST contract is self-describing rather than maintained by hand.
Async support matters because agent investigations involve multiple sequential LLM calls
with real latency.

**Alternatives considered:**
- *Node/Express backend with a separate Python AI service* — keeps one language for web
  concerns, but introduces a service boundary and a second deployment for no benefit the
  project needs.
- *Django* — more built-in machinery (admin, auth, ORM) than required, and a heavier
  structure to work around.
- *Flask* — viable, but validation and API documentation would be assembled manually.

**Trade-off accepted:** Two languages in the repository. Mitigated by the fact that the
boundary between them is a single, well-defined REST contract.

---

## D-003 — PostgreSQL for the database

**Date:** Phase 0
**Status:** Accepted

**Decision:** PostgreSQL is the single database for both Command Center state and simulated
NovaCommerce business data.

**Reasoning:**
The domain is strongly relational. Incidents own investigations, which own steps, which own
evidence; recommendations link to approvals and actions; every action traces back through
that chain. Referential integrity is not incidental here — the traceability guarantee in
ARCHITECTURE §9 is a foreign-key property.

PostgreSQL's JSONB support is a specific fit for the semi-structured parts: tool arguments
and results vary in shape by tool, and forcing them into rigid columns would be awkward.
JSONB allows structured storage without abandoning the relational model elsewhere.

Its time-series and aggregation capability handles the NovaCommerce simulation's metric data
adequately at this scale, avoiding a second datastore.

**Alternatives considered:**
- *SQLite* — simpler to set up; poor fit for concurrent access and weaker on JSON and
  window functions.
- *MongoDB* — the relational integrity requirement argues directly against it.
- *PostgreSQL + a time-series database* — premature. One database until one database
  demonstrably fails.

**Trade-off accepted:** Requires a running database service, which adds setup friction
compared with SQLite. Addressed by containerisation (D-007).

---

## D-004 — SQLAlchemy as the ORM

**Date:** Phase 0
**Status:** Accepted

**Decision:** Database access goes through SQLAlchemy, confined to the data access layer.

**Reasoning:**
SQLAlchemy gives a clean mapping from the domain concepts in PROJECT_SPEC §7 to persisted
entities, with relationship handling that matches the incident → investigation → evidence
hierarchy. Its dual nature matters: the ORM handles the ordinary cases, and Core lets
complex analytical queries for the Analytics page be written without fighting the
abstraction.

Confining it to the data access layer is the load-bearing part of this decision. ORM models
leaking into the API layer or, worse, into serialised responses, is the standard way layered
architectures dissolve.

**Alternatives considered:**
- *Raw SQL* — maximal control, but the relationship-heavy domain would require substantial
  hand-written mapping.
- *Tortoise ORM / SQLModel* — lighter and pleasant, but less capable when queries become
  analytical.

**Trade-off accepted:** SQLAlchemy has a real learning curve and its session/identity-map
behaviour can surprise. Accepted for the query flexibility.

---

## D-005 — Python for the AI agent

**Date:** Phase 0
**Status:** Accepted

**Decision:** The AI agent is implemented in Python, inside the backend.

**Reasoning:**
Python is where LLM tooling actually lives — official SDKs are first-class, and the
surrounding ecosystem for prompt handling, structured output, and evaluation is mature there
before anywhere else.

Placing the agent inside the backend rather than in a separate service is a deliberate
simplification. The agent needs read access to incident context and must write evidence as
it gathers it; an in-process component does this directly. A separate service would add a
network boundary, serialisation, and failure modes in exchange for an independence the
project has no use for.

The agent remains a *module* with clear boundaries, not code scattered through the backend.
It can be extracted into its own service later if a reason emerges.

**Alternatives considered:**
- *Separate agent microservice* — rejected as premature decomposition.
- *Agent logic in the frontend* — rejected outright. Investigations must survive the browser
  closing, and the API key must never reach the client.

**Trade-off accepted:** A slow investigation occupies backend capacity. Mitigated by async
handling; revisit if it becomes a real constraint.

---

## D-006 — REST for frontend/backend communication

**Date:** Phase 0
**Status:** Accepted

**Decision:** The frontend and backend communicate exclusively over REST, JSON over HTTP.

**Reasoning:**
The access patterns are conventional: list a resource, fetch a resource, act on a resource.
Eleven pages, all of which fit that shape. REST handles this without additional machinery,
and FastAPI generates its documentation automatically, keeping the contract honest.

"Exclusively" is the operative word. One channel between the two applications means the
separation in ARCHITECTURE §2 is enforceable — there is no second, shorter path for the
frontend to obtain data.

**Alternatives considered:**
- *GraphQL* — solves over-fetching and client-specified queries. This project has a single
  client with predictable needs; the schema and resolver overhead buys nothing.
- *tRPC* — excellent ergonomics, but requires TypeScript on both ends, which D-002 rules out.
- *WebSockets as the primary channel* — considered because investigations are long-running
  and live progress is desirable. Rejected as the *primary* channel; polling is adequate.
  Websockets may be added later for live investigation updates specifically, which would be
  an additive change, not a replacement.

**Trade-off accepted:** Some over-fetching, and potential extra round trips on
relationship-heavy pages. Acceptable at this scale.

---

## D-007 — Docker for deployment

**Date:** Phase 0
**Status:** Accepted

**Decision:** The system is containerised — frontend, backend, and PostgreSQL — and composed
with Docker Compose.

**Reasoning:**
Three components with different runtimes (Node, Python, PostgreSQL) make environment
reproducibility genuinely difficult by hand. Containers reduce setup for a reviewer to a
single command, which matters for a portfolio project where the barrier to someone actually
running it determines whether they ever see it.

A secondary benefit is architectural enforcement: the logical boundaries between frontend,
backend, and database become process boundaries. A coupling that violates the layering shows
up as a failure at runtime rather than as a quiet dependency in the code.

**Alternatives considered:**
- *Manual local setup with documented steps* — free, but fragile across machines.
- *Kubernetes* — vastly disproportionate. Explicitly listed as a non-goal.
- *Platform-specific deployment (Vercel + Railway)* — convenient, but ties the project to
  particular vendors and obscures the architecture.

**Trade-off accepted:** Docker must be installed, and container rebuild times slow the inner
development loop. Local development without containers remains supported for that reason;
Compose is for running and demonstrating the full system.

---

## D-008 — Git and GitHub for version control

**Date:** Phase 0
**Status:** Accepted

**Decision:** Git for version control, GitHub as the remote.

**Reasoning:**
Version control is a prerequisite for the phased development discipline in D-011 — a phase
that ends in a commit produces a checkpoint that can be returned to if the next phase goes
wrong. Without that, "small controlled phases" is an aspiration rather than a practice.

GitHub additionally serves the portfolio purpose: the commit history *is* part of the
artifact. A history showing sixteen coherent, well-described phases demonstrates working
method in a way the finished code cannot.

**Convention:** one commit per phase minimum, with a message naming the phase and its scope.
Work in progress may be committed more granularly, but each phase ends at a clean, working,
described state.

**Alternatives considered:** None seriously.

**Trade-off accepted:** None material.

---

## D-009 — Single agent first; multi-agent only if justified

**Date:** Phase 0
**Status:** Accepted

**Decision:** Start with one agent holding a broad toolset and a clear objective. Do not
build a multi-agent architecture. Revisit only if a concrete, demonstrated limitation of the
single-agent design requires it.

**Reasoning:**
Multi-agent architectures are frequently adopted because they sound sophisticated rather
than because a single agent has failed. They introduce real costs: inter-agent
communication, context fragmentation, coordination failure modes, harder debugging, and
significantly more expensive reasoning about what went wrong when an investigation produces
a bad conclusion.

The investigation task described in PROJECT_SPEC §5 is a single coherent line of inquiry.
One investigator forming and testing hypotheses against evidence is not merely adequate for
this — it is arguably the *correct* model of the work. Splitting it across a payment
specialist, an inventory specialist, and a coordinator would fragment exactly the
cross-system context that makes the investigation valuable. The insight in the reference
scenario — that normal attempted orders plus abnormal completed orders points at payments —
requires holding both facts at once.

Agent quality in this project will come from tool design, context construction, and prompt
quality. Those should be exhausted before architecture is added.

**Condition for revisiting:** a documented case where a single agent demonstrably fails —
context window exhaustion on realistic investigations, or a measured quality loss from
breadth of tooling. Speculation does not qualify. If revisited, this entry is superseded,
not deleted.

**Alternatives considered:**
- *Multi-agent from the start* — rejected as premature.
- *Fixed pipeline with no agency* — rejected as contrary to the project's central premise.

**Trade-off accepted:** May eventually hit a ceiling. Preferable to paying the coordination
cost before any ceiling is observed.

---

## D-010 — Modular architecture with enforced boundaries

**Date:** Phase 0
**Status:** Accepted

**Decision:** The system is organised into layers with explicit boundaries: frontend /
backend, API / domain / data access, agent / tool layer, Command Center state / NovaCommerce
simulation. Boundaries are enforced, not merely described.

**Reasoning:**
Modularity here serves specific, concrete purposes rather than being a general virtue:

*Safety.* The agent's inability to execute a write tool directly is an architectural
property, not a prompt instruction. Prompts are not a security boundary; structure is.

*Replaceability.* The NovaCommerce simulation sits behind the tool layer so it could be
replaced by real integrations. The agent sits behind the domain layer so it could be
replaced by a rules engine or a human.

*Testability.* The domain layer can be tested without an LLM. The tool layer can be tested
without an agent. The frontend can be built without a backend — which is precisely what
Phases 3–8 do.

*Auditability.* Every tool invocation passes through one layer, so recording it is a single
implementation rather than a discipline applied in many places.

The invariants in ARCHITECTURE §9 are the concrete expression of this decision. Violating
one is a design error, not a shortcut.

**Alternatives considered:**
- *Monolithic backend without internal layering* — faster initially, but the agent-safety
  property would rest on convention.
- *Microservices* — over-decomposition; listed as a non-goal.

**Trade-off accepted:** More indirection, and some code that feels like ceremony in simple
cases. Accepted because the safety and testability properties depend on it.

---

## D-011 — Small controlled development phases

**Date:** Phase 0
**Status:** Accepted

**Decision:** Development proceeds in sixteen defined phases. Each has explicit scope, is
tested locally, is committed, and ends before the next begins. Work outside the current
phase's scope is prohibited.

**Reasoning:**
The primary risk in a project of this scope built with AI assistance is not that any
individual piece is wrong — it is that scope expands invisibly. A session asked to build the
Incidents page adds a helpful refactor to the shell, adjusts a shared component, and renames
something for consistency. Each change is defensible. Together they make the project
impossible to reason about and impossible to bisect when it breaks.

Bounded phases fix this by making scope the primary constraint rather than a secondary
concern. Each phase produces a working, committed state. When something breaks, the phase in
which it broke is identifiable.

Three properties are load-bearing:

1. **Scope is explicit before work begins.** What is in, what is out, which files change.
2. **Each phase ends tested and committed.** Not "mostly working."
3. **A phase does not continue into the next.** Stopping is part of the phase.

The rule on out-of-scope observations: note it, do not fix it. Recording a problem costs
one line; fixing it costs the integrity of the phase boundary.

**Alternatives considered:**
- *Build continuously without phase boundaries* — the failure mode described above.
- *Fewer, larger phases* — larger blast radius, harder to test, harder to bisect.
- *More, smaller phases* — overhead begins to exceed the benefit.

**Trade-off accepted:** Slower in the short term, and occasionally a known problem is
knowingly left in place until the phase that owns it. Accepted.

---

## D-012 — UI built before backend, against isolated mock data

**Date:** Phase 0
**Status:** Accepted

**Decision:** Phases 3–8 build the user interface using mock data. Phase 10 replaces it with
real API calls. Mock data must live behind clearly isolated per-domain modules.

**Reasoning:**
Building the UI first forces data shapes to be decided from the consumer's side — the
backend is then built to serve what the interface actually needs, rather than the interface
being contorted to fit whatever the backend produced. For a project where the Investigations
page is the differentiating artifact, letting its display needs drive the investigation data
model is the right direction of influence.

It also produces something visible and demonstrable early, which matters across a sixteen-
phase project.

**The condition is not optional.** Mock data scattered inline through components turns Phase
10 into a rewrite, which would violate D-011 directly. The mock layer must be a small number
of obvious modules, one per domain, that Phase 10 deletes and replaces. Treat each as a
contract with a backend that does not yet exist.

**Alternatives considered:**
- *Backend first, then UI* — the UI would be shaped by the API rather than the reverse, and
  nothing would be visible until deep into the project.
- *Vertical slices (one feature end to end at a time)* — legitimate, and arguably better for
  production work, but requires backend, database, and AI foundations in place before
  anything is visible.

**Trade-off accepted:** Phase 10 carries integration risk concentrated into a single phase.
Mitigated by the isolation requirement and by TypeScript types acting as the contract.

---

## Open Questions

Not yet decided. Recorded so they are not forgotten, and resolved in the phase that needs
them.

| Question | Phase that must resolve it |
|---|---|
| Which LLM provider and model | Phase 11 |
| How investigation progress reaches the UI live — polling or websockets | Phase 10 or 13 |
| How risk thresholds for approval are defined and configured | Phase 14 |
| Whether the agent reads the Knowledge Base as a tool | Phase 12 or later |
| How incidents are automatically detected from metric anomalies | Phase 9 or 14 |
| Authentication approach | Phase 15 |
| Investigation step limit and termination heuristics | Phase 13 |
