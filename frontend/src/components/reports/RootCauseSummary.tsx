import { Card } from "@/components/ui/Card";
import type { ReportRootCause } from "@/lib/mock/reports";

import { ReportConfidenceBadge } from "./ReportVerificationBadge";

interface RootCauseSummaryProps {
  rootCause?: ReportRootCause;
}

/**
 * Likely Root Cause — the report's conclusion, given a visually distinct
 * tinted panel (the same ring treatment Phase 5's RootCausePanel uses,
 * rather than a border-colour override that would fight the Card's own
 * border). Confidence is shown honestly, and a report whose investigation
 * never reached a conclusion says so instead of inventing one.
 */
export function RootCauseSummary({ rootCause }: RootCauseSummaryProps) {
  if (!rootCause) {
    return (
      <Card className="bg-background p-4 ring-1 ring-border sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">Likely Root Cause</h3>
        <p className="mt-2 text-sm text-muted">
          No root cause was established for this incident. The investigation ended inconclusively,
          and this report records that rather than offering a conclusion it cannot support.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-accent-muted p-4 ring-1 ring-accent/20 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Likely Root Cause</h3>
        <ReportConfidenceBadge confidence={rootCause.confidence} />
      </div>

      <p className="mt-3 text-lg font-semibold text-foreground">{rootCause.summary}</p>
      <p className="mt-2 text-sm text-foreground">{rootCause.explanation}</p>

      <div className="mt-4 border-t border-accent/20 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Supporting Evidence</p>
        <ul className="mt-1.5 flex flex-wrap gap-2">
          {rootCause.supportingEvidence.map((item) => (
            <li
              key={item}
              className="rounded-full border border-accent/20 bg-surface px-2.5 py-0.5 text-xs font-medium text-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
