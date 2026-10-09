import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { ReportOutcome, ReportStatus } from "@/lib/mock/reports";

const STATUS_VARIANT: Record<ReportStatus, BadgeVariant> = {
  draft: "warning",
  under_review: "info",
  completed: "success",
  archived: "neutral",
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  draft: "Draft",
  under_review: "Under Review",
  completed: "Completed",
  archived: "Archived",
};

const OUTCOME_VARIANT: Record<ReportOutcome, BadgeVariant> = {
  resolved: "success",
  resolved_without_action: "success",
  unresolved: "danger",
  in_progress: "warning",
};

const OUTCOME_LABEL: Record<ReportOutcome, string> = {
  resolved: "Resolved",
  resolved_without_action: "Resolved without action",
  unresolved: "Unresolved",
  in_progress: "In progress",
};

/** Report status badge, scoped to the Reports domain's own type — kept
 * separate from the other domains' badges, per existing convention. */
export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

/** How the incident itself ended — a different claim from the report's own
 * workflow status, so it gets its own badge rather than sharing one. */
export function ReportOutcomeBadge({ outcome }: { outcome: ReportOutcome }) {
  return <Badge variant={OUTCOME_VARIANT[outcome]}>{OUTCOME_LABEL[outcome]}</Badge>;
}

