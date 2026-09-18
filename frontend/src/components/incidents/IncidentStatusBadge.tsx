import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { IncidentStatus } from "@/lib/mock/incidents";

const VARIANT: Record<IncidentStatus, BadgeVariant> = {
  open: "danger",
  investigating: "info",
  awaiting_approval: "warning",
  resolved: "success",
  closed: "neutral",
};

const LABEL: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  awaiting_approval: "Awaiting Approval",
  resolved: "Resolved",
  closed: "Closed",
};

interface IncidentStatusBadgeProps {
  status: IncidentStatus;
}

export function IncidentStatusBadge({ status }: IncidentStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
