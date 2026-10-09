import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Report } from "@/lib/mock/reports";

interface ReportActionsProps {
  report: Report;
}

const linkClassName =
  "rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background";

/**
 * Navigation out of the report, plus a placeholder for the export control
 * this page will eventually have.
 *
 * The navigation links are real — every destination already exists. "Export
 * / Print Report" deliberately is not: the brief rules out PDF generation
 * and real printing logic in this phase, so rather than wire up a control
 * that half-works, it is presented as a disabled placeholder with the same
 * "Coming in a later phase" badge the Phase 2 placeholders use. No backend
 * call, no document generation, no click handler.
 */
export function ReportActions({ report }: ReportActionsProps) {
  return (
    <Card className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">Report Actions</h3>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/incidents/${report.incidentId}`} className={linkClassName}>
          View Incident
        </Link>
        {report.investigationId && (
          <Link href={`/investigations/${report.investigationId}`} className={linkClassName}>
            View Investigation
          </Link>
        )}
        {report.approval?.id && (
          <Link href={`/approvals/${report.approval.id}`} className={linkClassName}>
            View Approval
          </Link>
        )}
        {report.action && (
          <Link href={`/actions/${report.action.id}`} className={linkClassName}>
            View Action
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-muted opacity-70"
        >
          Export / Print Report
        </button>
        <Badge variant="accent">Coming in a later phase</Badge>
        <span className="text-sm text-muted">
          Document export is not implemented — no PDF generation, no printing logic, no backend
          call.
        </span>
      </div>
    </Card>
  );
}
