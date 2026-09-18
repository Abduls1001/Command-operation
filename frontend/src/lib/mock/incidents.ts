/**
 * Mock data for the Incidents domain (Phase 4).
 *
 * Per DECISIONS.md D-012, UI phases (3–8) are built against isolated,
 * per-domain mock modules. Phase 10 deletes this file and replaces it with
 * real API calls — the `Incident` type below is written as the contract
 * that swap must satisfy.
 *
 * Status and severity values match the domain model in PROJECT_SPEC.md §7
 * ("lifecycle status: open, investigating, awaiting approval, resolved,
 * closed") and are consistent with the `IncidentStatus`/`IncidentSeverity`
 * vocabulary already introduced by the Dashboard in Phase 3
 * (lib/mock/dashboard.ts) — this module extends that vocabulary with
 * `closed`, the one lifecycle state the Dashboard's "active incidents"
 * view had no reason to show.
 *
 * Timestamps are real ISO strings so sorting ("Newest"/"Oldest") is genuine
 * date comparison rather than a hand-ordered array. Display labels are
 * derived from those timestamps against a fixed reference "now"
 * (`DEMO_NOW`), not the real current time — this keeps the demo fully
 * static and deterministic (server and client always render the same
 * string) while still demonstrating real date logic.
 */

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export type IncidentStatus =
  | "open"
  | "investigating"
  | "awaiting_approval"
  | "resolved"
  | "closed";

export type IncidentSource =
  | "Automated Monitoring"
  | "Customer Report"
  | "Manual Report"
  | "Deployment Alert";

/**
 * The NovaCommerce systems an incident can be attributed to. Overlaps
 * deliberately with the system names in lib/mock/dashboard.ts's
 * SYSTEM_STATUS so an incident's `affectedSystem` reads as the same system
 * everywhere in the app. "Notification Service" is the one addition — it
 * has no tile on the Dashboard's System Status grid yet (Systems & Tools,
 * where capability/health per system is meant to live, is a later phase),
 * but PROJECT_SPEC's incident categories call for it, so it is included
 * here and left as a known gap — see CURRENT_STATE.md.
 */
export const AFFECTED_SYSTEMS = [
  "Payment Processing",
  "Storefront & Checkout",
  "Order Management",
  "Inventory Management",
  "Notification Service",
  "Website Health & Uptime",
  "Customer Support",
  "Deployment Pipeline",
] as const;

export type AffectedSystem = (typeof AFFECTED_SYSTEMS)[number];

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  affectedSystem: AffectedSystem;
  /** ISO 8601. When the incident was first detected/reported. */
  createdAt: string;
  /** ISO 8601. When the incident record last changed. */
  updatedAt: string;
  /** A short note on where things stand right now — shown in the detail view. */
  operationalContext: string;
}

/**
 * The fixed "current moment" this demo dataset is written against, matching
 * the Dashboard's "Last updated: Today at 9:42 AM" (Phase 3). All relative
 * time labels ("22 minutes ago") are computed against this constant, not
 * against the real clock.
 */
export const DEMO_NOW = new Date("2026-09-18T09:42:00Z");

/**
 * Nine incidents spanning every category named in DEVELOPMENT_PLAN's Phase
 * 4 scope (payment failures, checkout degradation, order delays, inventory
 * sync, notification failures, website/API degradation), every severity,
 * every status, and every source. INC-2031, INC-2030, and INC-2027 are the
 * same incidents already summarized on the Dashboard — their id, title, and
 * severity intentionally match lib/mock/dashboard.ts so the two pages agree
 * and the Dashboard can link straight into an incident's detail page.
 */
export const INCIDENTS: Incident[] = [
  {
    id: "INC-2031",
    title: "Checkout success rate dropped sharply",
    description:
      "Completed orders are down 34% versus forecast while attempted orders remain normal — the funnel is breaking late, not early. Primary payment gateway error rate is elevated over its 7-day baseline.",
    severity: "critical",
    status: "investigating",
    source: "Automated Monitoring",
    affectedSystem: "Payment Processing",
    createdAt: "2026-09-18T09:20:00Z",
    updatedAt: "2026-09-18T09:38:00Z",
    operationalContext:
      "An investigation is in progress. Evidence collected so far points to the primary payment gateway; no action has been recommended yet.",
  },
  {
    id: "INC-2030",
    title: "Elevated dispatch delays — West Coast warehouse",
    description:
      "An inventory sync delay is causing late fulfillment on approximately 40 orders shipping from the West Coast warehouse.",
    severity: "medium",
    status: "awaiting_approval",
    source: "Automated Monitoring",
    affectedSystem: "Inventory Management",
    createdAt: "2026-09-18T08:02:00Z",
    updatedAt: "2026-09-18T09:15:00Z",
    operationalContext:
      "A recommended fix is queued in the Approvals queue, pending human authorization before it is executed.",
  },
  {
    id: "INC-2029",
    title: "Order confirmation emails not sending",
    description:
      "Multiple customers have reported that order confirmation and shipping-update emails never arrived, despite orders completing successfully.",
    severity: "high",
    status: "open",
    source: "Customer Report",
    affectedSystem: "Notification Service",
    createdAt: "2026-09-18T07:10:00Z",
    updatedAt: "2026-09-18T07:10:00Z",
    operationalContext:
      "Reported by customer support. Not yet picked up for investigation.",
  },
  {
    id: "INC-2028",
    title: "Order processing delayed beyond SLA for standard shipping",
    description:
      "Standard-shipping orders placed since this morning are taking longer than the fulfillment SLA to move from \"paid\" to \"processing.\"",
    severity: "medium",
    status: "investigating",
    source: "Automated Monitoring",
    affectedSystem: "Order Management",
    createdAt: "2026-09-18T06:45:00Z",
    updatedAt: "2026-09-18T08:50:00Z",
    operationalContext:
      "Under investigation. Initial evidence suggests a queue backlog rather than a full outage.",
  },
  {
    id: "INC-2026",
    title: "Backup payment gateway certificate nearing expiry",
    description:
      "The TLS certificate used by the backup payment gateway integration is due to expire within 72 hours, which would remove the failover path for payment processing.",
    severity: "high",
    status: "resolved",
    source: "Automated Monitoring",
    affectedSystem: "Payment Processing",
    createdAt: "2026-09-17T14:05:00Z",
    updatedAt: "2026-09-17T19:30:00Z",
    operationalContext:
      "The certificate was renewed and the backup gateway path was verified. No customer impact occurred.",
  },
  {
    id: "INC-2025",
    title: "Support queue backlog after promotional campaign",
    description:
      "A promotional email campaign drove a spike in customer support tickets that exceeded normal staffing coverage overnight.",
    severity: "low",
    status: "closed",
    source: "Manual Report",
    affectedSystem: "Customer Support",
    createdAt: "2026-09-15T11:00:00Z",
    updatedAt: "2026-09-16T09:00:00Z",
    operationalContext:
      "Backlog was cleared during the next shift. Closed with no further action required.",
  },
  {
    id: "INC-2027",
    title: "Intermittent website 502s during traffic spike",
    description:
      "A brief error-rate spike coincided with a CDN failover during a traffic surge, returning HTTP 502 responses to a subset of visitors.",
    severity: "low",
    status: "resolved",
    source: "Automated Monitoring",
    affectedSystem: "Website Health & Uptime",
    createdAt: "2026-09-17T18:15:00Z",
    updatedAt: "2026-09-17T18:29:00Z",
    operationalContext:
      "Verification confirmed error rates returned to baseline within minutes of the CDN failover completing.",
  },
  {
    id: "INC-2024",
    title: "API latency spike during load test",
    description:
      "Scheduled load testing against the storefront API produced a sustained p95 latency spike well above the normal operating range.",
    severity: "critical",
    status: "closed",
    source: "Automated Monitoring",
    affectedSystem: "Website Health & Uptime",
    createdAt: "2026-09-12T22:00:00Z",
    updatedAt: "2026-09-13T01:00:00Z",
    operationalContext:
      "Confirmed as an expected side effect of scheduled load testing, not a genuine production incident. Closed after review.",
  },
  {
    id: "INC-2023",
    title: "Canary release showing elevated error rate",
    description:
      "The canary slice of the latest storefront deployment is returning a higher error rate than the stable release it is being compared against.",
    severity: "medium",
    status: "open",
    source: "Deployment Alert",
    affectedSystem: "Deployment Pipeline",
    createdAt: "2026-09-18T09:05:00Z",
    updatedAt: "2026-09-18T09:05:00Z",
    operationalContext: "Flagged automatically by the deployment pipeline. Not yet triaged.",
  },
];

/**
 * Formats an ISO timestamp as a relative label ("22 minutes ago", "Yesterday
 * at 6:15 PM") against the fixed DEMO_NOW reference rather than the real
 * clock, so the output is identical on every render.
 */
export function formatRelativeToDemoNow(iso: string): string {
  const date = new Date(iso);
  const diffMs = DEMO_NOW.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const startOfToday = new Date(DEMO_NOW);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setUTCHours(0, 0, 0, 0);
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  if (dayDiff === 1) return `Yesterday at ${time}`;
  if (dayDiff < 7) return `${dayDiff} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function getIncidentById(id: string): Incident | undefined {
  return INCIDENTS.find((incident) => incident.id === id);
}
