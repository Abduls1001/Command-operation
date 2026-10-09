/**
 * Mock data for the Dashboard page (Phase 3).
 *
 * Per DECISIONS.md D-012, UI phases (3–8) are built against isolated,
 * per-domain mock modules rather than inline literals scattered through
 * components. Phase 10 deletes this file and replaces it with real API
 * calls — the shapes below are written as the contract that swap must
 * satisfy, not as throwaway fixtures.
 *
 * All values are static, hand-picked demo numbers (never randomised), and
 * describe one coherent scenario: a payment-gateway incident in progress,
 * consistent with the reference scenario in PROJECT_SPEC.md §5.
 */

export type Trend = "up" | "down" | "flat";
export type Tone = "positive" | "negative" | "neutral";

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  trend: Trend;
  delta: string;
  tone: Tone;
}

export type SystemStatusLevel = "operational" | "degraded" | "investigating" | "outage";

export interface OperationalHealthItem {
  id: string;
  name: string;
  status: SystemStatusLevel;
  detail: string;
}

export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "awaiting_approval" | "resolved";

export type AiActivityType =
  | "investigation_started"
  | "evidence_collected"
  | "root_cause_identified"
  | "recommendation_generated"
  | "awaiting_approval";

export interface AiActivityItem {
  id: string;
  type: AiActivityType;
  incidentId: string;
  message: string;
  timestamp: string;
}

export interface SystemStatusItem {
  id: string;
  name: string;
  status: SystemStatusLevel;
  uptime: string;
  responseTime: string;
  lastChecked: string;
}

/** Page-header "last updated" placeholder. Static, per Phase 3 scope. */
export const LAST_UPDATED = "Today at 9:42 AM";

/** Quick-glance strip — the core systems most likely to explain a sales drop. */
export const OPERATIONAL_HEALTH: OperationalHealthItem[] = [
  {
    id: "payments",
    name: "Payment System",
    status: "investigating",
    detail: "Primary gateway error rate elevated",
  },
  {
    id: "website",
    name: "Website",
    status: "operational",
    detail: "Uptime and response time nominal",
  },
  {
    id: "order-processing",
    name: "Order Processing",
    status: "degraded",
    detail: "Completed orders down 34% vs forecast",
  },
  {
    id: "inventory",
    name: "Inventory",
    status: "operational",
    detail: "Stock levels within expected range",
  },
];

export const AI_ACTIVITY: AiActivityItem[] = [
  {
    id: "act-1",
    type: "investigation_started",
    incidentId: "INC-2031",
    message: "Investigation started for INC-2031",
    timestamp: "22 minutes ago",
  },
  {
    id: "act-2",
    type: "evidence_collected",
    incidentId: "INC-2031",
    message:
      "Order funnel data collected: attempted orders normal, completed orders down 34%",
    timestamp: "19 minutes ago",
  },
  {
    id: "act-3",
    type: "evidence_collected",
    incidentId: "INC-2031",
    message: "Payment gateway error rate measured at 27%, against a 2% baseline",
    timestamp: "14 minutes ago",
  },
  {
    id: "act-4",
    type: "root_cause_identified",
    incidentId: "INC-2031",
    message: "Root cause identified: primary payment gateway degraded (confidence: high)",
    timestamp: "9 minutes ago",
  },
  {
    id: "act-5",
    type: "recommendation_generated",
    incidentId: "INC-2031",
    message: "Recommendation generated: switch to backup payment gateway",
    timestamp: "6 minutes ago",
  },
  {
    id: "act-6",
    type: "awaiting_approval",
    incidentId: "INC-2031",
    message: "Recommendation is waiting for human approval",
    timestamp: "4 minutes ago",
  },
];

/** Full detail list — the seven NovaCommerce systems, per PROJECT_SPEC.md §3. */
export const SYSTEM_STATUS: SystemStatusItem[] = [
  {
    id: "storefront",
    name: "Storefront & Checkout",
    status: "operational",
    uptime: "99.98%",
    responseTime: "142 ms",
    lastChecked: "1 minute ago",
  },
  {
    id: "order-management",
    name: "Order Management",
    status: "degraded",
    uptime: "99.61%",
    responseTime: "310 ms",
    lastChecked: "1 minute ago",
  },
  {
    id: "payment-processing",
    name: "Payment Processing",
    status: "investigating",
    uptime: "97.84%",
    responseTime: "890 ms",
    lastChecked: "1 minute ago",
  },
  {
    id: "inventory-management",
    name: "Inventory Management",
    status: "operational",
    uptime: "99.95%",
    responseTime: "118 ms",
    lastChecked: "2 minutes ago",
  },
  {
    id: "customer-support",
    name: "Customer Support",
    status: "operational",
    uptime: "99.90%",
    responseTime: "205 ms",
    lastChecked: "3 minutes ago",
  },
  {
    id: "website-health",
    name: "Website Health & Uptime",
    status: "operational",
    uptime: "99.99%",
    responseTime: "96 ms",
    lastChecked: "1 minute ago",
  },
  {
    id: "deployment-pipeline",
    name: "Deployment Pipeline",
    status: "operational",
    uptime: "100%",
    responseTime: "—",
    lastChecked: "18 minutes ago",
  },
];
