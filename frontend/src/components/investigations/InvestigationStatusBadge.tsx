import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { InvestigationStatus } from "@/lib/mock/investigations";

const VARIANT: Record<InvestigationStatus, BadgeVariant> = {
  running: "info",
  completed: "success",
  awaiting_approval: "warning",
  failed: "danger",
  paused: "neutral",
};

const LABEL: Record<InvestigationStatus, string> = {
  running: "Running",
  completed: "Completed",
  awaiting_approval: "Awaiting Approval",
  failed: "Failed",
  paused: "Paused",
};

interface InvestigationStatusBadgeProps {
  status: InvestigationStatus;
}

export function InvestigationStatusBadge({ status }: InvestigationStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
