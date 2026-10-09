import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Recommendation } from "@/lib/mock/investigations";

interface RecommendationPanelProps {
  recommendation?: Recommendation;
}

/**
 * The proposed action, its reasoning, and its expected effect. This is a
 * proposal only — nothing here executes anything. Approval and execution
 * belong to Phase 6 (Approvals) and Phase 7 (Actions); this panel exists
 * to show what would be sent there.
 */
export function RecommendationPanel({ recommendation }: RecommendationPanelProps) {
  if (!recommendation) {
    return (
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">Recommendation</h3>
        <EmptyState
          title="No recommendation yet"
          description="This investigation hasn't reached the recommendation stage yet."
        />
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Recommended Action
        </p>
        <Badge variant={recommendation.approvalRequired ? "warning" : "neutral"}>
          {recommendation.approvalRequired ? "Approval Required" : "No Approval Required"}
        </Badge>
      </div>
      <p className="mt-1.5 text-lg font-semibold text-foreground">{recommendation.action}</p>

      <dl className="mt-3 space-y-3 border-t border-border pt-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Reason</dt>
          <dd className="mt-0.5 text-foreground">{recommendation.reason}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Expected Effect
          </dt>
          <dd className="mt-0.5 text-foreground">{recommendation.expectedEffect}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted">
        This is a proposed action only. Nothing is executed here — approval and execution are
        handled elsewhere.
      </p>
    </Card>
  );
}
