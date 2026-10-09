import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { VerificationStatus } from "@/lib/mock/actions";
import type { ConfidenceLevel } from "@/lib/mock/investigations";

const VERIFICATION_VARIANT: Record<VerificationStatus, BadgeVariant> = {
  not_started: "neutral",
  pending: "warning",
  passed: "success",
  failed: "danger",
};

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  not_started: "Not Started",
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
};

const CONFIDENCE_VARIANT: Record<ConfidenceLevel, BadgeVariant> = {
  high: "success",
  medium: "warning",
  low: "danger",
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

/** Verification-outcome badge, reusing Phase 7's `VerificationStatus`
 * vocabulary (type-only import). */
export function ReportVerificationBadge({ status }: { status: VerificationStatus }) {
  return <Badge variant={VERIFICATION_VARIANT[status]}>{VERIFICATION_LABEL[status]}</Badge>;
}

/** Root-cause confidence, shown honestly — including when it is low. */
export function ReportConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  return <Badge variant={CONFIDENCE_VARIANT[confidence]}>{CONFIDENCE_LABEL[confidence]}</Badge>;
}

