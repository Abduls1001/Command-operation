import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatReportTimestamp, type ReportActionSummary } from "@/lib/mock/reports";

interface ActionSummaryProps {
  action?: ReportActionSummary;
}

/**
 * Action Summary — what was actually done, when, and to which system. As
 * everywhere else in this application, nothing was executed: these are
 * hand-written demo values describing an action record, not a real run.
 */
export function ActionSummary({ action }: ActionSummaryProps) {
  if (!action) {
    return (
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">Action Summary</h3>
        <p className="mt-2 text-sm text-muted">
          No action was taken for this incident.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Action Summary</h3>
        <Badge variant="neutral">{action.status}</Badge>
      </div>

      <p className="mt-3 text-base font-semibold text-foreground">{action.performed}</p>

      <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Action ID</dt>
          <dd className="mt-0.5">
            <Link
              href={`/actions/${action.id}`}
              className="font-mono text-sm font-medium text-accent hover:underline"
            >
              {action.id}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Affected System</dt>
          <dd className="mt-0.5 text-foreground">{action.affectedSystem}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Started</dt>
          <dd className="mt-0.5 text-foreground">{formatReportTimestamp(action.startedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Completed</dt>
          <dd className="mt-0.5 text-foreground">{formatReportTimestamp(action.completedAt)}</dd>
        </div>
      </dl>
    </Card>
  );
}
