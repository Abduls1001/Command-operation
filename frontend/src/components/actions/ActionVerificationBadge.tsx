import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { VerificationStatus } from "@/lib/mock/actions";

const VARIANT: Record<VerificationStatus, BadgeVariant> = {
  not_started: "neutral",
  pending: "warning",
  passed: "success",
  failed: "danger",
};

const LABEL: Record<VerificationStatus, string> = {
  not_started: "Not Started",
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
};

interface ActionVerificationBadgeProps {
  status: VerificationStatus;
}

/** Verification-outcome badge. Kept visually distinct from the action's own
 * status badge, because "executed" and "confirmed working" are different
 * claims — an action can complete and still fail verification. */
export function ActionVerificationBadge({ status }: ActionVerificationBadgeProps) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
