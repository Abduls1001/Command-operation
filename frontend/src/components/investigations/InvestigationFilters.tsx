import type { ChangeEvent } from "react";

import type { InvestigationStage, InvestigationStatus } from "@/lib/mock/investigations";

export const STATUS_FILTER_OPTIONS: { value: InvestigationStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "awaiting_approval", label: "Awaiting Approval" },
  { value: "failed", label: "Failed" },
  { value: "paused", label: "Paused" },
];

export const STAGE_FILTER_OPTIONS: { value: InvestigationStage | "all"; label: string }[] = [
  { value: "all", label: "All stages" },
  { value: "initializing", label: "Initializing" },
  { value: "collecting_evidence", label: "Collecting Evidence" },
  { value: "analyzing", label: "Analyzing" },
  { value: "root_cause_identified", label: "Root Cause Identified" },
  { value: "recommendation_ready", label: "Recommendation Ready" },
  { value: "awaiting_approval", label: "Awaiting Approval" },
  { value: "completed", label: "Completed" },
];

const selectClassName =
  "h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

interface InvestigationFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: InvestigationStatus | "all";
  onStatusChange: (value: InvestigationStatus | "all") => void;
  stage: InvestigationStage | "all";
  onStageChange: (value: InvestigationStage | "all") => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

/**
 * Search + status/stage filters (combinable) for the Investigations list.
 * Purely presentational — the Investigations page owns the actual
 * filtering state and logic.
 */
export function InvestigationFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  stage,
  onStageChange,
  onClear,
  hasActiveFilters,
}: InvestigationFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
        <input
          type="text"
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="Search by investigation ID, incident ID, or title…"
          className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as InvestigationStatus | "all")}
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
        value={stage}
        onChange={(event) => onStageChange(event.target.value as InvestigationStage | "all")}
        className={selectClassName}
        aria-label="Filter by investigation stage"
      >
        {STAGE_FILTER_OPTIONS.map((option) => (
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
