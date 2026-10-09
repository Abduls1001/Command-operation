import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatReportTimestamp, type ReportApprovalSummary } from "@/lib/mock/reports";

interface ApprovalSummaryProps {
  approval?: ReportApprovalSummary;
}

/**
 * Approval Summary — the human decision, as the report records it. The
 * decision maker and comment are placeholder names in the demo dataset;
 * no authentication or authorization exists anywhere in this application.
 */
export function ApprovalSummary({ approval }: ApprovalSummaryProps) {
  if (!approval) {
    return (
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">Approval Summary</h3>
        <p className="mt-2 text-sm text-muted">
          No approval was requested for this incident — no action was proposed.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Approval Summary</h3>
        <Badge variant="neutral">{approval.status}</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Approval ID</dt>
          <dd className="mt-0.5">
            {approval.id ? (
              <Link
                href={`/approvals/${approval.id}`}
                className="font-mono text-sm font-medium text-accent hover:underline"
              >
                {approval.id}
              </Link>
            ) : (
              <span className="text-foreground">Not required — below the approval threshold</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Decision</dt>
          <dd className="mt-0.5 text-foreground">{approval.decision}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Decision Time</dt>
          <dd className="mt-0.5 text-foreground">{formatReportTimestamp(approval.decisionAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Decision Maker</dt>
          <dd className="mt-0.5 text-foreground">{approval.decisionBy}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Decision Comment</dt>
          <dd className="mt-0.5 text-foreground">{approval.comment}</dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
        Decision makers and comments are placeholder demo values. This application has no
        authentication or authorization.
      </p>
    </Card>
  );
}
