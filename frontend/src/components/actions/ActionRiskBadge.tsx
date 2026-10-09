import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { RiskLevel } from "@/lib/mock/approvals";

const VARIANT: Record<RiskLevel, BadgeVariant> = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
};

const LABEL: Record<RiskLevel, string> = {
  critical: "Critical Risk",
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
};

interface ActionRiskBadgeProps {
  riskLevel: RiskLevel;
}

/** Risk-level badge for the Actions list and detail header. Uses the same
 * `RiskLevel` vocabulary Phase 6 defined, so a risk level means the same
 * thing on an action as on the approval it came from. */
export function ActionRiskBadge({ riskLevel }: ActionRiskBadgeProps) {
  return <Badge variant={VARIANT[riskLevel]}>{LABEL[riskLevel]}</Badge>;
}
