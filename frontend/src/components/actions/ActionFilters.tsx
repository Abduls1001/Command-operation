import type { ChangeEvent } from "react";

import type { ActionStatus, VerificationStatus } from "@/lib/mock/actions";
import { AFFECTED_SYSTEMS, type AffectedSystem } from "@/lib/mock/incidents";
import type { RiskLevel } from "@/lib/mock/approvals";

export const STATUS_FILTER_OPTIONS: { value: ActionStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "executing", label: "Executing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export const RISK_FILTER_OPTIONS: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "All risk levels" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const AFFECTED_SYSTEM_FILTER_OPTIONS: { value: AffectedSystem | "all"; label: string }[] = [
  { value: "all", label: "All systems" },
  ...AFFECTED_SYSTEMS.map((system) => ({ value: system, label: system })),
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

interface ActionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ActionStatus | "all";
  onStatusChange: (value: ActionStatus | "all") => void;
  riskLevel: RiskLevel | "all";
  onRiskLevelChange: (value: RiskLevel | "all") => void;
  affectedSystem: AffectedSystem | "all";
  onAffectedSystemChange: (value: AffectedSystem | "all") => void;
  verificationStatus: VerificationStatus | "all";
  onVerificationStatusChange: (value: VerificationStatus | "all") => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

/**
 * Search plus status / risk / affected-system / verification-status
 * filters (all combinable) for the Actions list. Purely presentational —
 * the Actions page owns the state and the filtering, matching the
 * Incidents, Investigations, and Approvals pattern.
 */
export function ActionFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  riskLevel,
  onRiskLevelChange,
  affectedSystem,
  onAffectedSystemChange,
  verificationStatus,
  onVerificationStatusChange,
  onClear,
  hasActiveFilters,
}: ActionFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
        <input
          type="text"
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="Search by action ID, title, incident ID, investigation ID, or system…"
          className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as ActionStatus | "all")}
        className={selectClassName}
        aria-label="Filter by status"
      >
        {STATUS_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={riskLevel}
        onChange={(event) => onRiskLevelChange(event.target.value as RiskLevel | "all")}
        className={selectClassName}
        aria-label="Filter by risk level"
      >
        {RISK_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={affectedSystem}
        onChange={(event) => onAffectedSystemChange(event.target.value as AffectedSystem | "all")}
        className={selectClassName}
        aria-label="Filter by affected system"
      >
        {AFFECTED_SYSTEM_FILTER_OPTIONS.map((option) => (
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
