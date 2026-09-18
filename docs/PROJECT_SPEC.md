# PROJECT_SPEC.md

**Status:** Phase 0 — Blueprint. This document describes intent, not implemented behaviour.

---

## 1. Project Name

**AI Operations Command Center**

Subtitle: *Autonomous Business Incident Investigation & Resolution System*

Operated by (fictional) **NovaCommerce**.

---

## 2. Project Purpose

The AI Operations Command Center is an internal operations platform. It takes a business
problem — either reported by a human or detected automatically — and drives it through a
complete lifecycle: investigation, root cause identification, recommended action, human
approval where required, execution, verification, and a final written report.

The defining goal is that the system behaves like an **AI operations employee**, not a
chatbot. The difference matters and is worth stating precisely:

| A chatbot | An AI operations employee |
|---|---|
| Answers the question asked | Decides what question to ask next |
| Responds to a prompt | Responds to a *signal* (a metric moved) |
| Produces text | Produces evidence, a conclusion, and an action |
| Has no memory of consequence | Is accountable — every step is recorded and auditable |
| Ends at the answer | Ends at *verified resolution* |

The system is judged on whether the problem went away, not on whether the response sounded
plausible.

---

## 3. NovaCommerce Context

NovaCommerce is a fictional mid-size e-commerce company used as the operating environment
for this project. It exists so the Command Center has realistic business systems to
investigate.

NovaCommerce is assumed to run:

- A storefront and checkout
- An order management system
- A payment processing integration (with at least a primary and a backup gateway)
- Inventory management
- A customer support / complaints channel
- Website health and uptime monitoring
- A deployment pipeline with a release history

**Important scoping note:** the NovaCommerce shopping website is *not* the product being
built. It is simulated. The Command Center consumes NovaCommerce business data through the
backend — via simulated systems, APIs, and database tables — and never by being the
storefront itself.

The simulation must eventually be capable of producing *realistic incidents*, meaning
faults that ripple across systems the way real faults do. The canonical example:

```
Payment gateway begins failing
  → payment failure rate rises
  → successful orders fall
  → revenue falls
  → the sales drop becomes visible on the Dashboard
  → the AI investigates the sales drop
  → and traces it back to payments
```

The value of the simulation is that the *symptom* and the *cause* live in different
systems. The AI has to actually find the connection.

---

## 4. Main User Problem

The people running operations at a company like NovaCommerce face a recurring problem:

1. A metric moves in the wrong direction.
2. Nobody knows why.
3. Finding out requires manually checking five or six different systems.
4. The person who knows which system to check next is busy, or asleep, or gone.
5. Time passes. The problem continues costing money while it is being diagnosed.
6. Once the fix is found, nobody writes down what happened, so the next occurrence starts
   the whole process over again.

The Command Center targets the expensive middle: the gap between *noticing* and
*understanding*. It compresses the cross-system investigation that would otherwise consume
an experienced operator's attention, and it leaves behind a durable written record so the
same incident is cheaper the second time.

Secondary problems addressed:

- **Inconsistent investigation quality.** Different people check different things. The
  system applies the same rigour every time.
- **No audit trail.** Decisions made in chat threads are lost. Here every step is recorded.
- **Unsafe automation.** Purely automatic remediation is unacceptable for actions with
  business consequences. Human approval is a first-class part of the workflow, not an
  afterthought.

---

## 5. Core Workflow

The system's central loop. Every incident passes through these stages, though not all
stages are reached in every case (an investigation may terminate at "no action required").

```
  ┌─────────────┐
  │   Problem   │  detected by monitoring, or reported by a human
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ Investigate │  agent decides which systems to examine, and in what order
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   Collect   │  each tool call returns evidence, which is recorded
  │  Evidence   │  ◄──┐
  └──────┬──────┘     │  loop: evidence may prompt further investigation
         ▼            │
  ┌─────────────┐     │
  │  Identify   │─────┘
  │ Root Cause  │  with a stated confidence level
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Recommend  │  a specific, concrete action
  │   Action    │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   Request   │  required for actions above a risk threshold
  │  Approval   │  a human approves, rejects, or modifies
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   Execute   │  the action is performed against the target system
  │   Action    │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   Verify    │  did the original symptom actually recover?
  │   Result    │  ◄── if not, the incident reopens and returns to Investigate
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   Final     │  what happened, what was found, what was done, what it cost
  │   Report    │
  └─────────────┘
```

### The worked example

The scenario the project is designed around:

1. Sales for the day are meaningfully below expectation.
2. The AI checks sales data. Confirms the drop is real and quantifies it.
3. It examines order data and notices that *attempted* orders are normal but *completed*
   orders are down. The funnel is breaking late, not early.
4. It checks the payment system. Payment failure rate is elevated.
5. It checks customer complaints. Recent complaints mention checkout errors — corroborating
   evidence from an independent source.
6. It checks recent deployments. Either finds a suspicious release, or finds none, which
   itself is informative.
7. It concludes: the primary payment gateway is failing.
8. It recommends switching to the backup gateway.
9. Because this action affects live revenue processing, it requests human approval.
10. On approval, the switch is executed.
11. It waits, then re-checks payment success rate and sales. Did they recover?
12. It writes the incident report.

Step 3 is the one that matters most. A fixed pipeline would check every system in a
predetermined order. An agent notices that attempted orders are normal, and *therefore*
looks at payments rather than at marketing or traffic. The reasoning drives the next step.

---

## 6. Website Pages

One web application, eleven pages. Not eleven applications.

| # | Page | Purpose |
|---|---|---|
| 1 | **Dashboard** | Overall operational health at a glance: active incidents, system status, key business metrics, and current AI activity. The landing page and the place a problem is first noticed. |
| 2 | **Incidents** | The record of business problems, detected or reported. List and detail views. The incident is the organising object of the whole system. |
| 3 | **Investigations** | How the AI worked a given incident: the step-by-step timeline, the evidence gathered at each step, the findings, the root cause, and the confidence in it. This is where the system's reasoning becomes legible. |
| 4 | **Actions** | Actions recommended or executed by the AI, their status, their target system, and their outcome. |
| 5 | **Approvals** | The human-in-the-loop queue. Actions awaiting authorisation, with enough context for a human to decide responsibly. |
| 6 | **Systems & Tools** | The business systems the agent can reach and the tools it can invoke against them. Shows capability and health. |
| 7 | **Knowledge Base** | Company documentation, policies, runbooks, and operational knowledge — reference material for both humans and, eventually, the agent. |
| 8 | **Analytics** | Operational metrics (incident volume, time to resolution) and AI performance metrics (root cause accuracy, approval rate, verification success). |
| 9 | **Reports** | Final investigation and resolution reports. The durable, readable artifact of a closed incident. |
| 10 | **Audit Logs** | Chronological record of significant system, user, and AI activity. Append-only in spirit. |
| 11 | **Settings** | Application configuration, users, permissions, thresholds, and system settings. |

---

## 7. Domain Concepts

These terms are used precisely throughout the project. Confusing them — particularly
Incident with Investigation, or Recommendation with Action — produces confused data models
and confused UI later.

### Incident
**The business problem itself, as a record.** A thing that is wrong. "Sales down 34% versus
forecast on 2026-03-14." An Incident has a lifecycle status (open, investigating, awaiting
approval, resolved, closed), a severity, a detection source, and a time of detection. It
exists independently of whether anyone has looked into it yet.

*An Incident is a noun. It is the problem, not the work on the problem.*

### Investigation
**The process of understanding and resolving an Incident.** An Investigation belongs to an
Incident. It is the agent's work session: an ordered series of steps, each with a
reasoning, a tool invoked, and evidence returned. One Incident may in principle have more
than one Investigation (for example, if it reopens after a failed verification).

*An Investigation is a verb made into a record. It is the work.*

### Evidence
**A piece of information collected during an Investigation.** Always attributable: it came
from a specific system, at a specific time, via a specific tool call. Evidence is factual
output, not interpretation. "Payment failure rate over the last 4 hours was 31%, against a
7-day baseline of 2%" is evidence. "Payments are broken" is not.

Evidence is what makes a conclusion checkable by a human afterwards.

### Root Cause
**The most likely underlying reason for the Incident**, as concluded from the Evidence.
Carries an explicit confidence level and the specific evidence that supports it. Must be
distinguished from a symptom: "sales are down" is the incident; "the primary payment
gateway is returning errors" is the root cause.

A Root Cause may be provisional, and may be wrong. The system states confidence rather than
asserting certainty.

### Recommendation
**An action suggested by the AI**, not yet performed. Includes what to do, why it addresses
the root cause, what the expected effect is, and an assessment of risk. A Recommendation is
a proposal. Nothing has happened yet.

### Approval
**Human authorisation for a Recommendation to become an Action.** Required when the action's
risk exceeds a configured threshold. An Approval records who decided, when, what they
decided (approve / reject / modify), and optionally why. The absence of an approval is
itself meaningful and is recorded.

### Action
**The actual operation performed** against a target system. This is the point at which the
world changes. An Action has a status (pending, executing, succeeded, failed), a target, the
parameters it was executed with, and a result. An Action is always traceable back to the
Recommendation that proposed it and the Approval that authorised it, if one was required.

*Recommendation is intent. Action is effect. Keeping them separate is what makes the
approval gate meaningful.*

### Verification
**The check of whether the Action actually resolved the Incident.** Performed after
execution, against the original symptom. Verification is what separates this system from
one that merely *claims* to have fixed things. A failed verification is a legitimate and
important outcome: it should reopen the incident rather than be quietly dropped.

### Report
**The final summary of a complete incident lifecycle.** Written for a human who was not
present: what happened, what was found, what was done, whether it worked, and what should
be done differently. The Report is the artifact that outlives the incident and feeds the
Knowledge Base.

### Relationships at a glance

```
Incident
  └── Investigation (1..n)
        ├── Step (1..n)
        │     └── Evidence (0..n)
        └── Root Cause (0..1, with confidence)
              └── Recommendation (0..n)
                    ├── Approval (0..1)
                    └── Action (0..1)
                          └── Verification (0..1)
Incident
  └── Report (0..1)
```

---

## 8. Future Capabilities

Directionally intended, explicitly *not* committed to for the initial build. Listed so that
present decisions do not foreclose them.

**Investigation depth**
- Multi-hypothesis reasoning — pursuing two candidate root causes in parallel and
  discriminating between them with targeted evidence.
- Correlation across historical incidents: "this looks like INC-0042 from last month."
- Confidence calibration measured against verified outcomes over time.

**Autonomy**
- Automatic detection of incidents from metric anomalies, rather than only human reporting.
- Tiered autonomy: low-risk actions executed without approval, high-risk always gated,
  with the boundary configurable per organisation.
- Proactive investigation of leading indicators before they become incidents.

**Knowledge**
- The agent reading the Knowledge Base as part of investigation — runbooks as tools.
- Automatic Knowledge Base contribution from resolved incidents.
- Learning which tools are informative for which symptom classes.

**Scale and architecture**
- Multi-agent decomposition, *only if* a concrete limitation of the single-agent design
  justifies it. See DECISIONS.md.
- Multiple concurrent investigations.
- Real integrations replacing simulated NovaCommerce systems.

**Operations**
- Notification and escalation channels.
- Scheduled reporting.
- Role-based access control beyond basic permissions.

---

## 9. Non-Goals

Stating these explicitly prevents scope drift. These are things the project deliberately
does **not** attempt.

1. **Building an e-commerce store.** NovaCommerce's storefront is simulated data, not a
   product. No product catalogue UI, no cart, no checkout flow for end customers.

2. **Being a general-purpose chatbot.** The system investigates operational incidents. It is
   not a conversational assistant for arbitrary queries.

3. **Being a monitoring/APM product.** It consumes signals; it does not aim to replace
   Datadog, Grafana, or Sentry. Detection is a thin layer, not the point.

4. **Full autonomy without human oversight.** The approval gate is a permanent design
   feature, not a temporary limitation to be removed later.

5. **Training or fine-tuning models.** The AI layer uses an LLM API with tool calling.
   Model development is out of scope.

6. **Multi-tenancy.** One organisation, NovaCommerce. No tenant isolation, no billing, no
   per-tenant configuration.

7. **Real-time streaming architecture.** Request/response over REST is sufficient. No
   event-bus, no Kafka, no websocket-first design unless a specific need emerges.

8. **Mobile applications.** A responsive web application only.

9. **Microservices.** A separated frontend and a single backend service. Separation of
   concerns is required; service decomposition is not.

10. **Production-grade security hardening.** This is a portfolio project. Authentication and
    permissions are modelled honestly, but penetration-hardening, compliance certification,
    and secrets-management infrastructure are out of scope.

---

## 10. What "Done" Looks Like

For clarity on the target, the project is complete when a user can:

1. Open the Dashboard and see that NovaCommerce's sales have dropped.
2. Open the resulting Incident.
3. Watch — or read back — the AI's Investigation: each step, why it took that step, and what
   it found.
4. See a stated Root Cause with supporting Evidence and a confidence level.
5. See a Recommendation waiting in the Approvals queue with enough context to judge it.
6. Approve it.
7. See the Action execute against the simulated payment system.
8. See Verification confirm that payment success rate and sales recovered.
9. Read the final Report.
10. Find every one of those steps recorded in the Audit Log.

If a reviewer can follow that path end to end and believe it, the project has succeeded.
