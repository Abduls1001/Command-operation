import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { ApprovalStatus } from "@/lib/mock/approvals";

const VARIANT: Record<ApprovalStatus, BadgeVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  expired: "neutral",
};

const LABEL: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
}

/** Status badge used in the queue table and the detail header — scoped to
 * the Approvals domain's own type, kept separate from the Incidents and
 * Investigations domains' status badges on purpose. */
export function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
