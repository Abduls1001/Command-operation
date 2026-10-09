/**
 * Mock data for the Reports domain (Phase 8).
 *
 * Per DECISIONS.md D-012, UI phases (3–8) are built against isolated,
 * per-domain mock modules. Phase 10 deletes this file and replaces it with
 * real API calls. Nothing here is generated: no report in this file was
 * produced by an agent, no LLM wrote a word of it, and no PDF exists. Every
 * value is hand-written demo content.
 *
 * A Report is the durable narrative record of one incident's whole
 * lifecycle:
 *
 *   Incident → Investigation → Evidence → Findings → Root Cause →
 *   Recommendation → Approval → Action → Verification → Outcome
 *
 * Like Phase 6's Approval and Phase 7's Action, a Report *references* the
 * records that produced it by id (`incidentId`, `investigationId`, and the
 * approval/action ids inside its sections) rather than being a sixth
 * restatement of the same facts under new field names. Every id referenced
 * below resolves to a real record in lib/mock/incidents.ts,
 * lib/mock/investigations.ts, lib/mock/approvals.ts, or lib/mock/actions.ts,
 * and every report's content agrees with those records: a report for an
 * incident that is still being investigated is a `draft` with an
 * `in_progress` outcome, not a finished narrative.
 *
 * A report does, however, carry its own copy of the *summary* text a reader
 * needs — an executive summary, a business-impact line, key findings — since
 * those are written for the report, not copied out of another record.
 *
 * Severity, confidence, risk, and verification vocabularies are reused from
 * the earlier domains as **type-only** imports, so a severity means the same
 * thing here as on the incident it describes. None of those files was
 * modified.
 */

import type { VerificationStatus } from "@/lib/mock/actions";
import type { RiskLevel } from "@/lib/mock/approvals";
import type { AffectedSystem, IncidentSeverity, IncidentStatus } from "@/lib/mock/incidents";
import type {
  ConfidenceLevel,
  InvestigationStage,
  InvestigationStatus,
} from "@/lib/mock/investigations";

export type ReportStatus = "draft" | "under_review" | "completed" | "archived";

/** How the incident ended, as the report records it. Kept separate from
 * `verification.status`: verification says whether one action worked;
 * the outcome says how the incident as a whole finished. */
export type ReportOutcome =
  | "resolved"
  | "resolved_without_action"
  | "unresolved"
  | "in_progress";

/** The five things the executive summary has to answer. Structured rather
 * than one free-text blob so the section stays scannable and consistent
 * across reports. */
export interface ExecutiveSummary {
  whatHappened: string;
  impact: string;
  investigated: string;
  conclusion: string;
  afterAction: string;
}

export interface ReportIncidentSummary {
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedSystem: AffectedSystem;
  /** ISO 8601. */
  detectedAt: string;
  /** ISO 8601. Absent while the incident is still open. */
  closedAt?: string;
  businessImpact: string;
}

export interface ReportInvestigationSummary {
  id: string;
  status: InvestigationStatus;
  stage: InvestigationStage;
  /** ISO 8601. */
  startedAt: string;
  /** Human-readable, e.g. "18 minutes" — precomputed demo text. */
  duration: string;
  keyFindings: string[];
}

/** One simulated evidence figure, with the category/system it came from. */
export interface ReportEvidenceItem {
  label: string;
  value: string;
  source: string;
}

export interface ReportRootCause {
  summary: string;
  explanation: string;
  confidence: ConfidenceLevel;
  supportingEvidence: string[];
}

export interface ReportRecommendation {
  action: string;
  reason: string;
  expectedOutcome: string;
  riskLevel: RiskLevel;
}

export interface ReportApprovalSummary {
  /** Absent for actions below the approval threshold. */
  id?: string;
  status: string;
  decision: string;
  /** ISO 8601. Absent while undecided. */
  decisionAt?: string;
  decisionBy: string;
  comment: string;
}

export interface ReportActionSummary {
  id: string;
  performed: string;
  status: string;
  /** ISO 8601. */
  startedAt?: string;
  /** ISO 8601. */
  completedAt?: string;
  affectedSystem: AffectedSystem;
}

export interface ReportVerification {
  status: VerificationStatus;
  expectedResult: string;
  observedResult?: string;
  /** ISO 8601. */
  verifiedAt?: string;
  finalOutcome: string;
}

export interface ReportEvent {
  id: string;
  /** ISO 8601. */
  timestamp: string;
  title: string;
  description: string;
}

export interface Report {
  id: string;
  incidentId: string;
  /** Absent where an incident was handled without a recorded investigation. */
  investigationId?: string;
  title: string;
  /** One-line summary, used in the list and as the detail page's standfirst. */
  summary: string;
  severity: IncidentSeverity;
  status: ReportStatus;
  outcome: ReportOutcome;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;

  executiveSummary: ExecutiveSummary;
  incident: ReportIncidentSummary;
  investigation?: ReportInvestigationSummary;
  evidence: ReportEvidenceItem[];
  rootCause?: ReportRootCause;
  recommendation?: ReportRecommendation;
  approval?: ReportApprovalSummary;
  action?: ReportActionSummary;
  verification: ReportVerification;
  timeline: ReportEvent[];
}

export function getReportById(id: string): Report | undefined {
  return REPORTS.find((report) => report.id === id);
}

/**
 * Absolute timestamp formatting for the report sections. A report is a
 * durable record, so it shows real dates and times rather than the
 * relative labels the live queues use; unset values render as an em dash
 * rather than an invented time. Pinned to UTC so server and client always
 * render the same string.
 */
export function formatReportTimestamp(iso?: string): string {
  if (!iso) return "\u2014";
  return `${new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;
}

/** Outcomes that count as "Resolved" on the summary cards — an incident
 * that ended without needing an action is still resolved. */
export const RESOLVED_OUTCOMES: ReportOutcome[] = ["resolved", "resolved_without_action"];

export const REPORTS: Report[] = [
  {
    id: "REP-5001",
    incidentId: "INC-2031",
    investigationId: "INV-1042",
    title: "Checkout success-rate drop — payment gateway degradation",
    summary:
      "Card-payment authorizations began failing at the primary gateway, breaking checkout completion. A failover to the backup gateway is recommended and awaiting approval.",
    severity: "critical",
    status: "draft",
    outcome: "in_progress",
    createdAt: "2026-09-18T09:40:00Z",
    updatedAt: "2026-09-18T09:40:00Z",
    executiveSummary: {
      whatHappened:
        "Checkout success rate dropped sharply after the primary payment gateway began returning server errors on card-payment authorization.",
      impact:
        "Completed orders fell 34% against a normal mid-morning rate while attempted orders held steady, with revenue tracking well below forecast.",
      investigated:
        "The checkout funnel, payment failure rates, gateway error responses, and the health of adjacent systems were examined to separate a payment fault from a storefront or inventory fault.",
      conclusion:
        "The primary payment gateway is degraded. Other systems are healthy, and the funnel breaks precisely at the authorization step.",
      afterAction:
        "No action has been executed. The recommended failover is waiting on human approval (APR-3001); this report will be completed once the action and its verification are recorded.",
    },
    incident: {
      title: "Checkout success rate dropped sharply",
      severity: "critical",
      status: "investigating",
      affectedSystem: "Payment Processing",
      detectedAt: "2026-09-18T09:20:00Z",
      businessImpact:
        "Revenue tracking 18.4% below forecast for the day so far, with customers unable to complete card payments.",
    },
    investigation: {
      id: "INV-1042",
      status: "awaiting_approval",
      stage: "awaiting_approval",
      startedAt: "2026-09-18T09:20:00Z",
      duration: "18 minutes to recommendation",
      keyFindings: [
        "Attempted orders are at baseline while completed orders are not — the funnel breaks after checkout begins.",
        "Payment failures are concentrated on card-payment authorization calls to the primary gateway.",
        "Storefront, inventory, and order systems show no corresponding degradation.",
      ],
    },
    evidence: [
      { label: "Revenue", value: "-18.4% vs. forecast", source: "Sales Metrics" },
      { label: "Payment failures", value: "27% (baseline 2%)", source: "Payment Processing" },
      { label: "Gateway errors", value: "+27% 5xx responses", source: "Payment Gateway Monitor" },
      { label: "Completed orders", value: "-34%", source: "Order Management" },
      { label: "Website health", value: "Normal", source: "Website Health Monitor" },
    ],
    rootCause: {
      summary: "Primary payment gateway degradation",
      explanation:
        "The primary payment gateway is returning an elevated rate of server errors on card-payment authorization, so otherwise-valid checkouts fail after the order is initiated. This matches the observed funnel break, the failure-rate spike, and the gateway's own error evidence, while every adjacent system remains healthy.",
      confidence: "high",
      supportingEvidence: ["Payment failures", "Gateway errors", "Completed orders"],
    },
    recommendation: {
      action: "Switch affected payment traffic to the backup gateway.",
      reason:
        "The backup gateway is healthy and can absorb card-payment traffic while the primary gateway is degraded.",
      expectedOutcome:
        "Payment failure rate and completed-order volume return to baseline within minutes of the switch.",
      riskLevel: "critical",
    },
    approval: {
      id: "APR-3001",
      status: "Pending",
      decision: "Awaiting decision",
      decisionBy: "Unassigned — pending human review",
      comment: "No decision recorded yet.",
    },
    action: {
      id: "ACT-4001",
      performed: "Switch payment traffic to backup gateway",
      status: "Pending Approval — not executed",
      affectedSystem: "Payment Processing",
    },
    verification: {
      status: "not_started",
      expectedResult:
        "Payment success rate returns to the normal range and completed-order volume recovers.",
      finalOutcome: "Incident still open — awaiting approval of the recommended action.",
    },
    timeline: [
      {
        id: "REP-5001-T1",
        timestamp: "2026-09-18T09:20:00Z",
        title: "Incident detected",
        description: "Automated monitoring flagged a sharp drop in checkout success rate (INC-2031).",
      },
      {
        id: "REP-5001-T2",
        timestamp: "2026-09-18T09:20:00Z",
        title: "Investigation started",
        description: "INV-1042 opened against the incident.",
      },
      {
        id: "REP-5001-T3",
        timestamp: "2026-09-18T09:30:00Z",
        title: "Evidence collected",
        description: "Funnel metrics, payment failure rates, and gateway error responses gathered.",
      },
      {
        id: "REP-5001-T4",
        timestamp: "2026-09-18T09:36:00Z",
        title: "Root cause identified",
        description: "Primary payment gateway degradation, at high confidence.",
      },
      {
        id: "REP-5001-T5",
        timestamp: "2026-09-18T09:38:00Z",
        title: "Recommendation generated",
        description: "Failover of card-payment traffic to the backup gateway.",
      },
      {
        id: "REP-5001-T6",
        timestamp: "2026-09-18T09:38:00Z",
        title: "Approval requested",
        description: "Raised as APR-3001 — critical risk, awaiting human decision.",
      },
      {
        id: "REP-5001-T7",
        timestamp: "2026-09-18T09:40:00Z",
        title: "Draft report generated",
        description: "Interim record created while the incident is still open.",
      },
    ],
  },
  {
    id: "REP-5002",
    incidentId: "INC-2030",
    investigationId: "INV-1041",
    title: "West Coast warehouse dispatch delays — inventory sync lag",
    summary:
      "An inventory sync lag delayed dispatch for roughly 40 orders. A forced re-sync is recommended and awaiting approval.",
    severity: "medium",
    status: "draft",
    outcome: "in_progress",
    createdAt: "2026-09-18T09:20:00Z",
    updatedAt: "2026-09-18T09:20:00Z",
    executiveSummary: {
      whatHappened:
        "Orders from the West Coast warehouse stopped moving to dispatch on schedule after the inventory sync job fell behind.",
      impact:
        "Roughly 40 orders passed their fulfillment SLA, with dispatch still lagging at the time of writing.",
      investigated:
        "Sync job latency, the dispatch queue, and the affected orders' origin warehouse and timing were reviewed.",
      conclusion:
        "Every delayed order falls inside the sync-lag window and originates from the same warehouse, at medium confidence.",
      afterAction:
        "No action has been executed. A manual re-sync is waiting on approval (APR-3002).",
    },
    incident: {
      title: "Elevated dispatch delays — West Coast warehouse",
      severity: "medium",
      status: "awaiting_approval",
      affectedSystem: "Inventory Management",
      detectedAt: "2026-09-18T08:02:00Z",
      businessImpact:
        "About 40 customer orders delayed past their promised fulfillment window at a single warehouse.",
    },
    investigation: {
      id: "INV-1041",
      status: "awaiting_approval",
      stage: "awaiting_approval",
      startedAt: "2026-09-18T08:05:00Z",
      duration: "1 hour 10 minutes to recommendation",
      keyFindings: [
        "Sync job latency rose to several times its normal duration during the affected window.",
        "All delayed orders originate from the West Coast warehouse and fall inside that window.",
        "No errors were reported by the sync job itself — it ran late rather than failing.",
      ],
    },
    evidence: [
      { label: "Orders delayed past SLA", value: "~40 orders", source: "Order Management" },
      { label: "Sync latency", value: "Several × normal duration", source: "Inventory Management" },
      { label: "Affected warehouse", value: "West Coast", source: "Inventory Management" },
      { label: "Sync job errors", value: "None reported", source: "Inventory Management" },
    ],
    rootCause: {
      summary: "Inventory sync job fell behind for the West Coast warehouse",
      explanation:
        "A temporary lag in the inventory sync job meant stock updates from the warehouse reached the order system late, delaying dispatch for orders placed during that window.",
      confidence: "medium",
      supportingEvidence: ["Sync latency", "Orders delayed past SLA"],
    },
    recommendation: {
      action: "Trigger a manual inventory re-sync for the West Coast warehouse.",
      reason: "A forced re-sync clears the backlog immediately rather than waiting for the next scheduled run.",
      expectedOutcome:
        "Affected orders move to processing within the next sync cycle and dispatch returns to its normal rate.",
      riskLevel: "medium",
    },
    approval: {
      id: "APR-3002",
      status: "Pending",
      decision: "Awaiting decision",
      decisionBy: "Unassigned — pending human review",
      comment: "No decision recorded yet.",
    },
    action: {
      id: "ACT-4002",
      performed: "Trigger manual inventory re-sync — West Coast warehouse",
      status: "Pending Approval — not executed",
      affectedSystem: "Inventory Management",
    },
    verification: {
      status: "not_started",
      expectedResult: "Delayed order count for the West Coast warehouse returns to zero.",
      finalOutcome: "Incident still open — awaiting approval of the recommended action.",
    },
    timeline: [
      {
        id: "REP-5002-T1",
        timestamp: "2026-09-18T08:02:00Z",
        title: "Incident detected",
        description: "Dispatch delays flagged for the West Coast warehouse (INC-2030).",
      },
      {
        id: "REP-5002-T2",
        timestamp: "2026-09-18T08:05:00Z",
        title: "Investigation started",
        description: "INV-1041 opened against the incident.",
      },
      {
        id: "REP-5002-T3",
        timestamp: "2026-09-18T08:40:00Z",
        title: "Evidence collected",
        description: "Sync job latency and the affected orders' origin and timing gathered.",
      },
      {
        id: "REP-5002-T4",
        timestamp: "2026-09-18T09:10:00Z",
        title: "Root cause identified",
        description: "Inventory sync lag for the West Coast warehouse, at medium confidence.",
      },
      {
        id: "REP-5002-T5",
        timestamp: "2026-09-18T09:15:00Z",
        title: "Recommendation generated",
        description: "Forced inventory re-sync for the affected warehouse.",
      },
      {
        id: "REP-5002-T6",
        timestamp: "2026-09-18T09:15:00Z",
        title: "Approval requested",
        description: "Raised as APR-3002 — medium risk, awaiting human decision.",
      },
      {
        id: "REP-5002-T7",
        timestamp: "2026-09-18T09:20:00Z",
        title: "Draft report generated",
        description: "Interim record created while the incident is still open.",
      },
    ],
  },
  {
    id: "REP-5003",
    incidentId: "INC-2028",
    investigationId: "INV-1040",
    title: "Standard-shipping order processing delays — queue backlog",
    summary:
      "The order-processing queue filled faster than it drained. A batch retry cleared the immediate backlog and verified successfully; the underlying throughput question is still being investigated.",
    severity: "medium",
    status: "under_review",
    outcome: "in_progress",
    createdAt: "2026-09-18T09:15:00Z",
    updatedAt: "2026-09-18T09:20:00Z",
    executiveSummary: {
      whatHappened:
        "Standard-shipping orders began processing past their SLA as the order-processing queue filled faster than it could drain.",
      impact:
        "Orders on the standard-shipping tier were at risk of missing their processing SLA through the morning.",
      investigated:
        "Queue depth, processing error rates, and per-order processing time were reviewed to distinguish a fault from a capacity shortfall.",
      conclusion:
        "No processing errors were found. The constraint is throughput, not correctness — a conclusion the investigation is still refining.",
      afterAction:
        "A batch retry (ACT-4006) was approved, executed, and verified: queue depth returned to its normal range with no duplicate processing. A worker-pool scale-up (ACT-4005) is still running. This report stays under review until the investigation closes.",
    },
    incident: {
      title: "Order processing delayed beyond SLA for standard shipping",
      severity: "medium",
      status: "investigating",
      affectedSystem: "Order Management",
      detectedAt: "2026-09-18T06:45:00Z",
      businessImpact:
        "Standard-shipping orders at risk of missing their processing SLA, with knock-on delivery-date risk.",
    },
    investigation: {
      id: "INV-1040",
      status: "running",
      stage: "analyzing",
      startedAt: "2026-09-18T06:50:00Z",
      duration: "Ongoing — 2 hours so far",
      keyFindings: [
        "Queue depth reached roughly 3× its usual mid-morning level and was still climbing.",
        "No processing errors were observed — orders were processing, just more slowly than they arrived.",
        "A root cause has not been confirmed; the investigation is still analyzing.",
      ],
    },
    evidence: [
      { label: "Queue depth", value: "~3× normal, climbing", source: "Order Management" },
      { label: "Processing errors", value: "None observed", source: "Order Management" },
      { label: "Orders at SLA risk", value: "Standard shipping tier", source: "Order Management" },
      { label: "Payment health", value: "Normal", source: "Payment Processing" },
    ],
    recommendation: {
      action: "Retry the stalled order-synchronization batch.",
      reason: "A manual retry clears the current backlog without waiting for the queue to drain on its own.",
      expectedOutcome: "Queue depth drops and affected orders return within their processing SLA.",
      riskLevel: "medium",
    },
    approval: {
      id: "APR-3005",
      status: "Approved",
      decision: "Approved",
      decisionAt: "2026-09-18T09:05:00Z",
      decisionBy: "M. Chen (Operations Lead)",
      comment: "Approved — low downside, and the queue is trending the wrong way.",
    },
    action: {
      id: "ACT-4006",
      performed: "Retry failed order synchronization batch",
      status: "Completed",
      startedAt: "2026-09-18T09:06:00Z",
      completedAt: "2026-09-18T09:09:00Z",
      affectedSystem: "Order Management",
    },
    verification: {
      status: "passed",
      expectedResult: "Order-processing queue depth returns toward its normal range.",
      observedResult:
        "Queue depth fell from roughly 3× normal to within the normal range, and no duplicate order processing was detected.",
      verifiedAt: "2026-09-18T09:12:00Z",
      finalOutcome:
        "Backlog cleared and verified. The incident remains open while the investigation confirms why throughput fell behind in the first place.",
    },
    timeline: [
      {
        id: "REP-5003-T1",
        timestamp: "2026-09-18T06:45:00Z",
        title: "Incident detected",
        description: "Standard-shipping orders flagged as processing beyond SLA (INC-2028).",
      },
      {
        id: "REP-5003-T2",
        timestamp: "2026-09-18T06:50:00Z",
        title: "Investigation started",
        description: "INV-1040 opened against the incident.",
      },
      {
        id: "REP-5003-T3",
        timestamp: "2026-09-18T08:30:00Z",
        title: "Evidence collected",
        description: "Queue depth, processing error rate, and per-order timing gathered.",
      },
      {
        id: "REP-5003-T4",
        timestamp: "2026-09-18T08:55:00Z",
        title: "Recommendation generated",
        description: "Retry the stalled order-synchronization batch to clear the backlog.",
      },
      {
        id: "REP-5003-T5",
        timestamp: "2026-09-18T09:05:00Z",
        title: "Approval received",
        description: "APR-3005 approved by M. Chen (Operations Lead).",
      },
      {
        id: "REP-5003-T6",
        timestamp: "2026-09-18T09:09:00Z",
        title: "Action executed",
        description: "ACT-4006 batch retry completed with no reported errors.",
      },
      {
        id: "REP-5003-T7",
        timestamp: "2026-09-18T09:12:00Z",
        title: "Verification completed",
        description: "Queue depth re-checked and confirmed back within its normal range.",
      },
      {
        id: "REP-5003-T8",
        timestamp: "2026-09-18T09:15:00Z",
        title: "Report generated",
        description: "Interim report raised for review while the investigation continues.",
      },
    ],
  },
  {
    id: "REP-5004",
    incidentId: "INC-2026",
    investigationId: "INV-1039",
    title: "Backup payment gateway certificate renewal",
    summary:
      "The backup gateway's TLS certificate was due to expire within 72 hours. It was renewed ahead of expiry and the failover path verified as healthy.",
    severity: "high",
    status: "completed",
    outcome: "resolved",
    createdAt: "2026-09-17T19:30:00Z",
    updatedAt: "2026-09-17T19:30:00Z",
    executiveSummary: {
      whatHappened:
        "An automated check found the backup payment gateway's TLS certificate due to expire within 72 hours, with no renewal scheduled.",
      impact:
        "No customer impact occurred. Left alone, the failure would have removed the payment failover path before it was needed.",
      investigated:
        "The certificate's expiry window, its renewal ownership, and the current availability of the failover path were checked.",
      conclusion:
        "A straightforward preventive case: the certificate was genuinely near expiry and nothing else was wrong.",
      afterAction:
        "The certificate was renewed under approval APR-3006 and the failover handshake re-checked successfully. The incident was resolved the same evening.",
    },
    incident: {
      title: "Backup payment gateway certificate nearing expiry",
      severity: "high",
      status: "resolved",
      affectedSystem: "Payment Processing",
      detectedAt: "2026-09-17T14:05:00Z",
      closedAt: "2026-09-17T19:30:00Z",
      businessImpact:
        "None observed. The risk was the loss of the payment failover path during a future primary-gateway failure.",
    },
    investigation: {
      id: "INV-1039",
      status: "completed",
      stage: "completed",
      startedAt: "2026-09-17T14:10:00Z",
      duration: "5 hours 20 minutes",
      keyFindings: [
        "The certificate securing the backup gateway integration was due to expire in under 72 hours.",
        "No renewal had been scheduled by the owning team.",
        "The failover path itself was healthy and in no immediate difficulty.",
      ],
    },
    evidence: [
      { label: "Certificate expiry window", value: "< 72 hours", source: "Certificate Monitor" },
      { label: "Failover availability", value: "Unaffected at detection", source: "Payment Processing" },
      { label: "Customer impact", value: "None observed", source: "Sales Metrics" },
    ],
    rootCause: {
      summary: "Backup payment gateway certificate nearing expiry",
      explanation:
        "The TLS certificate securing the backup gateway integration was approaching its expiry date without a renewal scheduled.",
      confidence: "high",
      supportingEvidence: ["Certificate expiry window"],
    },
    recommendation: {
      action: "Renew the backup gateway's TLS certificate.",
      reason: "Prevent loss of the payment failover path before it is needed.",
      expectedOutcome: "The backup gateway remains available as a failover option with no interruption.",
      riskLevel: "low",
    },
    approval: {
      id: "APR-3006",
      status: "Approved",
      decision: "Approved",
      decisionAt: "2026-09-17T19:00:00Z",
      decisionBy: "M. Chen (Operations Lead)",
      comment: "Approved — routine renewal, no concerns.",
    },
    action: {
      id: "ACT-4007",
      performed: "Renew the backup payment gateway's TLS certificate",
      status: "Completed",
      startedAt: "2026-09-17T19:02:00Z",
      completedAt: "2026-09-17T19:05:00Z",
      affectedSystem: "Payment Processing",
    },
    verification: {
      status: "passed",
      expectedResult:
        "Backup gateway handshake succeeds with a certificate valid well beyond 72 hours.",
      observedResult:
        "Handshake check against the backup gateway succeeded with the renewed certificate; next expiry is 12 months out.",
      verifiedAt: "2026-09-17T19:10:00Z",
      finalOutcome: "Incident resolved. The payment failover path is available and verified.",
    },
    timeline: [
      {
        id: "REP-5004-T1",
        timestamp: "2026-09-17T14:05:00Z",
        title: "Incident detected",
        description: "Automated certificate-expiry warning raised as INC-2026.",
      },
      {
        id: "REP-5004-T2",
        timestamp: "2026-09-17T14:10:00Z",
        title: "Investigation started",
        description: "INV-1039 opened against the incident.",
      },
      {
        id: "REP-5004-T3",
        timestamp: "2026-09-17T14:30:00Z",
        title: "Evidence collected",
        description: "Expiry window confirmed and the renewal owner identified.",
      },
      {
        id: "REP-5004-T4",
        timestamp: "2026-09-17T18:40:00Z",
        title: "Root cause identified",
        description: "Certificate nearing expiry with no renewal scheduled, at high confidence.",
      },
      {
        id: "REP-5004-T5",
        timestamp: "2026-09-17T18:45:00Z",
        title: "Recommendation generated",
        description: "Renew the certificate ahead of expiry.",
      },
      {
        id: "REP-5004-T6",
        timestamp: "2026-09-17T19:00:00Z",
        title: "Approval received",
        description: "APR-3006 approved by M. Chen (Operations Lead).",
      },
      {
        id: "REP-5004-T7",
        timestamp: "2026-09-17T19:05:00Z",
        title: "Action executed",
        description: "ACT-4007 certificate rotation completed.",
      },
      {
        id: "REP-5004-T8",
        timestamp: "2026-09-17T19:10:00Z",
        title: "Verification completed",
        description: "Failover handshake re-checked successfully with the renewed certificate.",
      },
      {
        id: "REP-5004-T9",
        timestamp: "2026-09-17T19:30:00Z",
        title: "Report generated",
        description: "Final report completed and the incident closed.",
      },
    ],
  },
  {
    id: "REP-5005",
    incidentId: "INC-2027",
    investigationId: "INV-1038",
    title: "Intermittent storefront 502s during traffic spike",
    summary:
      "A brief 502 error spike aligned exactly with an automatic CDN failover under a traffic surge. The errors self-resolved and no remediation was needed.",
    severity: "low",
    status: "completed",
    outcome: "resolved_without_action",
    createdAt: "2026-09-17T18:45:00Z",
    updatedAt: "2026-09-17T18:45:00Z",
    executiveSummary: {
      whatHappened:
        "A subset of storefront visitors received HTTP 502 responses for roughly 90 seconds during a traffic surge.",
      impact:
        "A small share of visitors saw an error page for under two minutes. No orders were lost and no customer complaints followed.",
      investigated:
        "The error window was correlated against traffic volume, CDN failover events, and web-tier health.",
      conclusion:
        "The spike was expected CDN failover behaviour under a traffic surge, not a fault requiring remediation.",
      afterAction:
        "The precautionary web-tier restart (APR-3007) expired unactioned because the error rate self-resolved first. A follow-up cache purge (ACT-4008) failed on a timeout, but it changed nothing and was not needed.",
    },
    incident: {
      title: "Intermittent website 502s during traffic spike",
      severity: "low",
      status: "resolved",
      affectedSystem: "Website Health & Uptime",
      detectedAt: "2026-09-17T18:15:00Z",
      closedAt: "2026-09-17T18:29:00Z",
      businessImpact:
        "Brief, self-resolving error page for a subset of visitors. No measurable revenue or order impact.",
    },
    investigation: {
      id: "INV-1038",
      status: "completed",
      stage: "completed",
      startedAt: "2026-09-17T18:16:00Z",
      duration: "13 minutes",
      keyFindings: [
        "The 502 window lasted roughly 90 seconds and affected only a subset of visitors.",
        "Traffic volume crossed the automatic CDN failover threshold at exactly that moment.",
        "Error rate returned to normal on its own, before any action was taken.",
      ],
    },
    evidence: [
      { label: "502 error window", value: "~90 seconds", source: "Website Health Monitor" },
      { label: "Traffic volume", value: "Above CDN failover threshold", source: "CDN" },
      { label: "Recovery", value: "Self-resolved", source: "Website Health Monitor" },
      { label: "Order impact", value: "None measured", source: "Order Management" },
    ],
    rootCause: {
      summary: "Expected CDN failover behavior under a traffic surge",
      explanation:
        "A traffic surge crossed the automatic CDN failover threshold. The brief 502 spike is a normal, self-resolving side effect of that failover, not a fault requiring remediation.",
      confidence: "high",
      supportingEvidence: ["502 error window", "Traffic volume"],
    },
    recommendation: {
      action: "Restart the storefront web tier as a precaution.",
      reason: "Proposed in case the 502 spike did not self-resolve.",
      expectedOutcome: "Would have cleared any lingering error state on the web tier, had it still been needed.",
      riskLevel: "low",
    },
    approval: {
      id: "APR-3007",
      status: "Expired",
      decision: "No decision — request expired",
      decisionBy: "Unassigned — expired before review",
      comment: "The error rate self-resolved before a human reviewed the request.",
    },
    action: {
      id: "ACT-4008",
      performed: "Purge stale CDN edge cache for storefront assets",
      status: "Failed — no cache entries were purged",
      startedAt: "2026-09-17T18:26:00Z",
      completedAt: "2026-09-17T18:28:00Z",
      affectedSystem: "Website Health & Uptime",
    },
    verification: {
      status: "not_started",
      expectedResult: "Storefront error rate returns to its normal range.",
      observedResult:
        "Error rate returned to normal on its own at 18:29, before any successful action — so there was nothing for verification to attribute.",
      finalOutcome: "Incident resolved without action. No remediation was required.",
    },
    timeline: [
      {
        id: "REP-5005-T1",
        timestamp: "2026-09-17T18:15:00Z",
        title: "Incident detected",
        description: "Storefront 502 error-rate spike flagged as INC-2027.",
      },
      {
        id: "REP-5005-T2",
        timestamp: "2026-09-17T18:16:00Z",
        title: "Investigation started",
        description: "INV-1038 opened against the incident.",
      },
      {
        id: "REP-5005-T3",
        timestamp: "2026-09-17T18:20:00Z",
        title: "Evidence collected",
        description: "Error window correlated against traffic volume and the CDN failover event.",
      },
      {
        id: "REP-5005-T4",
        timestamp: "2026-09-17T18:20:00Z",
        title: "Approval requested",
        description: "Precautionary web-tier restart raised as APR-3007.",
      },
      {
        id: "REP-5005-T5",
        timestamp: "2026-09-17T18:28:00Z",
        title: "Follow-up action failed",
        description: "ACT-4008 CDN cache purge timed out; nothing was changed.",
      },
      {
        id: "REP-5005-T6",
        timestamp: "2026-09-17T18:29:00Z",
        title: "Recovery observed",
        description: "Error rate returned to normal without remediation; the incident was resolved.",
      },
      {
        id: "REP-5005-T7",
        timestamp: "2026-09-17T18:35:00Z",
        title: "Approval expired",
        description: "APR-3007 expired unactioned — the restart was no longer needed.",
      },
      {
        id: "REP-5005-T8",
        timestamp: "2026-09-17T18:45:00Z",
        title: "Report generated",
        description: "Final report completed.",
      },
    ],
  },
  {
    id: "REP-5006",
    incidentId: "INC-2023",
    investigationId: "INV-1036",
    title: "Canary release error rate — inconclusive investigation",
    summary:
      "A canary release exceeded its error-rate threshold, but the investigation could not isolate a cause before the canary window closed. The proposed rollback was rejected in favour of manual monitoring.",
    severity: "medium",
    status: "under_review",
    outcome: "unresolved",
    createdAt: "2026-09-18T09:52:00Z",
    updatedAt: "2026-09-18T09:52:00Z",
    executiveSummary: {
      whatHappened:
        "The canary slice of a new release exceeded the automatic error-rate comparison threshold against the stable release.",
      impact: "A small slice of production traffic saw an elevated error rate on the canary release.",
      investigated:
        "The change set between the canary and stable releases was retrieved and the canary's error sample examined for a pattern.",
      conclusion:
        "Inconclusive. The error sample was too small to isolate a specific cause before the canary window closed, so no root cause was established.",
      afterAction:
        "The precautionary rollback (APR-3004) was rejected: the on-call engineer reviewed the change set, judged it low-risk, and kept the canary running under closer manual monitoring. The action was cancelled and the incident remains open.",
    },
    incident: {
      title: "Canary release showing elevated error rate",
      severity: "medium",
      status: "open",
      affectedSystem: "Deployment Pipeline",
      detectedAt: "2026-09-18T09:05:00Z",
      businessImpact:
        "Limited to the canary traffic slice. No broad customer impact observed.",
    },
    investigation: {
      id: "INV-1036",
      status: "failed",
      stage: "analyzing",
      startedAt: "2026-09-18T09:06:00Z",
      duration: "14 minutes before stalling",
      keyFindings: [
        "The canary slice's error rate exceeded the automatic comparison threshold against the stable release.",
        "The error sample was too small to isolate a specific cause.",
        "No root cause was established — this is recorded as inconclusive rather than resolved.",
      ],
    },
    evidence: [
      { label: "Canary error rate", value: "Above automatic threshold", source: "Deployment Pipeline" },
      { label: "Error sample size", value: "Insufficient to isolate cause", source: "Deployment Pipeline" },
      { label: "Traffic slice affected", value: "Canary only", source: "Website Health Monitor" },
    ],
    recommendation: {
      action: "Roll back the canary deployment to the last known-good release.",
      reason:
        "The canary's error rate is elevated and its cause could not be isolated before the canary window closed.",
      expectedOutcome: "Reverting to the known-good release removes the elevated error rate for affected traffic.",
      riskLevel: "high",
    },
    approval: {
      id: "APR-3004",
      status: "Rejected",
      decision: "Rejected",
      decisionAt: "2026-09-18T09:50:00Z",
      decisionBy: "J. Alvarez (On-call Engineer)",
      comment:
        "Change set reviewed manually and judged low-risk. Keeping the canary running with closer manual monitoring instead of a full rollback.",
    },
    action: {
      id: "ACT-4010",
      performed: "Roll back the canary deployment",
      status: "Cancelled — approval rejected",
      affectedSystem: "Deployment Pipeline",
    },
    verification: {
      status: "not_started",
      expectedResult: "Canary slice error rate returns to match the stable release.",
      finalOutcome:
        "Unresolved. No action was taken and no root cause was found; the canary remains under manual monitoring.",
    },
    timeline: [
      {
        id: "REP-5006-T1",
        timestamp: "2026-09-18T09:05:00Z",
        title: "Incident detected",
        description: "Canary error-rate alert raised by the deployment pipeline as INC-2023.",
      },
      {
        id: "REP-5006-T2",
        timestamp: "2026-09-18T09:06:00Z",
        title: "Investigation started",
        description: "INV-1036 opened against the incident.",
      },
      {
        id: "REP-5006-T3",
        timestamp: "2026-09-18T09:12:00Z",
        title: "Evidence collected",
        description: "Change set between the canary and stable releases retrieved.",
      },
      {
        id: "REP-5006-T4",
        timestamp: "2026-09-18T09:20:00Z",
        title: "Investigation stalled",
        description: "Error sample too small to isolate a cause; no root cause established.",
      },
      {
        id: "REP-5006-T5",
        timestamp: "2026-09-18T09:21:00Z",
        title: "Approval requested",
        description: "Precautionary rollback raised as APR-3004 — high risk.",
      },
      {
        id: "REP-5006-T6",
        timestamp: "2026-09-18T09:50:00Z",
        title: "Approval rejected",
        description: "J. Alvarez kept the canary running under closer monitoring; ACT-4010 was cancelled.",
      },
      {
        id: "REP-5006-T7",
        timestamp: "2026-09-18T09:52:00Z",
        title: "Report generated",
        description: "Inconclusive report raised for review.",
      },
    ],
  },
  {
    id: "REP-5007",
    incidentId: "INC-2025",
    title: "Support queue backlog after promotional campaign",
    summary:
      "A promotional campaign produced a support ticket backlog. Re-running auto-triage did not restore first-response times; additional agent capacity did.",
    severity: "low",
    status: "archived",
    outcome: "resolved_without_action",
    createdAt: "2026-09-16T09:30:00Z",
    updatedAt: "2026-09-16T09:30:00Z",
    executiveSummary: {
      whatHappened:
        "Support ticket volume during a promotional campaign ran several times the weekly baseline, and first-response times slipped past target.",
      impact:
        "Customers waited longer than target for a first response across the campaign period.",
      investigated:
        "Ticket volume, triage classification coverage, and agent availability were reviewed. No formal investigation record was opened for this incident.",
      conclusion:
        "A large share of campaign tickets were untriaged, but the binding constraint turned out to be agent capacity rather than routing.",
      afterAction:
        "An auto-triage re-run (ACT-4009) executed cleanly but failed verification — first-response time stayed above target. The backlog was cleared by adding agent capacity, and the incident was closed the following day.",
    },
    incident: {
      title: "Support queue backlog after promotional campaign",
      severity: "low",
      status: "closed",
      affectedSystem: "Customer Support",
      detectedAt: "2026-09-15T11:00:00Z",
      closedAt: "2026-09-16T09:00:00Z",
      businessImpact:
        "First-response time above target for the campaign period, with a knock-on risk to customer satisfaction.",
    },
    evidence: [
      { label: "Ticket volume", value: "Several × weekly baseline", source: "Customer Support" },
      { label: "Untriaged share", value: "Large share of campaign tickets", source: "Customer Support" },
      { label: "First-response time", value: "Above target", source: "Customer Support" },
      { label: "Agent availability", value: "Below campaign demand", source: "Customer Support" },
    ],
    rootCause: {
      summary: "Agent capacity below campaign demand",
      explanation:
        "Untriaged tickets were a visible symptom, but re-triaging them did not restore first-response time. The constraint was the number of agents available relative to campaign volume.",
      confidence: "medium",
      supportingEvidence: ["Agent availability", "First-response time", "Ticket volume"],
    },
    recommendation: {
      action: "Re-run support ticket auto-triage across the untriaged campaign backlog.",
      reason: "Untriaged tickets were the most visible contributor to the slipping first-response time.",
      expectedOutcome: "Average first-response time returns to its target range within an hour.",
      riskLevel: "low",
    },
    approval: {
      status: "Not required",
      decision: "Auto-approved — below the approval threshold",
      decisionAt: "2026-09-15T13:10:00Z",
      decisionBy: "Automatic — below the approval threshold (low risk)",
      comment: "No human review was requested for this low-risk action.",
    },
    action: {
      id: "ACT-4009",
      performed: "Re-run support ticket auto-triage for the promo backlog",
      status: "Completed",
      startedAt: "2026-09-15T13:12:00Z",
      completedAt: "2026-09-15T13:26:00Z",
      affectedSystem: "Customer Support",
    },
    verification: {
      status: "failed",
      expectedResult: "Average first-response time returns to its target range within an hour.",
      observedResult:
        "Tickets were re-triaged successfully, but average first-response time stayed above target — the backlog was an agent-capacity constraint, not a routing one.",
      verifiedAt: "2026-09-15T14:30:00Z",
      finalOutcome:
        "Resolved without the recommended action. Additional agent capacity cleared the backlog and the incident was closed the following morning.",
    },
    timeline: [
      {
        id: "REP-5007-T1",
        timestamp: "2026-09-15T11:00:00Z",
        title: "Incident detected",
        description: "Support queue backlog reported after the promotional campaign (INC-2025).",
      },
      {
        id: "REP-5007-T2",
        timestamp: "2026-09-15T13:10:00Z",
        title: "Recommendation generated",
        description: "Re-run auto-triage across the untriaged campaign backlog; auto-approved as low risk.",
      },
      {
        id: "REP-5007-T3",
        timestamp: "2026-09-15T13:26:00Z",
        title: "Action executed",
        description: "ACT-4009 completed — all targeted tickets received a triage classification.",
      },
      {
        id: "REP-5007-T4",
        timestamp: "2026-09-15T14:30:00Z",
        title: "Verification failed",
        description: "First-response time re-checked and still above target; the action did not achieve its aim.",
      },
      {
        id: "REP-5007-T5",
        timestamp: "2026-09-16T09:00:00Z",
        title: "Incident resolved",
        description: "Backlog cleared with additional agent capacity; incident closed.",
      },
      {
        id: "REP-5007-T6",
        timestamp: "2026-09-16T09:30:00Z",
        title: "Report generated",
        description: "Report completed and archived, including the failed verification.",
      },
    ],
  },
  {
    id: "REP-5008",
    incidentId: "INC-2024",
    title: "API latency spike during scheduled load test",
    summary:
      "API latency rose sharply during a scheduled load test. The behaviour was expected for the test profile and cleared when the test ended.",
    severity: "critical",
    status: "archived",
    outcome: "resolved",
    createdAt: "2026-09-13T09:00:00Z",
    updatedAt: "2026-09-13T09:00:00Z",
    executiveSummary: {
      whatHappened:
        "API response times rose sharply for the duration of a scheduled overnight load test.",
      impact:
        "No customer-facing impact — the test ran against a load profile outside normal traffic hours.",
      investigated:
        "The latency window was compared against the load-test schedule and the traffic profile it generated. No formal investigation record was opened.",
      conclusion:
        "Latency tracked the load-test profile exactly and returned to baseline when the test ended. The alert threshold, not the system, was the thing that needed attention.",
      afterAction:
        "No remediation was required or performed. The incident was closed once the test finished and latency returned to baseline.",
    },
    incident: {
      title: "API latency spike during load test",
      severity: "critical",
      status: "closed",
      affectedSystem: "Website Health & Uptime",
      detectedAt: "2026-09-12T22:00:00Z",
      closedAt: "2026-09-13T01:00:00Z",
      businessImpact: "None. The affected window fell outside normal customer traffic hours.",
    },
    evidence: [
      { label: "Peak API latency", value: "Well above baseline", source: "Website Health Monitor" },
      { label: "Latency window", value: "Matches load-test schedule", source: "Deployment Pipeline" },
      { label: "Customer traffic", value: "Minimal during window", source: "Website Health Monitor" },
      { label: "Post-test latency", value: "Back to baseline", source: "Website Health Monitor" },
    ],
    rootCause: {
      summary: "Expected load-test behaviour, with an alert threshold set for normal traffic",
      explanation:
        "The latency rise tracked the scheduled load test's profile exactly and cleared when the test ended. The alert fired because its threshold assumes normal traffic hours.",
      confidence: "high",
      supportingEvidence: ["Latency window", "Post-test latency"],
    },
    verification: {
      status: "not_started",
      expectedResult: "API latency returns to baseline once the load test completes.",
      observedResult: "Latency returned to baseline at the end of the test window, with no intervention.",
      finalOutcome: "Incident resolved with no action required. Closed as expected test behaviour.",
    },
    timeline: [
      {
        id: "REP-5008-T1",
        timestamp: "2026-09-12T22:00:00Z",
        title: "Incident detected",
        description: "API latency alert raised during the scheduled load test (INC-2024).",
      },
      {
        id: "REP-5008-T2",
        timestamp: "2026-09-12T22:30:00Z",
        title: "Evidence collected",
        description: "Latency window compared against the load-test schedule and traffic profile.",
      },
      {
        id: "REP-5008-T3",
        timestamp: "2026-09-13T01:00:00Z",
        title: "Incident resolved",
        description: "Load test completed, latency returned to baseline, and the incident was closed.",
      },
      {
        id: "REP-5008-T4",
        timestamp: "2026-09-13T09:00:00Z",
        title: "Report generated",
        description: "Report completed and archived.",
      },
    ],
  },
];
