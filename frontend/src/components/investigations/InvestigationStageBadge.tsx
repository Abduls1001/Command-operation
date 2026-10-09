import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { ConfidenceLevel, InvestigationStage } from "@/lib/mock/investigations";

const STAGE_LABEL: Record<InvestigationStage, string> = {
  initializing: "Initializing",
  collecting_evidence: "Collecting Evidence",
  analyzing: "Analyzing",
  root_cause_identified: "Root Cause Identified",
  recommendation_ready: "Recommendation Ready",
  awaiting_approval: "Awaiting Approval",
  completed: "Completed",
};

interface InvestigationStageBadgeProps {
  stage: InvestigationStage;
}

/** The current-stage badge used in the list and the detail header. Neutral
 * styling throughout — stage is informational, not a severity/status
 * signal, so it doesn't compete visually with InvestigationStatusBadge. */
export function InvestigationStageBadge({ stage }: InvestigationStageBadgeProps) {
  return <Badge variant="neutral">{STAGE_LABEL[stage]}</Badge>;
}

const CONFIDENCE_VARIANT: Record<ConfidenceLevel, BadgeVariant> = {
  low: "neutral",
  medium: "info",
  high: "success",
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  low: "Low Confidence",
  medium: "Medium Confidence",
  high: "High Confidence",
};

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  return <Badge variant={CONFIDENCE_VARIANT[confidence]}>{CONFIDENCE_LABEL[confidence]}</Badge>;
}
