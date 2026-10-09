import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { ActionStatus } from "@/lib/mock/actions";

const VARIANT: Record<ActionStatus, BadgeVariant> = {
  pending_approval: "warning",
  approved: "accent",
  executing: "info",
  completed: "success",
  failed: "danger",
  cancelled: "neutral",
};

const LABEL: Record<ActionStatus, string> = {
  pending_approval: "Pending Approval",
  approved: "Approved",
  executing: "Executing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

interface ActionStatusBadgeProps {
  status: ActionStatus;
}

/**
 * Status badge for the Actions list and detail header. Scoped to the
 * Actions domain's own type, kept separate from the Incidents,
 * Investigations, and Approvals badges on purpose — the same convention
 * every previous phase followed.
 */
export function ActionStatusBadge({ status }: ActionStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
