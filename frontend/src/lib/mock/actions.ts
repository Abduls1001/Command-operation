/**
 * Mock data for the Actions domain (Phase 7).
 *
 * Per DECISIONS.md D-012, UI phases (3–8) are built against isolated,
 * per-domain mock modules. Phase 10 deletes this file and replaces it with
 * real API calls. Nothing here is live: no action in this file has ever
 * been executed, no execution timestamp came from a real run, and no
 * verification result was really observed. Every value is hand-written
 * demo content.
 *
 * An Action is the operational step that follows an Approval, completing
 * the chain the project is built around:
 *
 *   Incident → Investigation → Recommendation → Approval → Action → Verification
 *
 * So, like Phase 6's Approval, an Action is a thin record that *references*
 * what came before it (`incidentId` / `investigationId` / `approvalId`)
 * rather than re-stating the same reasoning under new field names. Every id
 * referenced below is a real record in lib/mock/incidents.ts,
 * lib/mock/investigations.ts, or lib/mock/approvals.ts, and every action's
 * state is consistent with the state of the approval it came from — an
 * action whose approval is still `pending` is `pending_approval` here, and
 * the action behind the rejected approval APR-3004 is `cancelled`.
 *
 * `affectedSystem` (from lib/mock/incidents.ts) and `RiskLevel` (from
 * lib/mock/approvals.ts) are reused as type-only imports rather than
 * redefined, so a system and a risk level read as the same thing
 * everywhere in the app. Neither of those files was modified.
 *
 * Some low-risk actions carry no `approvalId`: they fall below the
 * configurable approval threshold PROJECT_SPEC/DEVELOPMENT_PLAN Phase 14
 * describes, and are recorded as automatically approved. They are marked
 * with `approvalRequired: false` and an explicit `approvedBy`, so the UI
 * never implies a human reviewed something no human saw.
 */

import type { RiskLevel } from "@/lib/mock/approvals";
import type { AffectedSystem } from "@/lib/mock/incidents";

export type ActionStatus =
  | "pending_approval"
  | "approved"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled";

export type VerificationStatus = "not_started" | "pending" | "passed" | "failed";

/** The kind of operational change an action performs. Kept as a small,
 * closed list so the table's "Action Type" column stays scannable. */
export type ActionType =
  | "Traffic Failover"
  | "Data Re-sync"
  | "Integration Pause"
  | "Deployment Rollback"
  | "Batch Retry"
  | "Capacity Scaling"
  | "Configuration Change"
  | "Certificate Renewal"
  | "Cache Purge";

/** One entry in an action's chronological history. Static demo content. */
export interface ActionEvent {
  id: string;
  /** ISO 8601. */
  timestamp: string;
  title: string;
  description: string;
}

/** The simulated verification of an action's effect — what the system
 * expected to see afterwards, and what it "observed". Present even before
 * verification runs, so the expected result can be shown up front. */
export interface ActionVerification {
  status: VerificationStatus;
  expectedResult: string;
  /** Absent until verification has actually produced an observation. */
  observedResult?: string;
  /** ISO 8601. Absent until verification has run. */
  verifiedAt?: string;
}

export interface Action {
  id: string;
  incidentId: string;
  /** Absent when the action wasn't raised from a specific investigation. */
  investigationId?: string;
  /** Absent for actions below the approval threshold (see `approvalRequired`). */
  approvalId?: string;
  title: string;
  description: string;
  actionType: ActionType;
  affectedSystem: AffectedSystem;
  riskLevel: RiskLevel;
  status: ActionStatus;

  /** Why this action was recommended — concise, structured context only. */
  reason: string;
  /** What approving and executing it is expected to achieve. */
  expectedOutcome: string;
  /** A few scannable bullets from the investigation that led here. Not a
   * model's chain-of-thought — just the observations behind the request. */
  evidenceSummary: string[];

  /** False for low-risk actions auto-approved below the threshold. */
  approvalRequired: boolean;
  /** Who (or what) approved it. Absent while still pending or cancelled. */
  approvedBy?: string;
  /** What would carry out the action once execution exists (Phase 14). */
  executor: string;
  /** Why a failed action failed, or a note on a cancelled one. */
  executionNote?: string;

  /** ISO 8601. When the action was recommended. */
  requestedAt: string;
  /** ISO 8601. Absent while pending approval or cancelled. */
  approvedAt?: string;
  /** ISO 8601. Absent until execution starts. */
  startedAt?: string;
  /** ISO 8601. Absent until execution finishes (successfully or not). */
  completedAt?: string;

  verification: ActionVerification;
  timeline: ActionEvent[];
}

export function getActionById(id: string): Action | undefined {
  return ACTIONS.find((action) => action.id === id);
}

/**
 * The six-node action lifecycle from the Phase 7 brief:
 * Recommended → Approval → Approved → Execution → Verification → Completed.
 * Presentation only — nothing advances a stage, it is read from the
 * action's own static status.
 */
export const ACTION_LIFECYCLE_STAGES = [
  "Recommended",
  "Approval",
  "Approved",
  "Execution",
  "Verification",
  "Completed",
] as const;

/**
 * Where an action currently sits on that lifecycle. A `completed` action
 * that hasn't been verified yet stops at Verification rather than claiming
 * the final node — the point of the verification step is that "executed"
 * and "confirmed working" are not the same thing.
 */
const LIFECYCLE_INDEX_BY_STATUS: Record<Exclude<ActionStatus, "completed">, number> = {
  pending_approval: 1, // sitting at Approval
  approved: 2, // Approved — queued, not yet executing
  executing: 3, // Execution
  failed: 3, // stopped at Execution
  cancelled: 1, // never got past Approval
};

export function lifecycleIndexOf(action: Action): number {
  if (action.status === "completed") {
    const verified =
      action.verification.status === "passed" || action.verification.status === "failed";
    return verified ? 5 : 4;
  }
  return LIFECYCLE_INDEX_BY_STATUS[action.status];
}

/**
 * Human-readable execution duration between two ISO timestamps. Returns
 * undefined when the action hasn't finished, so callers can show an
 * honest "—" rather than a fabricated figure.
 */
export function formatDuration(startedAt?: string, completedAt?: string): string | undefined {
  if (!startedAt || !completedAt) return undefined;

  const seconds = Math.round(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );
  if (seconds < 0) return undefined;
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  const minutePart = `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return remainder === 0 ? minutePart : `${minutePart} ${remainder}s`;
}

export const ACTIONS: Action[] = [
  {
    id: "ACT-4001",
    incidentId: "INC-2031",
    investigationId: "INV-1042",
    approvalId: "APR-3001",
    title: "Switch payment traffic to backup gateway",
    description:
      "Fail card-payment authorization traffic over from the degraded primary gateway to the healthy backup gateway, until the primary is restored.",
    actionType: "Traffic Failover",
    affectedSystem: "Payment Processing",
    riskLevel: "critical",
    status: "pending_approval",
    reason:
      "The primary payment gateway is degraded and failing a large share of card-payment authorizations; the backup gateway is healthy and can absorb the traffic.",
    expectedOutcome:
      "Payment failure rate returns to its ~2% baseline and completed-order volume recovers within minutes of the switch.",
    evidenceSummary: [
      "Payment failure rate elevated to 27%, against a 7-day baseline of 2%.",
      "Completed orders down 34% while attempted orders remain at baseline.",
      "Primary gateway returning elevated 5xx errors on card-payment authorization calls.",
    ],
    approvalRequired: true,
    executor: "Payment Operations Tool (not yet implemented)",
    requestedAt: "2026-09-18T09:38:00Z",
    verification: {
      status: "not_started",
      expectedResult:
        "Payment success rate returns to the normal range and completed-order volume recovers.",
    },
    timeline: [
      {
        id: "ACT-4001-E1",
        timestamp: "2026-09-18T09:38:00Z",
        title: "Recommendation created",
        description:
          "Investigation INV-1042 identified the degraded primary gateway as the root cause and recommended failing over.",
      },
      {
        id: "ACT-4001-E2",
        timestamp: "2026-09-18T09:38:00Z",
        title: "Approval requested",
        description: "Raised as APR-3001 — critical risk, human authorization required.",
      },
    ],
  },
  {
    id: "ACT-4002",
    incidentId: "INC-2030",
    investigationId: "INV-1041",
    approvalId: "APR-3002",
    title: "Trigger manual inventory re-sync — West Coast warehouse",
    description:
      "Force an immediate inventory synchronization run for the West Coast warehouse rather than waiting for the next scheduled cycle.",
    actionType: "Data Re-sync",
    affectedSystem: "Inventory Management",
    riskLevel: "medium",
    status: "pending_approval",
    reason:
      "A sync-job lag left roughly 40 orders undispatched; a forced re-sync clears the backlog immediately instead of waiting for the next scheduled run.",
    expectedOutcome:
      "Affected orders move to \u201cprocessing\u201d within the next sync cycle and dispatch returns to its normal rate.",
    evidenceSummary: [
      "Sync job latency rose to several times its normal duration during the affected window.",
      "All ~40 delayed orders originate from the West Coast warehouse and fall inside that window.",
    ],
    approvalRequired: true,
    executor: "Inventory Operations Tool (not yet implemented)",
    requestedAt: "2026-09-18T09:15:00Z",
    verification: {
      status: "not_started",
      expectedResult: "Delayed order count for the West Coast warehouse returns to zero.",
    },
    timeline: [
      {
        id: "ACT-4002-E1",
        timestamp: "2026-09-18T09:15:00Z",
        title: "Recommendation created",
        description:
          "Investigation INV-1041 attributed the dispatch delays to the lagging sync job and recommended a forced re-sync.",
      },
      {
        id: "ACT-4002-E2",
        timestamp: "2026-09-18T09:15:00Z",
        title: "Approval requested",
        description: "Raised as APR-3002 — medium risk, human authorization required.",
      },
    ],
  },
  {
    id: "ACT-4003",
    incidentId: "INC-2029",
    investigationId: "INV-1037",
    approvalId: "APR-3003",
    title: "Pause the order-confirmation notification integration",
    description:
      "Temporarily pause the order-confirmation and shipping-update notification integration while its delivery failure is diagnosed.",
    actionType: "Integration Pause",
    affectedSystem: "Notification Service",
    riskLevel: "high",
    status: "pending_approval",
    reason:
      "Customers are silently not receiving confirmation emails; pausing stops further silent failures while the delivery issue is still being diagnosed.",
    expectedOutcome:
      "No further customers are affected without knowing it, and the failure surface stops growing during diagnosis.",
    evidenceSummary: [
      "Six customer reports in two hours of completed orders with no confirmation email.",
      "Investigation INV-1037 is paused pending notification-service log access.",
    ],
    approvalRequired: true,
    executor: "Integration Control Tool (not yet implemented)",
    requestedAt: "2026-09-18T09:45:00Z",
    verification: {
      status: "not_started",
      expectedResult:
        "No further order-confirmation sends are attempted while the integration is paused.",
    },
    timeline: [
      {
        id: "ACT-4003-E1",
        timestamp: "2026-09-18T09:45:00Z",
        title: "Recommendation created",
        description:
          "Raised from incident INC-2029 while investigation INV-1037 remains paused awaiting log access.",
      },
      {
        id: "ACT-4003-E2",
        timestamp: "2026-09-18T09:45:00Z",
        title: "Approval requested",
        description: "Raised as APR-3003 — high risk, human authorization required.",
      },
    ],
  },
  {
    id: "ACT-4004",
    incidentId: "INC-2030",
    investigationId: "INV-1041",
    title: "Increase inventory sync frequency — West Coast warehouse",
    description:
      "Raise the inventory synchronization interval for the West Coast warehouse from every 15 minutes to every 5 minutes while dispatch is catching up.",
    actionType: "Configuration Change",
    affectedSystem: "Inventory Management",
    riskLevel: "low",
    status: "approved",
    reason:
      "A shorter sync interval reduces how far inventory state can drift while the warehouse works through its dispatch backlog.",
    expectedOutcome: "Sync lag stays under one cycle for the rest of the backlog window.",
    evidenceSummary: [
      "Sync lag peaked at several times its normal duration earlier this morning.",
      "Warehouse traffic is well within the capacity headroom for a shorter interval.",
    ],
    approvalRequired: false,
    approvedBy: "Automatic \u2014 below the approval threshold (low risk)",
    executor: "Inventory Operations Tool (not yet implemented)",
    requestedAt: "2026-09-18T09:30:00Z",
    approvedAt: "2026-09-18T09:31:00Z",
    verification: {
      status: "not_started",
      expectedResult: "Observed sync lag stays under one full cycle.",
    },
    timeline: [
      {
        id: "ACT-4004-E1",
        timestamp: "2026-09-18T09:30:00Z",
        title: "Recommendation created",
        description: "Proposed alongside INV-1041's re-sync recommendation as a follow-on measure.",
      },
      {
        id: "ACT-4004-E2",
        timestamp: "2026-09-18T09:31:00Z",
        title: "Auto-approved",
        description:
          "Classified low risk and below the approval threshold, so no human authorization was requested.",
      },
      {
        id: "ACT-4004-E3",
        timestamp: "2026-09-18T09:31:00Z",
        title: "Queued for execution",
        description: "Waiting for an execution slot. Execution itself is not implemented yet.",
      },
    ],
  },
  {
    id: "ACT-4005",
    incidentId: "INC-2028",
    investigationId: "INV-1040",
    title: "Scale up the order-processing worker pool",
    description:
      "Add two additional order-processing workers so the queue drains faster than it is filling.",
    actionType: "Capacity Scaling",
    affectedSystem: "Order Management",
    riskLevel: "low",
    status: "executing",
    reason:
      "The order-processing queue is filling faster than it drains, with no processing errors \u2014 a throughput problem rather than a fault.",
    expectedOutcome: "Queue depth trends downward and standard-shipping orders return within SLA.",
    evidenceSummary: [
      "Queue depth roughly 3\u00d7 its usual mid-morning level and still climbing.",
      "No processing errors observed \u2014 throughput, not correctness, is the constraint.",
    ],
    approvalRequired: false,
    approvedBy: "Automatic \u2014 below the approval threshold (low risk)",
    executor: "Capacity Management Tool (not yet implemented)",
    requestedAt: "2026-09-18T09:35:00Z",
    approvedAt: "2026-09-18T09:36:00Z",
    startedAt: "2026-09-18T09:38:00Z",
    verification: {
      status: "pending",
      expectedResult: "Queue depth falls back toward its normal mid-morning level.",
    },
    timeline: [
      {
        id: "ACT-4005-E1",
        timestamp: "2026-09-18T09:35:00Z",
        title: "Recommendation created",
        description: "Proposed by investigation INV-1040 while it continues analyzing the backlog.",
      },
      {
        id: "ACT-4005-E2",
        timestamp: "2026-09-18T09:36:00Z",
        title: "Auto-approved",
        description: "Classified low risk and below the approval threshold.",
      },
      {
        id: "ACT-4005-E3",
        timestamp: "2026-09-18T09:38:00Z",
        title: "Action execution started",
        description: "Worker pool scaling in progress. Verification will run once it completes.",
      },
    ],
  },
  {
    id: "ACT-4006",
    incidentId: "INC-2028",
    investigationId: "INV-1040",
    approvalId: "APR-3005",
    title: "Retry failed order synchronization batch",
    description:
      "Re-run the stalled order-synchronization batch so backed-up orders are processed without waiting for the queue to drain on its own.",
    actionType: "Batch Retry",
    affectedSystem: "Order Management",
    riskLevel: "medium",
    status: "completed",
    reason:
      "The order queue was backing up past SLA without processing errors; a manual retry clears the current backlog immediately.",
    expectedOutcome: "Queue depth drops and affected orders return within their processing SLA.",
    evidenceSummary: [
      "Queue depth roughly 3\u00d7 normal and climbing at the time of the request.",
      "No processing errors observed on the batch itself.",
      "Standard-shipping orders were the tier at SLA risk.",
    ],
    approvalRequired: true,
    approvedBy: "M. Chen (Operations Lead)",
    executor: "Order Operations Tool (not yet implemented)",
    requestedAt: "2026-09-18T08:55:00Z",
    approvedAt: "2026-09-18T09:05:00Z",
    startedAt: "2026-09-18T09:06:00Z",
    completedAt: "2026-09-18T09:09:00Z",
    verification: {
      status: "passed",
      expectedResult: "Order-processing queue depth returns toward its normal range.",
      observedResult:
        "Queue depth fell from ~3\u00d7 normal to within the normal range, and no duplicate order processing was detected.",
      verifiedAt: "2026-09-18T09:12:00Z",
    },
    timeline: [
      {
        id: "ACT-4006-E1",
        timestamp: "2026-09-18T08:55:00Z",
        title: "Recommendation created",
        description: "Investigation INV-1040 recommended retrying the stalled synchronization batch.",
      },
      {
        id: "ACT-4006-E2",
        timestamp: "2026-09-18T09:05:00Z",
        title: "Human approval received",
        description: "APR-3005 approved by M. Chen (Operations Lead).",
      },
      {
        id: "ACT-4006-E3",
        timestamp: "2026-09-18T09:06:00Z",
        title: "Action execution started",
        description: "Batch retry initiated against the order-processing queue.",
      },
      {
        id: "ACT-4006-E4",
        timestamp: "2026-09-18T09:09:00Z",
        title: "Execution completed",
        description: "Batch retry finished with no reported errors.",
      },
      {
        id: "ACT-4006-E5",
        timestamp: "2026-09-18T09:12:00Z",
        title: "Verification passed",
        description: "Queue depth re-checked and found back within its normal range.",
      },
    ],
  },
  {
    id: "ACT-4007",
    incidentId: "INC-2026",
    investigationId: "INV-1039",
    approvalId: "APR-3006",
    title: "Renew the backup payment gateway's TLS certificate",
    description:
      "Rotate the backup payment gateway integration's TLS certificate ahead of its expiry so the payment failover path stays available.",
    actionType: "Certificate Renewal",
    affectedSystem: "Payment Processing",
    riskLevel: "low",
    status: "completed",
    reason:
      "The certificate was due to expire within 72 hours, which would have removed the payment failover path before it was needed.",
    expectedOutcome: "The backup gateway remains available as a failover option with no interruption.",
    evidenceSummary: [
      "Automated check flagged certificate expiry in under 72 hours.",
      "No current customer impact \u2014 a preventive action rather than a response to a failure.",
    ],
    approvalRequired: true,
    approvedBy: "M. Chen (Operations Lead)",
    executor: "Certificate Management Tool (not yet implemented)",
    requestedAt: "2026-09-17T18:45:00Z",
    approvedAt: "2026-09-17T19:00:00Z",
    startedAt: "2026-09-17T19:02:00Z",
    completedAt: "2026-09-17T19:05:00Z",
    verification: {
      status: "passed",
      expectedResult: "Backup gateway handshake succeeds with a certificate valid well beyond 72 hours.",
      observedResult:
        "Handshake check against the backup gateway succeeded with the renewed certificate; next expiry is 12 months out.",
      verifiedAt: "2026-09-17T19:10:00Z",
    },
    timeline: [
      {
        id: "ACT-4007-E1",
        timestamp: "2026-09-17T18:45:00Z",
        title: "Recommendation created",
        description: "Raised by investigation INV-1039 from the automated certificate-expiry check.",
      },
      {
        id: "ACT-4007-E2",
        timestamp: "2026-09-17T19:00:00Z",
        title: "Human approval received",
        description: "APR-3006 approved by M. Chen (Operations Lead).",
      },
      {
        id: "ACT-4007-E3",
        timestamp: "2026-09-17T19:02:00Z",
        title: "Action execution started",
        description: "Certificate rotation initiated on the backup gateway integration.",
      },
      {
        id: "ACT-4007-E4",
        timestamp: "2026-09-17T19:05:00Z",
        title: "Execution completed",
        description: "Rotation finished and the new certificate was installed.",
      },
      {
        id: "ACT-4007-E5",
        timestamp: "2026-09-17T19:10:00Z",
        title: "Verification passed",
        description: "Failover handshake re-checked successfully with the renewed certificate.",
      },
    ],
  },
  {
    id: "ACT-4008",
    incidentId: "INC-2027",
    investigationId: "INV-1038",
    title: "Purge stale CDN edge cache for storefront assets",
    description:
      "Purge storefront asset entries from the CDN edge cache after the traffic-spike failover, so no visitor is served a stale bundle.",
    actionType: "Cache Purge",
    affectedSystem: "Website Health & Uptime",
    riskLevel: "low",
    status: "failed",
    reason:
      "The CDN failover during the traffic spike could have left a subset of edge nodes serving stale storefront assets.",
    expectedOutcome: "All edge nodes serve current storefront assets after the purge.",
    evidenceSummary: [
      "Traffic volume crossed the automatic CDN failover threshold during the 502 window.",
      "A subset of edge nodes reported cache entries older than the last asset deploy.",
    ],
    approvalRequired: false,
    approvedBy: "Automatic \u2014 below the approval threshold (low risk)",
    executor: "CDN Operations Tool (not yet implemented)",
    executionNote:
      "The edge purge API timed out after three attempts. No cache entries were purged and no visitor-facing state changed.",
    requestedAt: "2026-09-17T18:24:00Z",
    approvedAt: "2026-09-17T18:24:00Z",
    startedAt: "2026-09-17T18:26:00Z",
    completedAt: "2026-09-17T18:28:00Z",
    verification: {
      status: "not_started",
      expectedResult: "Edge nodes report cache entries no older than the last asset deploy.",
    },
    timeline: [
      {
        id: "ACT-4008-E1",
        timestamp: "2026-09-17T18:24:00Z",
        title: "Recommendation created",
        description: "Raised by investigation INV-1038 following the CDN failover.",
      },
      {
        id: "ACT-4008-E2",
        timestamp: "2026-09-17T18:24:00Z",
        title: "Auto-approved",
        description: "Classified low risk and below the approval threshold.",
      },
      {
        id: "ACT-4008-E3",
        timestamp: "2026-09-17T18:26:00Z",
        title: "Action execution started",
        description: "Purge request submitted to the CDN edge API.",
      },
      {
        id: "ACT-4008-E4",
        timestamp: "2026-09-17T18:28:00Z",
        title: "Execution failed",
        description:
          "Edge purge API timed out after three attempts; the action was abandoned without changing any cache entry.",
      },
      {
        id: "ACT-4008-E5",
        timestamp: "2026-09-17T18:28:00Z",
        title: "Verification skipped",
        description: "Execution never succeeded, so there was nothing to verify.",
      },
    ],
  },
  {
    id: "ACT-4009",
    incidentId: "INC-2025",
    title: "Re-run support ticket auto-triage for the promo backlog",
    description:
      "Re-run auto-triage across the untriaged support tickets left over from the promotional campaign, so they are routed to the right queues.",
    actionType: "Batch Retry",
    affectedSystem: "Customer Support",
    riskLevel: "low",
    status: "completed",
    reason:
      "A large share of campaign-period tickets were left untriaged, which is what pushed first-response times past target.",
    expectedOutcome: "Untriaged ticket count falls sharply and first-response time returns to target.",
    evidenceSummary: [
      "Ticket volume during the campaign was several times the weekly baseline.",
      "A large share of those tickets never received an auto-triage classification.",
    ],
    approvalRequired: false,
    approvedBy: "Automatic \u2014 below the approval threshold (low risk)",
    executor: "Support Operations Tool (not yet implemented)",
    requestedAt: "2026-09-15T13:10:00Z",
    approvedAt: "2026-09-15T13:10:00Z",
    startedAt: "2026-09-15T13:12:00Z",
    completedAt: "2026-09-15T13:26:00Z",
    verification: {
      status: "failed",
      expectedResult: "Average first-response time returns to its target range within an hour.",
      observedResult:
        "Tickets were re-triaged successfully, but average first-response time stayed above target \u2014 the backlog was an agent-capacity constraint, not a routing one.",
      verifiedAt: "2026-09-15T14:30:00Z",
    },
    timeline: [
      {
        id: "ACT-4009-E1",
        timestamp: "2026-09-15T13:10:00Z",
        title: "Recommendation created",
        description: "Raised from incident INC-2025 after the promotional-campaign support backlog.",
      },
      {
        id: "ACT-4009-E2",
        timestamp: "2026-09-15T13:10:00Z",
        title: "Auto-approved",
        description: "Classified low risk and below the approval threshold.",
      },
      {
        id: "ACT-4009-E3",
        timestamp: "2026-09-15T13:12:00Z",
        title: "Action execution started",
        description: "Auto-triage re-run started across the untriaged campaign tickets.",
      },
      {
        id: "ACT-4009-E4",
        timestamp: "2026-09-15T13:26:00Z",
        title: "Execution completed",
        description: "All targeted tickets received a triage classification.",
      },
      {
        id: "ACT-4009-E5",
        timestamp: "2026-09-15T14:30:00Z",
        title: "Verification failed",
        description:
          "First-response time was re-checked and had not returned to target; the incident was handled with additional agent capacity instead.",
      },
    ],
  },
  {
    id: "ACT-4010",
    incidentId: "INC-2023",
    investigationId: "INV-1036",
    approvalId: "APR-3004",
    title: "Roll back the canary deployment",
    description:
      "Revert the canary release to the last known-good release after its error rate exceeded the automatic comparison threshold.",
    actionType: "Deployment Rollback",
    affectedSystem: "Deployment Pipeline",
    riskLevel: "high",
    status: "cancelled",
    reason:
      "The canary slice's error rate exceeded the automatic threshold and investigation INV-1036 could not isolate a cause before the canary window closed.",
    expectedOutcome:
      "Would have removed the elevated error rate on the canary slice by reverting to the known-good release.",
    evidenceSummary: [
      "Canary error rate above the automatic comparison threshold against the stable release.",
      "Error sample too small to isolate a specific cause.",
    ],
    approvalRequired: true,
    executor: "Deployment Tool (not yet implemented)",
    executionNote:
      "Cancelled because approval APR-3004 was rejected: the change set was reviewed manually, judged low-risk, and kept under closer monitoring instead.",
    requestedAt: "2026-09-18T09:21:00Z",
    verification: {
      status: "not_started",
      expectedResult: "Canary slice error rate returns to match the stable release.",
    },
    timeline: [
      {
        id: "ACT-4010-E1",
        timestamp: "2026-09-18T09:21:00Z",
        title: "Recommendation created",
        description: "Investigation INV-1036 proposed a precautionary rollback of the canary release.",
      },
      {
        id: "ACT-4010-E2",
        timestamp: "2026-09-18T09:21:00Z",
        title: "Approval requested",
        description: "Raised as APR-3004 — high risk, human authorization required.",
      },
      {
        id: "ACT-4010-E3",
        timestamp: "2026-09-18T09:50:00Z",
        title: "Approval rejected — action cancelled",
        description:
          "J. Alvarez (On-call Engineer) rejected the request and kept the canary running with closer manual monitoring.",
      },
    ],
  },
];
