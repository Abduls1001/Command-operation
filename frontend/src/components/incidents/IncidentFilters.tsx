import type { ChangeEvent } from "react";

import { AFFECTED_SYSTEMS, type IncidentSeverity, type IncidentStatus } from "@/lib/mock/incidents";

export type IncidentSortOption = "newest" | "oldest" | "severity";

export const STATUS_FILTER_OPTIONS: { value: IncidentStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "awaiting_approval", label: "Awaiting Approval" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const SEVERITY_FILTER_OPTIONS: { value: IncidentSeverity | "all"; label: string }[] = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SORT_OPTIONS: { value: IncidentSortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "severity", label: "Severity (highest first)" },
];

const selectClassName =
  "h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

interface IncidentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: IncidentStatus | "all";
  onStatusChange: (value: IncidentStatus | "all") => void;
  severity: IncidentSeverity | "all";
  onSeverityChange: (value: IncidentSeverity | "all") => void;
  affectedSystem: string | "all";
  onAffectedSystemChange: (value: string | "all") => void;
  sort: IncidentSortOption;
  onSortChange: (value: IncidentSortOption) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

/**
 * All Incidents-list controls in one bar: search, three filters (status,
 * severity, affected system — combinable), sort, and a clear-filters
 * action. Purely presentational — the Incidents page owns the actual
 * filtering/sorting state and logic.
 */
export function IncidentFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  severity,
  onSeverityChange,
  affectedSystem,
  onAffectedSystemChange,
  sort,
  onSortChange,
  onClear,
  hasActiveFilters,
}: IncidentFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
        <input
          type="text"
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="Search incidents by ID, title, description, or system…"
          className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as IncidentStatus | "all")}
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
        value={affectedSystem}
        onChange={(event) => onAffectedSystemChange(event.target.value)}
        className={selectClassName}
        aria-label="Filter by affected system"
      >
        <option value="all">All systems</option>
        {AFFECTED_SYSTEMS.map((system) => (
          <option key={system} value={system}>
            {system}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as IncidentSortOption)}
        className={selectClassName}
        aria-label="Sort incidents"
      >
        {SORT_OPTIONS.map((option) => (
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
