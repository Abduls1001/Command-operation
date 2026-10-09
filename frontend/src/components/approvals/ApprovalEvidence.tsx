import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { EvidenceMetric } from "@/lib/mock/approvals";

interface ApprovalEvidenceProps {
  evidenceSummary: EvidenceMetric[];
}

/**
 * A short list of simulated metrics backing the request — e.g. "Payment
 * failure rate: +38%". Clearly labeled as demo/static information, per the
 * brief's explicit instruction, and kept separate from the qualitative
 * Recommendation Context above it.
 */
export function ApprovalEvidence({ evidenceSummary }: ApprovalEvidenceProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Evidence Summary</h3>
        <Badge variant="neutral">Demo / static figures</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {evidenceSummary.map((metric) => (
          <div key={metric.label} className="rounded-md border border-border bg-background p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">{metric.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
