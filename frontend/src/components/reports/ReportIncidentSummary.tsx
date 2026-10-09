import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { formatReportTimestamp, type ReportIncidentSummary as IncidentSummaryContent } from "@/lib/mock/reports";

import { ReportSeverityBadge } from "./ReportSeverityBadge";

interface ReportIncidentSummaryProps {
  incidentId: string;
  incident: IncidentSummaryContent;
}

const STATUS_LABEL: Record<IncidentSummaryContent["status"], string> = {
  open: "Open",
  investigating: "Investigating",
  awaiting_approval: "Awaiting Approval",
  resolved: "Resolved",
  closed: "Closed",
};

/**
 * Incident Summary — the problem this report is about. Named
 * `ReportIncidentSummary` because `IncidentSummary` is already the
 * Dashboard's active-incident component (components/dashboard), which this
 * has nothing to do with.
 */
export function ReportIncidentSummary({ incidentId, incident }: ReportIncidentSummaryProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Incident Summary</h3>
        <ReportSeverityBadge severity={incident.severity} />
      </div>

      <p className="mt-3 text-sm font-medium text-foreground">{incident.title}</p>

      <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Incident ID</dt>
          <dd className="mt-0.5">
            <Link
              href={`/incidents/${incidentId}`}
              className="font-mono text-sm font-medium text-accent hover:underline"
            >
              {incidentId}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Status</dt>
          <dd className="mt-0.5 text-foreground">{STATUS_LABEL[incident.status]}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Affected System</dt>
          <dd className="mt-0.5 text-foreground">{incident.affectedSystem}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Detected</dt>
          <dd className="mt-0.5 text-foreground">{formatReportTimestamp(incident.detectedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Closed</dt>
          <dd className="mt-0.5 text-foreground">
            {incident.closedAt ? formatReportTimestamp(incident.closedAt) : "Still open"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Business Impact</dt>
          <dd className="mt-0.5 text-foreground">{incident.businessImpact}</dd>
        </div>
      </dl>
    </Card>
  );
}
