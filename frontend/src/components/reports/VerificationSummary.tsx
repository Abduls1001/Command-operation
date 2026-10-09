import { Card } from "@/components/ui/Card";
import { formatReportTimestamp, type ReportVerification } from "@/lib/mock/reports";

import { ReportVerificationBadge } from "./ReportVerificationBadge";

interface VerificationSummaryProps {
  verification: ReportVerification;
}

/**
 * Verification & Outcome — the report's closing section, and deliberately
 * the most prominent one: whether the action achieved what it was supposed
 * to, and how the incident finally ended. A failed verification is shown as
 * plainly as a passed one; in the finished system it is what reopens an
 * incident rather than closing it.
 */
export function VerificationSummary({ verification }: VerificationSummaryProps) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">Verification &amp; Outcome</h3>
        <ReportVerificationBadge status={verification.status} />
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Expected Result</dt>
          <dd className="mt-0.5 text-foreground">{verification.expectedResult}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Observed Result</dt>
          <dd className="mt-0.5 text-foreground">
            {verification.observedResult ?? (
              <span className="text-muted">
                Not observed — verification has not run for this incident.
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Verification Time</dt>
          <dd className="mt-0.5 text-foreground">{formatReportTimestamp(verification.verifiedAt)}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-md border border-border bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Final Outcome</p>
        <p className="mt-1 text-sm font-medium text-foreground">{verification.finalOutcome}</p>
      </div>

      <p className="mt-4 text-xs text-muted">
        Simulated verification data. Nothing in this application has been executed or measured.
      </p>
    </Card>
  );
}
