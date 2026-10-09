import Link from "next/link";

import { formatReportTimestamp, type Report } from "@/lib/mock/reports";

import { ReportOutcomeBadge, ReportStatusBadge } from "./ReportStatusBadge";
import { ReportSeverityBadge } from "./ReportSeverityBadge";

interface ReportHeaderProps {
  report: Report;
}

/**
 * The report's masthead: id, title, standfirst, status/severity/outcome
 * badges, links to the incident and investigation it covers, and the
 * created/updated dates. Mirrors the header shape used by the Approvals
 * and Actions detail pages so the product reads as one thing.
 */
export function ReportHeader({ report }: ReportHeaderProps) {
  return (
    <div>
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        &larr; Back to Reports
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-medium text-muted">{report.id}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {report.title}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm text-muted">{report.summary}</p>
          <p className="mt-2 text-sm text-muted">
            Related incident:{" "}
            <Link
              href={`/incidents/${report.incidentId}`}
              className="font-mono font-medium text-accent hover:underline"
            >
              {report.incidentId}
            </Link>
            {report.investigationId ? (
              <>
                {" "}
                &middot; Related investigation:{" "}
                <Link
                  href={`/investigations/${report.investigationId}`}
                  className="font-mono font-medium text-accent hover:underline"
                >
                  {report.investigationId}
                </Link>
              </>
            ) : (
              <> &middot; Related investigation: none recorded</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportStatusBadge status={report.status} />
          <ReportSeverityBadge severity={report.severity} />
          <ReportOutcomeBadge outcome={report.outcome} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:w-auto sm:auto-cols-max sm:grid-flow-col">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Created</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatReportTimestamp(report.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Last Updated</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatReportTimestamp(report.updatedAt)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
