import type { ChangeEvent } from "react";

import { AFFECTED_SYSTEMS, type AffectedSystem } from "@/lib/mock/incidents";
import type { ApprovalStatus, RiskLevel } from "@/lib/mock/approvals";

export const STATUS_FILTER_OPTIONS: { value: ApprovalStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
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

const selectClassName =
  "h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

interface ApprovalFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ApprovalStatus | "all";
  onStatusChange: (value: ApprovalStatus | "all") => void;
  riskLevel: RiskLevel | "all";
  onRiskLevelChange: (value: RiskLevel | "all") => void;
  affectedSystem: AffectedSystem | "all";
  onAffectedSystemChange: (value: AffectedSystem | "all") => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

/**
 * Search + status/risk/affected-system filters (all combinable) for the
 * Approvals queue. Purely presentational — the Approvals page owns the
 * actual filtering state and logic, matching the Investigations pattern.
 */
export function ApprovalFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  riskLevel,
  onRiskLevelChange,
  affectedSystem,
  onAffectedSystemChange,
  onClear,
  hasActiveFilters,
}: ApprovalFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
        <input
          type="text"
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="Search by approval ID, incident ID, title, action, or system…"
          className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as ApprovalStatus | "all")}
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
