"use client";

import { useMemo, useState } from "react";

import { InvestigationFilters } from "@/components/investigations/InvestigationFilters";
import { InvestigationSummaryCard } from "@/components/investigations/InvestigationSummaryCard";
import { InvestigationTable } from "@/components/investigations/InvestigationTable";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  INVESTIGATIONS,
  type Investigation,
  type InvestigationStage,
  type InvestigationStatus,
} from "@/lib/mock/investigations";

function matchesSearch(investigation: Investigation, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [investigation.id, investigation.incidentId, investigation.title]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

/**
 * The Investigations page — the detailed list of every investigation the
 * Command Center has run or is running, each tracing back to an incident
 * from Phase 4. All data is static (lib/mock/investigations.ts, Phase 5).
 * Search and filtering run entirely client-side — there is no backend call.
 */
export default function InvestigationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvestigationStatus | "all">("all");
  const [stage, setStage] = useState<InvestigationStage | "all">("all");

  const hasActiveFilters = search.trim() !== "" || status !== "all" || stage !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setStage("all");
  };

  // Summary cards always reflect the full investigation set, independent of
  // the list filters below.
  const summary = useMemo(() => {
    return {
      total: INVESTIGATIONS.length,
      running: INVESTIGATIONS.filter((i) => i.status === "running").length,
      completed: INVESTIGATIONS.filter((i) => i.status === "completed").length,
      awaitingApproval: INVESTIGATIONS.filter((i) => i.status === "awaiting_approval").length,
    };
  }, []);

  const filteredInvestigations = useMemo(() => {
    return INVESTIGATIONS.filter(
      (investigation) =>
        matchesSearch(investigation, search) &&
        (status === "all" || investigation.status === status) &&
        (stage === "all" || investigation.stage === stage),
    );
  }, [search, status, stage]);

  return (
    <PageContainer>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Investigations</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          How the AI works each incident — evidence collected, findings drawn, and the root
          cause and recommendation reached, for every investigation the Command Center has run.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InvestigationSummaryCard label="Total Investigations" value={summary.total} />
        <InvestigationSummaryCard label="Running" value={summary.running} tone="info" />
        <InvestigationSummaryCard label="Completed" value={summary.completed} tone="success" />
        <InvestigationSummaryCard
          label="Awaiting Approval"
          value={summary.awaitingApproval}
          tone="warning"
        />
      </div>

      <Card className="mt-6 p-4 sm:p-5">
        <InvestigationFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          stage={stage}
          onStageChange={setStage}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </Card>

      <div className="mt-4">
        {filteredInvestigations.length > 0 ? (
          <InvestigationTable investigations={filteredInvestigations} />
        ) : (
          <Card>
            <EmptyState
              title="No investigations match your current filters."
              description="Try a different search term, or clear your filters to see every investigation."
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
        Showing {filteredInvestigations.length} of {INVESTIGATIONS.length} investigations.
      </p>
    </PageContainer>
  );
}
