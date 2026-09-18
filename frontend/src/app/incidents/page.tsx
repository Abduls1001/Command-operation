"use client";

import { useMemo, useState } from "react";

import type { IncidentSortOption } from "@/components/incidents/IncidentFilters";
import { IncidentFilters } from "@/components/incidents/IncidentFilters";
import { IncidentSummaryCard } from "@/components/incidents/IncidentSummaryCard";
import { IncidentTable } from "@/components/incidents/IncidentTable";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/PageContainer";
import { INCIDENTS, type Incident, type IncidentSeverity, type IncidentStatus } from "@/lib/mock/incidents";

const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

function matchesSearch(incident: Incident, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [
    incident.id,
    incident.title,
    incident.description,
    incident.affectedSystem,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

/**
 * The Incidents page — the detailed list and management view of every
 * operational incident, complementing the Dashboard's short "active
 * incidents" summary (Phase 3). All data is static (lib/mock/incidents.ts,
 * Phase 4). Search, filtering, and sorting run entirely client-side against
 * that static array — there is no backend call.
 */
export default function IncidentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<IncidentStatus | "all">("all");
  const [severity, setSeverity] = useState<IncidentSeverity | "all">("all");
  const [affectedSystem, setAffectedSystem] = useState<string | "all">("all");
  const [sort, setSort] = useState<IncidentSortOption>("newest");

  const hasActiveFilters =
    search.trim() !== "" || status !== "all" || severity !== "all" || affectedSystem !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setSeverity("all");
    setAffectedSystem("all");
  };

  // Summary cards always reflect the full incident set, independent of the
  // list filters below — an overview that shifts as you filter would be
  // more confusing than useful.
  const summary = useMemo(() => {
    return {
      total: INCIDENTS.length,
      active: INCIDENTS.filter((i) => i.status !== "resolved" && i.status !== "closed").length,
      critical: INCIDENTS.filter((i) => i.severity === "critical").length,
      investigating: INCIDENTS.filter((i) => i.status === "investigating").length,
      resolved: INCIDENTS.filter((i) => i.status === "resolved").length,
    };
  }, []);

  const filteredIncidents = useMemo(() => {
    const filtered = INCIDENTS.filter(
      (incident) =>
        matchesSearch(incident, search) &&
        (status === "all" || incident.status === status) &&
        (severity === "all" || incident.severity === severity) &&
        (affectedSystem === "all" || incident.affectedSystem === affectedSystem),
    );

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // severity: highest first, newest first within the same severity
      const rankDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted;
  }, [search, status, severity, affectedSystem, sort]);

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Incidents</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Operational incidents detected or reported across NovaCommerce systems — the
            organising record of every business problem the Command Center tracks.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 flex-shrink-0 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          title="UI only in this phase — incident creation is not yet implemented"
        >
          Create Incident
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <IncidentSummaryCard label="Total Incidents" value={summary.total} />
        <IncidentSummaryCard label="Active" value={summary.active} tone="warning" />
        <IncidentSummaryCard label="Critical" value={summary.critical} tone="danger" />
        <IncidentSummaryCard label="Investigating" value={summary.investigating} tone="info" />
        <IncidentSummaryCard label="Resolved" value={summary.resolved} tone="success" />
      </div>

      <Card className="mt-6 p-4 sm:p-5">
        <IncidentFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          severity={severity}
          onSeverityChange={setSeverity}
          affectedSystem={affectedSystem}
          onAffectedSystemChange={setAffectedSystem}
          sort={sort}
          onSortChange={setSort}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </Card>

      <div className="mt-4">
        {filteredIncidents.length > 0 ? (
          <IncidentTable incidents={filteredIncidents} />
        ) : (
          <Card>
            <EmptyState
              title="No incidents match your current filters."
              description="Try a different search term, or clear your filters to see every incident."
            />
            {hasActiveFilters && (
              <div className="flex justify-center pb-6">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
                >
                  Clear filters
                </button>
              </div>
            )}
          </Card>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">
        Showing {filteredIncidents.length} of {INCIDENTS.length} incidents.
      </p>
    </PageContainer>
  );
}
