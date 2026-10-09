import type { ChangeEvent } from "react";

import type { VerificationStatus } from "@/lib/mock/actions";
import type { IncidentSeverity } from "@/lib/mock/incidents";
import type { ReportOutcome, ReportStatus } from "@/lib/mock/reports";

export const STATUS_FILTER_OPTIONS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "Under Review" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export const SEVERITY_FILTER_OPTIONS: { value: IncidentSeverity | "all"; label: string }[] = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const OUTCOME_FILTER_OPTIONS: { value: ReportOutcome | "all"; label: string }[] = [
  { value: "all", label: "All outcomes" },
  { value: "resolved", label: "Outcome: Resolved" },
  { value: "resolved_without_action", label: "Outcome: Resolved without action" },
  { value: "unresolved", label: "Outcome: Unresolved" },
  { value: "in_progress", label: "Outcome: In progress" },
];

export const VERIFICATION_FILTER_OPTIONS: { value: VerificationStatus | "all"; label: string }[] = [
  { value: "all", label: "All verification states" },
  { value: "not_started", label: "Verification: Not Started" },
  { value: "pending", label: "Verification: Pending" },
  { value: "passed", label: "Verification: Passed" },
  { value: "failed", label: "Verification: Failed" },
];

const selectClassName =
  "h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

interface ReportFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ReportStatus | "all";
  onStatusChange: (value: ReportStatus | "all") => void;
  severity: IncidentSeverity | "all";
  onSeverityChange: (value: IncidentSeverity | "all") => void;
  outcome: ReportOutcome | "all";
  onOutcomeChange: (value: ReportOutcome | "all") => void;
  verificationStatus: VerificationStatus | "all";
  onVerificationStatusChange: (value: VerificationStatus | "all") => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

/**
 * Search plus status / severity / outcome / verification-status filters
 * (all combinable) for the Reports list. Purely presentational — the
 * Reports page owns the state and the filtering, matching the pattern
 * Incidents, Investigations, Approvals, and Actions all follow.
 */
export function ReportFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  severity,
  onSeverityChange,
  outcome,
  onOutcomeChange,
  verificationStatus,
  onVerificationStatusChange,
  onClear,
  hasActiveFilters,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
        <input
          type="text"
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="Search by report ID, incident ID, investigation ID, title, root cause, or outcome…"
          className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as ReportStatus | "all")}
        className={selectClassName}
        aria-label="Filter by report status"
      >
        {STATUS_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={severity}
        onChange={(event) => onSeverityChange(event.target.value as IncidentSeverity | "all")}
        className={selectClassName}
        aria-label="Filter by severity"
      >
        {SEVERITY_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={outcome}
        onChange={(event) => onOutcomeChange(event.target.value as ReportOutcome | "all")}
        className={selectClassName}
        aria-label="Filter by outcome"
      >
        {OUTCOME_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={verificationStatus}
        onChange={(event) =>
          onVerificationStatusChange(event.target.value as VerificationStatus | "all")
        }
        className={selectClassName}
        aria-label="Filter by verification status"
      >
        {VERIFICATION_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="h-9 rounded-md border border-border px-3 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
