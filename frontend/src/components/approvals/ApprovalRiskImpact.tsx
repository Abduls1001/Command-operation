import { Card } from "@/components/ui/Card";
import type { Approval } from "@/lib/mock/approvals";

import { ApprovalRiskBadge } from "./ApprovalRiskBadge";

interface ApprovalRiskImpactProps {
  approval: Approval;
}

/**
 * Risk & Impact — risk level, expected impact, potential downside, and
 * affected systems, grouped together so the downside of approving is just
 * as visible as the upside argued in Recommendation Context.
 */
export function ApprovalRiskImpact({ approval }: ApprovalRiskImpactProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Risk &amp; Impact</h3>
        <ApprovalRiskBadge riskLevel={approval.riskLevel} />
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Expected Impact</dt>
          <dd className="mt-0.5 text-foreground">{approval.observedImpact}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Potential Downside</dt>
          <dd className="mt-0.5 text-foreground">{approval.potentialDownside}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Affected System</dt>
          <dd className="mt-0.5 text-foreground">{approval.affectedSystem}</dd>
        </div>
      </dl>
    </Card>
  );
}
