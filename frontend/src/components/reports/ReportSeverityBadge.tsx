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

/** Severity badge for a report. Uses Phase 4's `IncidentSeverity`
 * vocabulary (type-only import) so a severity means the same thing on the
 * report as on the incident it describes. */
export function ReportSeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return <Badge variant={VARIANT[severity]}>{LABEL[severity]}</Badge>;
}
