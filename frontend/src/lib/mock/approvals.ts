/**
 * Mock data for the Approvals domain (Phase 6).
 *
 * Per DECISIONS.md D-012, UI phases (3–8) are built against isolated,
 * per-domain mock modules. Phase 10 deletes this file and replaces it with
 * real API calls. Nothing here is live — every approval, its evidence
 * summary, and any recorded decision is hand-written demo content, not the
 * output of a real agent or a real human action.
 *
 * Per CURRENT_STATE.md's Phase 6 preview note, an Approval is a thin
 * wrapper around a Recommendation (lib/mock/investigations.ts) — it
 * references the investigation/incident it came from by id rather than
 * re-stating the same reasoning under new field names — plus the decision
 * itself (approved/rejected, by whom, when). `INV-1042` and `INV-1041` are
 * the two investigations already sitting at `awaiting_approval`; the first
 * two entries below are their pending approvals. The remaining entries are
 * additional realistic NovaCommerce examples covering the other statuses
 * and risk levels, so every part of this page's UI (filters, statuses,
 * risk levels, evidence, decision history) has something real to show.
 *
 * `affectedSystem` reuses the exact `AffectedSystem` type already defined
 * in lib/mock/incidents.ts (Phase 4) so a system reads as the same system
 * everywhere in the app — a type-only import, not a modification of that
 * file.
 */

import type { AffectedSystem } from "@/lib/mock/incidents";
import { DEMO_NOW } from "@/lib/mock/time";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export type RiskLevel = "critical" | "high" | "medium" | "low";

/** A single evidence-summary metric shown on the approval detail page —
 * simulated demo figures, clearly labeled as such wherever they render. */
export interface EvidenceMetric {
  label: string;
  value: string;
}

/** What a future real audit record could contain. UI-only in Phase 6 — no
 * persistence. For a still-`pending` approval this is absent; for demo
 * `approved`/`rejected` entries it is pre-filled so the Audit Preview has
 * something real to display without the person taking any action first. */
export interface ApprovalDecision {
  decision: "approved" | "rejected";
  decisionBy: string;
  /** ISO 8601. */
  decisionAt: string;
  comment: string;
}

export interface Approval {
  id: string;
  incidentId: string;
  /** Absent when the requested action isn't tied to a specific investigation
   * record (e.g. it was raised directly from an incident). */
  investigationId?: string;
  title: string;
  description: string;
  requestedAction: string;
  reason: string;
  /** A few concise, structured bullets a human can scan quickly — not a
   * model's chain-of-thought, just the observations and conclusion that led
   * here. Mirrors the "concise structured findings/evidence" instruction. */
  relevantEvidence: string[];
  observedImpact: string;
  expectedBenefit: string;
  riskConsiderations: string;
  evidenceSummary: EvidenceMetric[];
  potentialDownside: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  affectedSystem: AffectedSystem;
  requestedBy: string;
  /** ISO 8601. */
  requestedAt: string;
  /** ISO 8601. Absent only if an action genuinely never expires (none do here). */
  expiresAt: string;
  /** Present for approvals already decided in this demo dataset (approved,
   * rejected, or expired). Absent for `pending` approvals — the person's own
   * Approve/Reject click in the UI creates a local-only decision, never
   * written back here. */
  decision?: ApprovalDecision;
}

export function getApprovalById(id: string): Approval | undefined {
  return APPROVALS.find((approval) => approval.id === id);
}

/**
 * Formats an expiry timestamp relative to the shared DEMO_NOW instant
 * (lib/mock/time.ts). Unlike `formatRelativeToDemoNow` — written for
 * timestamps that have already happened — an `expiresAt` is usually still
 * in the future, so this handles both directions explicitly rather than
 * reusing that helper and silently mislabeling a still-open expiry window
 * as "Just now."
 */
export function formatExpiry(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - DEMO_NOW.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= 0) return "Expired";
  if (diffMinutes < 60) return `Expires in ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"}`;

  const diffHours = Math.round(diffMinutes / 60);
  return `Expires in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
}

export const APPROVALS: Approval[] = [
  {
    id: "APR-3001",
    incidentId: "INC-2031",
    investigationId: "INV-1042",
    title: "Switch payment traffic to backup gateway",
    description:
      "The primary payment gateway is degraded and failing a significant share of card-payment authorizations. The investigation recommends failing affected traffic over to the healthy backup gateway.",
    requestedAction: "Switch affected payment traffic to the backup gateway.",
    reason:
      "The backup gateway is healthy and can absorb card-payment traffic while the primary gateway is degraded.",
    relevantEvidence: [
      "Payment failure rate elevated to 27%, against a 7-day baseline of 2%.",
      "Completed orders down 34% while attempted orders remain at baseline.",
      "Primary gateway returning elevated 5xx errors concentrated on card-payment authorization calls.",
    ],
    observedImpact:
      "Checkout completion is down sharply and revenue is tracking well below forecast while the primary gateway stays degraded.",
    expectedBenefit:
      "Payment failure rate and completed-order volume should return to baseline within minutes of the switch.",
    riskConsiderations:
      "The backup gateway carries a slightly higher per-transaction processing fee and has not handled this volume of traffic today; a rollback path exists if it also degrades.",
    evidenceSummary: [
      { label: "Payment failure rate", value: "+25 pts (27% vs. 2% baseline)" },
      { label: "Gateway error rate", value: "+27% (5xx responses)" },
      { label: "Revenue impact", value: "-18.4% vs. forecast" },
    ],
    potentialDownside:
      "Brief additional checkout friction during cutover, and higher processing fees on the backup gateway until the primary is restored.",
    riskLevel: "critical",
    status: "pending",
    affectedSystem: "Payment Processing",
    requestedBy: "AI Investigation Agent",
    requestedAt: "2026-09-18T09:38:00Z",
    expiresAt: "2026-09-18T10:38:00Z",
  },
  {
    id: "APR-3002",
    incidentId: "INC-2030",
    investigationId: "INV-1041",
    title: "Trigger manual inventory re-sync — West Coast warehouse",
    description:
      "A temporary lag in the inventory sync job delayed dispatch for roughly 40 orders at the West Coast warehouse. The investigation recommends forcing an immediate re-sync rather than waiting for the next scheduled run.",
    requestedAction: "Trigger a manual inventory re-sync for the West Coast warehouse.",
    reason: "A forced re-sync clears the backlog immediately rather than waiting for the next scheduled run.",
    relevantEvidence: [
      "Sync job latency rose to several times its normal duration during the affected window.",
      "All ~40 delayed orders originate from the West Coast warehouse and fall inside the sync-lag window.",
    ],
    observedImpact: "Roughly 40 orders are delayed past their fulfillment SLA and dispatch is still lagging.",
    expectedBenefit: "Affected orders should move to \"processing\" within the next sync cycle after a forced re-sync.",
    riskConsiderations:
      "A manual re-sync briefly increases load on the inventory service; low risk given the warehouse's current traffic.",
    evidenceSummary: [
      { label: "Orders delayed past SLA", value: "~40 orders" },
      { label: "Sync latency", value: "+ several × normal duration" },
      { label: "Affected warehouse", value: "West Coast" },
    ],
    potentialDownside: "A short additional load spike on the inventory sync service during the forced run.",
    riskLevel: "medium",
    status: "pending",
    affectedSystem: "Inventory Management",
    requestedBy: "AI Investigation Agent",
    requestedAt: "2026-09-18T09:15:00Z",
    expiresAt: "2026-09-18T11:15:00Z",
  },
  {
    id: "APR-3003",
    incidentId: "INC-2029",
    title: "Pause the order-confirmation notification integration",
    description:
      "Multiple customers have reported missing order-confirmation and shipping-update emails. Pausing the notification integration stops further silent failures while the underlying delivery issue is diagnosed.",
    requestedAction: "Pause the order-confirmation notification integration.",
    reason:
      "Pausing prevents more customers from silently missing confirmation emails while the root cause is still being investigated.",
    relevantEvidence: [
      "Several customers reported completed orders with no confirmation or shipping-update email received.",
      "The investigation into the delivery failure is currently paused pending log access.",
    ],
    observedImpact:
      "An unknown but growing number of customers are not receiving order confirmations, risking support volume and customer trust.",
    expectedBenefit:
      "No further customers are silently affected while the notification-service issue is diagnosed and fixed.",
    riskConsiderations:
      "Pausing the integration means no customer will receive a confirmation email at all until it's resumed — a deliberate short-term tradeoff.",
    evidenceSummary: [
      { label: "Customer reports (missing email)", value: "6 reports in 2 hours" },
      { label: "Confirmed delivery failures", value: "Unconfirmed — log access pending" },
      { label: "Affected channel", value: "Order confirmation & shipping updates" },
    ],
    potentialDownside: "No customer receives any confirmation email — including unaffected ones — while paused.",
    riskLevel: "high",
    status: "pending",
    affectedSystem: "Notification Service",
    requestedBy: "AI Investigation Agent",
    requestedAt: "2026-09-18T09:45:00Z",
    expiresAt: "2026-09-18T12:45:00Z",
  },
  {
    id: "APR-3004",
    incidentId: "INC-2023",
    investigationId: "INV-1036",
    title: "Roll back the canary deployment",
    description:
      "The canary release's error rate exceeded the automatic comparison threshold against the stable release. The investigation could not isolate a specific cause before the canary window closed, so a rollback was proposed as a precaution.",
    requestedAction: "Roll back the canary deployment to the last known-good release.",
    reason: "The canary's error rate is elevated and its cause could not be isolated before the canary window closed.",
    relevantEvidence: [
      "The canary slice's error rate exceeded the automatic comparison threshold against the stable release.",
      "The investigation could not obtain a large enough error sample to isolate a specific cause.",
    ],
    observedImpact: "A small slice of production traffic is seeing an elevated error rate on the canary release.",
    expectedBenefit: "Reverting to the known-good release removes the elevated error rate for affected traffic.",
    riskConsiderations:
      "Without an isolated cause, a rollback is precautionary rather than confirmed — the on-call engineer judged the change set low-risk enough to keep and monitor instead.",
    evidenceSummary: [
      { label: "Canary error rate", value: "Above automatic threshold" },
      { label: "Error sample size", value: "Insufficient to isolate cause" },
      { label: "Traffic slice affected", value: "Canary only" },
    ],
    potentialDownside: "Losing the canary's intended feature/change ahead of a confirmed root cause.",
    riskLevel: "high",
    status: "rejected",
    affectedSystem: "Deployment Pipeline",
    requestedBy: "AI Investigation Agent",
    requestedAt: "2026-09-18T09:21:00Z",
    expiresAt: "2026-09-18T11:21:00Z",
    decision: {
      decision: "rejected",
      decisionBy: "J. Alvarez (On-call Engineer)",
      decisionAt: "2026-09-18T09:50:00Z",
      comment:
        "Change set reviewed manually and judged low-risk. Keeping the canary running with closer manual monitoring instead of a full rollback.",
    },
  },
  {
    id: "APR-3005",
    incidentId: "INC-2028",
    investigationId: "INV-1040",
    title: "Retry failed order synchronization batch",
    description:
      "The order-processing queue is filling faster than it drains, without processing errors, delaying standard-shipping orders past SLA. Retrying the stalled synchronization batch clears the immediate backlog.",
    requestedAction: "Retry the stalled order-synchronization batch.",
    reason: "A manual retry clears the current backlog without waiting for the queue to drain on its own.",
    relevantEvidence: [
      "Order-processing queue depth is roughly 3x its usual mid-morning level and still climbing.",
      "The service is processing orders without errors — just more slowly than the queue is filling.",
    ],
    observedImpact: "Standard-shipping orders are at risk of missing their processing SLA as the queue backs up.",
    expectedBenefit: "Retrying the batch reduces queue depth and brings affected orders back within SLA.",
    riskConsiderations: "Retrying an in-flight batch risks a small number of duplicate processing attempts.",
    evidenceSummary: [
      { label: "Queue depth", value: "~3× normal, still climbing" },
      { label: "Processing errors", value: "None observed" },
      { label: "Orders at SLA risk", value: "Standard shipping tier" },
    ],
    potentialDownside: "A small chance of duplicate processing on orders already mid-batch.",
    riskLevel: "medium",
    status: "approved",
    affectedSystem: "Order Management",
    requestedBy: "AI Investigation Agent",
    requestedAt: "2026-09-18T08:55:00Z",
    expiresAt: "2026-09-18T10:55:00Z",
    decision: {
      decision: "approved",
      decisionBy: "M. Chen (Operations Lead)",
      decisionAt: "2026-09-18T09:05:00Z",
      comment: "Approved — low downside, and the queue is trending the wrong way.",
    },
  },
  {
    id: "APR-3006",
    incidentId: "INC-2026",
    investigationId: "INV-1039",
    title: "Renew the backup payment gateway's TLS certificate",
    description:
      "An automated check flagged the backup payment gateway's TLS certificate as due to expire within 72 hours. Renewing it now prevents losing the payment failover path before it's needed.",
    requestedAction: "Renew the backup gateway's TLS certificate.",
    reason: "Prevent loss of the payment failover path before it is needed.",
    relevantEvidence: ["The backup gateway integration's certificate was due to expire in under 72 hours."],
    observedImpact: "No current customer impact — this is a preventive action ahead of an active failure.",
    expectedBenefit: "The backup gateway remains available as a failover option with no interruption.",
    riskConsiderations: "Routine renewal with an established procedure; minimal risk.",
    evidenceSummary: [
      { label: "Certificate expiry window", value: "< 72 hours" },
      { label: "Current failover availability", value: "Unaffected" },
    ],
    potentialDownside: "None expected — a brief certificate rotation on an already-healthy path.",
    riskLevel: "low",
    status: "approved",
    affectedSystem: "Payment Processing",
    requestedBy: "AI Investigation Agent",
    requestedAt: "2026-09-17T18:45:00Z",
    expiresAt: "2026-09-17T22:45:00Z",
    decision: {
      decision: "approved",
      decisionBy: "M. Chen (Operations Lead)",
      decisionAt: "2026-09-17T19:00:00Z",
      comment: "Approved — routine renewal, no concerns.",
    },
  },
  {
    id: "APR-3007",
    incidentId: "INC-2027",
    title: "Restart the storefront web tier",
    description:
      "A brief 502 error spike aligned with a CDN failover triggered by a traffic surge. A precautionary storefront-tier restart was proposed but the error rate self-resolved before a human reviewed the request.",
    requestedAction: "Restart the storefront web tier as a precaution.",
    reason: "A restart was proposed as a precaution in case the 502 spike did not self-resolve.",
    relevantEvidence: [
      "A subset of visitors received HTTP 502 responses for roughly 90 seconds.",
      "Traffic volume crossed the automatic CDN failover threshold at the same moment as the error spike.",
    ],
    observedImpact: "A brief, self-resolving error spike affecting a subset of storefront visitors.",
    expectedBenefit: "Would have cleared any lingering error state on the web tier, had it still been needed.",
    riskConsiderations: "A restart briefly interrupts any in-flight requests on the web tier.",
    evidenceSummary: [
      { label: "502 error window", value: "~90 seconds" },
      { label: "Cause", value: "Expected CDN failover behavior" },
    ],
    potentialDownside: "Brief interruption to in-flight requests during the restart.",
    riskLevel: "low",
    status: "expired",
    affectedSystem: "Website Health & Uptime",
    requestedBy: "AI Investigation Agent",
    requestedAt: "2026-09-17T18:20:00Z",
    expiresAt: "2026-09-17T18:35:00Z",
  },
];
