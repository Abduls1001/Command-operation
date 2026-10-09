import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ReportEvidenceItem } from "@/lib/mock/reports";

interface ReportEvidenceSummaryProps {
  evidence: ReportEvidenceItem[];
}

/**
 * Evidence Summary — the figures the conclusion rests on, each attributed
 * to the system or category it came from. Every value is a hand-written
 * demo figure, labeled as such: no real system produced any of them.
 */
export function ReportEvidenceSummary({ evidence }: ReportEvidenceSummaryProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Evidence Summary</h3>
        <Badge variant="neutral">Demo / static figures</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {evidence.map((item) => (
          <div key={item.label} className="rounded-md border border-border bg-background p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">{item.value}</dd>
            <p className="mt-1 text-xs text-muted">Source: {item.source}</p>
          </div>
        ))}
      </dl>
    </Card>
  );
}
