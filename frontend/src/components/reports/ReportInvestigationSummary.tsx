import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatReportTimestamp, type ReportInvestigationSummary as InvestigationSummaryContent } from "@/lib/mock/reports";

interface ReportInvestigationSummaryProps {
  investigation?: InvestigationSummaryContent;
}

const STATUS_LABEL: Record<InvestigationSummaryContent["status"], string> = {
  running: "Running",
  completed: "Completed",
  awaiting_approval: "Awaiting Approval",
  failed: "Failed",
  paused: "Paused",
};

const STAGE_LABEL: Record<InvestigationSummaryContent["stage"], string> = {
  initializing: "Initializing",
  collecting_evidence: "Collecting Evidence",
  analyzing: "Analyzing",
  root_cause_identified: "Root Cause Identified",
  recommendation_ready: "Recommendation Ready",
  awaiting_approval: "Awaiting Approval",
  completed: "Completed",
};

/**
 * Investigation Summary — status, stage, duration, and the key findings,
 * with a link into the full investigation workspace (Phase 5) for anyone
 * who wants the step-by-step record. Concise findings only: no hidden
 * model chain-of-thought is shown here, per the brief.
 */
export function ReportInvestigationSummary({ investigation }: ReportInvestigationSummaryProps) {
  if (!investigation) {
    return (
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">Investigation Summary</h3>
        <EmptyState
          title="No investigation record"
          description="This incident was handled without a formal investigation being opened, so there is no investigation to summarise."
        />
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Investigation Summary</h3>
        <Badge variant="neutral">Simulated</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Investigation ID</dt>
          <dd className="mt-0.5">
            <Link
              href={`/investigations/${investigation.id}`}
              className="font-mono text-sm font-medium text-accent hover:underline"
            >
              {investigation.id}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Status</dt>
          <dd className="mt-0.5 text-foreground">{STATUS_LABEL[investigation.status]}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Stage</dt>
          <dd className="mt-0.5 text-foreground">{STAGE_LABEL[investigation.stage]}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Started</dt>
          <dd className="mt-0.5 text-foreground">{formatReportTimestamp(investigation.startedAt)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Duration</dt>
          <dd className="mt-0.5 text-foreground">{investigation.duration}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Key Findings</p>
        <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-foreground">
          {investigation.keyFindings.map((finding) => (
            <li key={finding}>{finding}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
