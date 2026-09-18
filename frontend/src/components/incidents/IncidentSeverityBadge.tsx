import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { IncidentSeverity } from "@/lib/mock/incidents";

const VARIANT: Record<IncidentSeverity, BadgeVariant> = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
};

const LABEL: Record<IncidentSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface IncidentSeverityBadgeProps {
  severity: IncidentSeverity;
}

export function IncidentSeverityBadge({ severity }: IncidentSeverityBadgeProps) {
  return <Badge variant={VARIANT[severity]}>{LABEL[severity]}</Badge>;
}
