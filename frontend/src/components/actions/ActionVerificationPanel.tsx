import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ActionVerification } from "@/lib/mock/actions";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

import { ActionVerificationBadge } from "./ActionVerificationBadge";

interface ActionVerificationPanelProps {
  verification: ActionVerification;
}

/**
 * Verification — did the action actually work? Expected result, observed
 * result, outcome, and when it was checked. Simulated UI data only.
 *
 * Kept deliberately separate from Execution Information above it, because
 * "the action ran" and "the problem is fixed" are different claims: an
 * action can complete cleanly and still fail verification (see ACT-4009),
 * which is exactly the case a later phase has to handle by reopening the
 * incident rather than closing it.
 *
 * Named `...Panel` because `ActionVerification` is already the type name in
 * lib/mock/actions.ts.
 */
export function ActionVerificationPanel({ verification }: ActionVerificationPanelProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Verification</h3>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Simulated</Badge>
          <ActionVerificationBadge status={verification.status} />
        </div>
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
                Not observed yet — verification hasn&apos;t run for this action.
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Verification Time
          </dt>
          <dd className="mt-0.5 text-foreground">
            {verification.verifiedAt ? formatRelativeToDemoNow(verification.verifiedAt) : "\u2014"}
          </dd>
        </div>
      </dl>

      {verification.status === "failed" && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Verification did not confirm the expected result. In the finished system this is the case
          that reopens the incident rather than closing it.
        </p>
      )}
    </Card>
  );
}
