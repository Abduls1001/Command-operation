/**
 * Mock data for the Investigations domain (Phase 5).
 *
 * Per DECISIONS.md D-012, UI phases (3–8) are built against isolated,
 * per-domain mock modules. Phase 10 deletes this file and replaces it with
 * real API calls — and Phase 13, much later, replaces the *content* with a
 * real agent's output. Nothing here is live: every timeline event, evidence
 * item, finding, root cause, and recommendation is hand-written demo
 * content, not the output of a model. Components that render this data
 * label it accordingly (see components/investigations/).
 *
 * Domain vocabulary matches PROJECT_SPEC.md §7 (Investigation, Evidence,
 * Root Cause, Recommendation are precise, distinct concepts — evidence is
 * factual output, a root cause is a conclusion drawn from it, a
 * recommendation is a proposal, not an action).
 *
 * `incidentId` values reference incidents already defined in
 * lib/mock/incidents.ts (Phase 4), so an investigation's "related incident"
 * link resolves to a real incident detail page.
 */

export type InvestigationStatus = "running" | "completed" | "awaiting_approval" | "failed" | "paused";

export type InvestigationStage =
  | "initializing"
  | "collecting_evidence"
  | "analyzing"
  | "root_cause_identified"
  | "recommendation_ready"
  | "awaiting_approval"
  | "completed";

export type ConfidenceLevel = "low" | "medium" | "high";

export type RelevanceLevel = "high" | "medium" | "low";

export interface TimelineEvent {
  id: string;
  /** ISO 8601. */
  timestamp: string;
  title: string;
  description: string;
  /** The simulated tool/system this step represents — e.g. "Sales Analytics". */
  source?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  source: string;
  /** ISO 8601. */
  collectedAt: string;
  observation: string;
  relevance: RelevanceLevel;
}

export interface Finding {
  id: string;
  observation: string;
  analysis: string;
  /** Which evidence items this finding draws its analysis from. */
  relatedEvidenceIds: string[];
}

export interface RootCause {
  summary: string;
  explanation: string;
  confidence: ConfidenceLevel;
  supportingEvidenceIds: string[];
}

export interface Recommendation {
  action: string;
  reason: string;
  expectedEffect: string;
  approvalRequired: boolean;
}

export interface Investigation {
  id: string;
  incidentId: string;
  title: string;
  status: InvestigationStatus;
  stage: InvestigationStage;
  /** ISO 8601. */
  startedAt: string;
  /** ISO 8601. */
  updatedAt: string;
  /** Present once a root cause has been identified; absent before that. */
  confidence?: ConfidenceLevel;
  timeline: TimelineEvent[];
  evidence: EvidenceItem[];
  findings: Finding[];
  /** Absent until the investigation reaches root_cause_identified or later. */
  rootCause?: RootCause;
  /** Absent until the investigation reaches recommendation_ready or later. */
  recommendation?: Recommendation;
}

/**
 * The lifecycle stages an investigation's progress bar visualizes, in
 * order, per the takeover brief's diagram (Started → Evidence Collection →
 * … → Resolution). Each `InvestigationStage` value maps to exactly one of
 * these — see STAGE_TO_PROGRESS_INDEX below.
 */
export const PROGRESS_STAGES = [
  "Started",
  "Evidence Collection",
  "Analysis",
  "Root Cause",
  "Recommendation",
  "Approval",
  "Resolution",
] as const;

export const STAGE_TO_PROGRESS_INDEX: Record<InvestigationStage, number> = {
  initializing: 0,
  collecting_evidence: 1,
  analyzing: 2,
  root_cause_identified: 3,
  recommendation_ready: 4,
  awaiting_approval: 5,
  completed: 6,
};

/**
 * Seven investigations, tied to real incidents from lib/mock/incidents.ts,
 * covering every status and a spread of stages. INV-1042 is the flagship
 * example — it follows the worked scenario from PROJECT_SPEC.md §5
 * (payment gateway degradation) all the way through to a recommendation
 * awaiting approval, with the fullest timeline/evidence/findings set.
 * Investigations still at an earlier stage deliberately have no root cause
 * or recommendation yet — the detail view says so rather than inventing one.
 */
export const INVESTIGATIONS: Investigation[] = [
  {
    id: "INV-1042",
    incidentId: "INC-2031",
    title: "Checkout success-rate drop — payment gateway investigation",
    status: "awaiting_approval",
    stage: "awaiting_approval",
    startedAt: "2026-09-18T09:20:00Z",
    updatedAt: "2026-09-18T09:38:00Z",
    confidence: "high",
    timeline: [
      {
        id: "t1",
        timestamp: "2026-09-18T09:20:00Z",
        title: "Investigation started",
        description: "Triggered by INC-2031: checkout success rate dropped sharply.",
        source: "Incident Intake",
      },
      {
        id: "t2",
        timestamp: "2026-09-18T09:21:00Z",
        title: "Sales data checked",
        description: "Reviewed today's revenue and order volume against the 7-day baseline.",
        source: "Sales Analytics",
      },
      {
        id: "t3",
        timestamp: "2026-09-18T09:23:00Z",
        title: "Order funnel examined",
        description:
          "Compared attempted orders against completed orders. Attempted orders were normal; completed orders were down 34%.",
        source: "Order Analytics",
      },
      {
        id: "t4",
        timestamp: "2026-09-18T09:26:00Z",
        title: "Payment failures detected",
        description: "Payment failure rate measured at 27%, against a 7-day baseline of 2%.",
        source: "Payment Gateway Monitor",
      },
      {
        id: "t5",
        timestamp: "2026-09-18T09:29:00Z",
        title: "Gateway response errors collected",
        description: "Primary gateway returning elevated 5xx responses concentrated on card payments.",
        source: "Payment Gateway Monitor",
      },
      {
        id: "t6",
        timestamp: "2026-09-18T09:31:00Z",
        title: "Website health checked",
        description: "Storefront uptime and response time remained within normal range — ruled out as a contributing factor.",
        source: "Website Health Monitor",
      },
      {
        id: "t7",
        timestamp: "2026-09-18T09:33:00Z",
        title: "Evidence correlated",
        description:
          "The order-funnel break, the elevated failure rate, and the gateway error spike all point at the same window and the same system.",
        source: "Correlation Engine",
      },
      {
        id: "t8",
        timestamp: "2026-09-18T09:35:00Z",
        title: "Root cause candidate identified",
        description: "Primary payment gateway degradation identified as the likely root cause, with high confidence.",
        source: "Root Cause Engine",
      },
      {
        id: "t9",
        timestamp: "2026-09-18T09:37:00Z",
        title: "Recommendation generated",
        description: "Recommended switching affected payment traffic to the backup gateway.",
        source: "Recommendation Engine",
      },
      {
        id: "t10",
        timestamp: "2026-09-18T09:38:00Z",
        title: "Waiting for approval",
        description: "Recommendation queued in the Approvals queue pending human authorization.",
        source: "Approval Gate",
      },
    ],
    evidence: [
      {
        id: "e1",
        title: "Revenue dropped 18.4% versus forecast",
        source: "Sales Analytics",
        collectedAt: "2026-09-18T09:21:00Z",
        observation: "Today's revenue is running 18.4% below the forecast built from the trailing 7 days.",
        relevance: "medium",
      },
      {
        id: "e2",
        title: "Completed orders down 34% while attempted orders are normal",
        source: "Order Analytics",
        collectedAt: "2026-09-18T09:23:00Z",
        observation: "Attempted-order volume matches baseline; completed-order volume is down 34% — the funnel is breaking late.",
        relevance: "high",
      },
      {
        id: "e3",
        title: "Payment failure rate elevated to 27%",
        source: "Payment Gateway Monitor",
        collectedAt: "2026-09-18T09:26:00Z",
        observation: "Primary gateway failure rate measured at 27%, against a 7-day baseline of 2%.",
        relevance: "high",
      },
      {
        id: "e4",
        title: "Gateway returned elevated 5xx errors",
        source: "Payment Gateway Monitor",
        collectedAt: "2026-09-18T09:29:00Z",
        observation: "5xx responses concentrated on card-payment authorization calls to the primary gateway.",
        relevance: "high",
      },
      {
        id: "e5",
        title: "Website remained operational",
        source: "Website Health Monitor",
        collectedAt: "2026-09-18T09:31:00Z",
        observation: "Storefront uptime and response time stayed within normal range throughout the window.",
        relevance: "low",
      },
    ],
    findings: [
      {
        id: "f1",
        observation: "The order funnel breaks after checkout is initiated, not before it.",
        analysis:
          "Attempted orders are unaffected, which rules out traffic, marketing, or storefront issues and points downstream — toward payment processing.",
        relatedEvidenceIds: ["e2"],
      },
      {
        id: "f2",
        observation: "Payment failures and gateway errors rose in the same window as the order-completion drop.",
        analysis:
          "The timing and magnitude of the failure-rate spike are consistent with the size of the completed-order drop, supporting a shared cause rather than a coincidence.",
        relatedEvidenceIds: ["e2", "e3", "e4"],
      },
      {
        id: "f3",
        observation: "Website health is unaffected.",
        analysis: "Ruling out storefront/infrastructure issues narrows the likely cause to the payment path specifically.",
        relatedEvidenceIds: ["e5"],
      },
    ],
    rootCause: {
      summary: "Primary payment gateway degradation",
      explanation:
        "The primary payment gateway is returning an elevated rate of server errors on card-payment authorization. This causes otherwise-valid checkouts to fail after the order is initiated, which matches the observed funnel break, the failure-rate spike, and the gateway's own error evidence, while other systems remain healthy.",
      confidence: "high",
      supportingEvidenceIds: ["e2", "e3", "e4"],
    },
    recommendation: {
      action: "Switch affected payment traffic to the backup gateway.",
      reason: "The backup gateway is healthy and can absorb card-payment traffic while the primary gateway is degraded.",
      expectedEffect: "Payment failure rate and completed-order volume should return to baseline within minutes of the switch.",
      approvalRequired: true,
    },
  },
  {
    id: "INV-1041",
    incidentId: "INC-2030",
    title: "West Coast warehouse dispatch delay investigation",
    status: "awaiting_approval",
    stage: "awaiting_approval",
    startedAt: "2026-09-18T08:05:00Z",
    updatedAt: "2026-09-18T09:15:00Z",
    confidence: "medium",
    timeline: [
      {
        id: "t1",
        timestamp: "2026-09-18T08:05:00Z",
        title: "Investigation started",
        description: "Triggered by INC-2030: elevated dispatch delays at the West Coast warehouse.",
        source: "Incident Intake",
      },
      {
        id: "t2",
        timestamp: "2026-09-18T08:20:00Z",
        title: "Inventory sync logs collected",
        description: "Reviewed the inventory sync job's recent run history for the affected warehouse.",
        source: "Inventory Sync Monitor",
      },
      {
        id: "t3",
        timestamp: "2026-09-18T08:50:00Z",
        title: "Delayed orders correlated to a sync lag window",
        description: "The ~40 delayed orders all fall inside a two-hour window where sync latency was elevated.",
        source: "Correlation Engine",
      },
      {
        id: "t4",
        timestamp: "2026-09-18T09:05:00Z",
        title: "Recommendation generated",
        description: "Recommended forcing a manual inventory re-sync for the affected warehouse.",
        source: "Recommendation Engine",
      },
      {
        id: "t5",
        timestamp: "2026-09-18T09:15:00Z",
        title: "Waiting for approval",
        description: "Recommendation queued in the Approvals queue.",
        source: "Approval Gate",
      },
    ],
    evidence: [
      {
        id: "e1",
        title: "Inventory sync latency elevated for ~2 hours",
        source: "Inventory Sync Monitor",
        collectedAt: "2026-09-18T08:20:00Z",
        observation: "Sync job latency rose to several times its normal duration during the affected window.",
        relevance: "high",
      },
      {
        id: "e2",
        title: "~40 orders delayed past fulfillment SLA",
        source: "Order Analytics",
        collectedAt: "2026-09-18T08:50:00Z",
        observation: "All delayed orders originate from the West Coast warehouse and fall inside the sync-lag window.",
        relevance: "high",
      },
    ],
    findings: [
      {
        id: "f1",
        observation: "Every delayed order maps to the same warehouse and the same time window.",
        analysis: "The tight correlation between the sync-lag window and the delayed orders points at the sync job rather than the warehouse's physical operations.",
        relatedEvidenceIds: ["e1", "e2"],
      },
    ],
    rootCause: {
      summary: "Inventory sync job fell behind for the West Coast warehouse",
      explanation:
        "A temporary lag in the inventory sync job meant stock updates from the warehouse reached the order system late, delaying dispatch for orders placed during that window.",
      confidence: "medium",
      supportingEvidenceIds: ["e1", "e2"],
    },
    recommendation: {
      action: "Trigger a manual inventory re-sync for the West Coast warehouse.",
      reason: "A forced re-sync clears the backlog immediately rather than waiting for the next scheduled run.",
      expectedEffect: "Affected orders should move to \"processing\" within the next sync cycle.",
      approvalRequired: true,
    },
  },
  {
    id: "INV-1040",
    incidentId: "INC-2028",
    title: "Standard-shipping order processing delay investigation",
    status: "running",
    stage: "analyzing",
    startedAt: "2026-09-18T06:50:00Z",
    updatedAt: "2026-09-18T08:50:00Z",
    timeline: [
      {
        id: "t1",
        timestamp: "2026-09-18T06:50:00Z",
        title: "Investigation started",
        description: "Triggered by INC-2028: order processing delayed beyond SLA for standard shipping.",
        source: "Incident Intake",
      },
      {
        id: "t2",
        timestamp: "2026-09-18T07:30:00Z",
        title: "Order queue depth checked",
        description: "Order-processing queue depth is elevated versus its usual daytime range.",
        source: "Order Analytics",
      },
      {
        id: "t3",
        timestamp: "2026-09-18T08:50:00Z",
        title: "Analyzing queue growth pattern",
        description: "Comparing queue growth against recent deployments and traffic volume to narrow the cause.",
        source: "Analysis Engine",
      },
    ],
    evidence: [
      {
        id: "e1",
        title: "Order-processing queue depth elevated",
        source: "Order Analytics",
        collectedAt: "2026-09-18T07:30:00Z",
        observation: "Queue depth is roughly 3x its usual mid-morning level and still climbing.",
        relevance: "high",
      },
      {
        id: "e2",
        title: "No elevated error rate on the order-processing service",
        source: "Order Analytics",
        collectedAt: "2026-09-18T08:10:00Z",
        observation: "The service is accepting and processing orders without errors — just more slowly than the queue is filling.",
        relevance: "medium",
      },
    ],
    findings: [
      {
        id: "f1",
        observation: "The queue is filling faster than it drains, without any processing errors.",
        analysis: "This pattern is more consistent with a throughput bottleneck than an outage, but the specific bottleneck is not yet isolated.",
        relatedEvidenceIds: ["e1", "e2"],
      },
    ],
  },
  {
    id: "INV-1039",
    incidentId: "INC-2026",
    title: "Backup payment gateway certificate expiry investigation",
    status: "completed",
    stage: "completed",
    startedAt: "2026-09-17T14:10:00Z",
    updatedAt: "2026-09-17T19:30:00Z",
    confidence: "high",
    timeline: [
      {
        id: "t1",
        timestamp: "2026-09-17T14:10:00Z",
        title: "Investigation started",
        description: "Triggered by an automated certificate-expiry warning for the backup payment gateway.",
        source: "Incident Intake",
      },
      {
        id: "t2",
        timestamp: "2026-09-17T14:30:00Z",
        title: "Certificate details collected",
        description: "Confirmed expiry within 72 hours and identified the renewal owner.",
        source: "Certificate Monitor",
      },
      {
        id: "t3",
        timestamp: "2026-09-17T18:45:00Z",
        title: "Recommendation generated",
        description: "Recommended renewing the certificate ahead of expiry.",
        source: "Recommendation Engine",
      },
      {
        id: "t4",
        timestamp: "2026-09-17T19:00:00Z",
        title: "Recommendation approved and executed",
        description: "Certificate renewed and the backup gateway path re-verified.",
        source: "Approval Gate",
      },
      {
        id: "t5",
        timestamp: "2026-09-17T19:30:00Z",
        title: "Verified and closed",
        description: "Backup gateway path confirmed healthy with the new certificate. Investigation completed.",
        source: "Verification",
      },
    ],
    evidence: [
      {
        id: "e1",
        title: "TLS certificate expiring within 72 hours",
        source: "Certificate Monitor",
        collectedAt: "2026-09-17T14:30:00Z",
        observation: "The backup gateway integration's certificate was due to expire in under 72 hours.",
        relevance: "high",
      },
    ],
    findings: [
      {
        id: "f1",
        observation: "No other systems were affected.",
        analysis: "This was a preventive finding rather than an active incident — the certificate had not yet expired.",
        relatedEvidenceIds: ["e1"],
      },
    ],
    rootCause: {
      summary: "Backup payment gateway certificate nearing expiry",
      explanation: "The TLS certificate securing the backup gateway integration was approaching its expiry date without a renewal scheduled.",
      confidence: "high",
      supportingEvidenceIds: ["e1"],
    },
    recommendation: {
      action: "Renew the backup gateway's TLS certificate.",
      reason: "Prevent loss of the payment failover path before it is needed.",
      expectedEffect: "Backup gateway remains available as a failover option with no interruption.",
      approvalRequired: true,
    },
  },
  {
    id: "INV-1038",
    incidentId: "INC-2027",
    title: "Intermittent website 502s during traffic spike investigation",
    status: "completed",
    stage: "completed",
    startedAt: "2026-09-17T18:16:00Z",
    updatedAt: "2026-09-17T18:29:00Z",
    confidence: "high",
    timeline: [
      {
        id: "t1",
        timestamp: "2026-09-17T18:16:00Z",
        title: "Investigation started",
        description: "Triggered by a brief 502 error-rate spike on the storefront.",
        source: "Incident Intake",
      },
      {
        id: "t2",
        timestamp: "2026-09-17T18:20:00Z",
        title: "CDN failover event correlated",
        description: "Error spike aligned exactly with a CDN failover triggered by a traffic surge.",
        source: "Website Health Monitor",
      },
      {
        id: "t3",
        timestamp: "2026-09-17T18:29:00Z",
        title: "Recovery verified",
        description: "Error rate returned to baseline within minutes; no further action required. Investigation completed.",
        source: "Verification",
      },
    ],
    evidence: [
      {
        id: "e1",
        title: "502 error rate spiked briefly",
        source: "Website Health Monitor",
        collectedAt: "2026-09-17T18:18:00Z",
        observation: "A subset of visitors received HTTP 502 responses for roughly 90 seconds.",
        relevance: "high",
      },
      {
        id: "e2",
        title: "Traffic surge triggered a CDN failover",
        source: "Website Health Monitor",
        collectedAt: "2026-09-17T18:20:00Z",
        observation: "Traffic volume crossed the threshold that triggers automatic CDN failover at the same moment as the error spike.",
        relevance: "high",
      },
    ],
    findings: [
      {
        id: "f1",
        observation: "The error window matches the failover event precisely.",
        analysis: "The 502s are a known, expected side effect of the failover mechanism rather than a genuine service fault.",
        relatedEvidenceIds: ["e1", "e2"],
      },
    ],
    rootCause: {
      summary: "Expected CDN failover behavior under a traffic surge",
      explanation: "A traffic surge crossed the automatic CDN failover threshold. The brief 502 spike is a normal, self-resolving side effect of that failover, not a fault requiring remediation.",
      confidence: "high",
      supportingEvidenceIds: ["e1", "e2"],
    },
  },
  {
    id: "INV-1037",
    incidentId: "INC-2029",
    title: "Order confirmation email delivery investigation",
    status: "paused",
    stage: "collecting_evidence",
    startedAt: "2026-09-18T07:15:00Z",
    updatedAt: "2026-09-18T07:40:00Z",
    timeline: [
      {
        id: "t1",
        timestamp: "2026-09-18T07:15:00Z",
        title: "Investigation started",
        description: "Triggered by customer reports of missing order-confirmation emails.",
        source: "Incident Intake",
      },
      {
        id: "t2",
        timestamp: "2026-09-18T07:40:00Z",
        title: "Investigation paused",
        description: "Paused pending access to notification-service delivery logs.",
        source: "Incident Intake",
      },
    ],
    evidence: [
      {
        id: "e1",
        title: "Multiple customer reports of missing emails",
        source: "Customer Support",
        collectedAt: "2026-09-18T07:10:00Z",
        observation: "Several customers reported completed orders with no confirmation or shipping-update email received.",
        relevance: "medium",
      },
    ],
    findings: [],
  },
  {
    id: "INV-1036",
    incidentId: "INC-2023",
    title: "Canary release error-rate investigation",
    status: "failed",
    stage: "analyzing",
    startedAt: "2026-09-18T09:06:00Z",
    updatedAt: "2026-09-18T09:20:00Z",
    timeline: [
      {
        id: "t1",
        timestamp: "2026-09-18T09:06:00Z",
        title: "Investigation started",
        description: "Triggered automatically by the deployment pipeline's canary error-rate alert.",
        source: "Incident Intake",
      },
      {
        id: "t2",
        timestamp: "2026-09-18T09:12:00Z",
        title: "Deployment diff collected",
        description: "Retrieved the change set between the canary release and the stable release.",
        source: "Deployment Pipeline",
      },
      {
        id: "t3",
        timestamp: "2026-09-18T09:20:00Z",
        title: "Investigation failed",
        description: "Could not obtain a large enough canary error sample to isolate a cause before the canary window closed.",
        source: "Analysis Engine",
      },
    ],
    evidence: [
      {
        id: "e1",
        title: "Canary error rate above threshold",
        source: "Deployment Pipeline",
        collectedAt: "2026-09-18T09:05:00Z",
        observation: "The canary slice's error rate exceeded the automatic comparison threshold against the stable release.",
        relevance: "medium",
      },
    ],
    findings: [],
  },
];

export function getInvestigationById(id: string): Investigation | undefined {
  return INVESTIGATIONS.find((investigation) => investigation.id === id);
}

export function getInvestigationsByIncidentId(incidentId: string): Investigation[] {
  return INVESTIGATIONS.filter((investigation) => investigation.incidentId === incidentId);
}
