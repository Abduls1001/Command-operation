import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { RiskLevel } from "@/lib/mock/approvals";
import type { ReportRecommendation } from "@/lib/mock/reports";

interface RecommendationSummaryProps {
  recommendation?: ReportRecommendation;
}

const RISK_VARIANT: Record<RiskLevel, "danger" | "warning" | "info" | "neutral"> = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  critical: "Critical Risk",
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
};

/** Recommendation — what was proposed, why, what it was expected to
 * achieve, and at what risk. A report for an incident that never reached a
 * recommendation says so. */
export function RecommendationSummary({ recommendation }: RecommendationSummaryProps) {
  if (!recommendation) {
    return (
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">Recommendation</h3>
        <p className="mt-2 text-sm text-muted">
          No action was recommended for this incident — it resolved without one.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Recommendation</h3>
        <Badge variant={RISK_VARIANT[recommendation.riskLevel]}>
          {RISK_LABEL[recommendation.riskLevel]}
        </Badge>
      </div>

      <p className="mt-3 text-base font-semibold text-foreground">{recommendation.action}</p>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Why It Was Recommended</dt>
          <dd className="mt-0.5 text-foreground">{recommendation.reason}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Expected Outcome</dt>
          <dd className="mt-0.5 text-foreground">{recommendation.expectedOutcome}</dd>
        </div>
      </dl>
    </Card>
  );
}
