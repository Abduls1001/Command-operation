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

interface ApprovalRiskBadgeProps {
  riskLevel: RiskLevel;
}

/** Risk-level badge used in the queue table and the detail header. */
export function ApprovalRiskBadge({ riskLevel }: ApprovalRiskBadgeProps) {
  return <Badge variant={VARIANT[riskLevel]}>{LABEL[riskLevel]}</Badge>;
}
