"use client";

import { useMemo, useState } from "react";

import { ActionFilters } from "@/components/actions/ActionFilters";
import { ActionSummaryCard } from "@/components/actions/ActionSummaryCard";
import { ActionTable } from "@/components/actions/ActionTable";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  ACTIONS,
  type Action,
  type ActionStatus,
  type VerificationStatus,
} from "@/lib/mock/actions";
import type { RiskLevel } from "@/lib/mock/approvals";
import type { AffectedSystem } from "@/lib/mock/incidents";

function matchesSearch(action: Action, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [
    action.id,
    action.title,
    action.incidentId,
    action.investigationId ?? "",
    action.approvalId ?? "",
    action.affectedSystem,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

/**
 * The Actions page — the operational actions the system has recommended,
 * had approved, executed, or verified. All data is static
 * (lib/mock/actions.ts, Phase 7). Search and filtering run entirely
 * client-side: there is no backend call anywhere on this page, and nothing
 * here executes a real operation.
 */
export default function ActionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ActionStatus | "all">("all");
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "all">("all");
  const [affectedSystem, setAffectedSystem] = useState<AffectedSystem | "all">("all");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | "all">("all");

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    riskLevel !== "all" ||
    affectedSystem !== "all" ||
    verificationStatus !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setRiskLevel("all");
    setAffectedSystem("all");
    setVerificationStatus("all");
  };

  // Summary cards always reflect the full action set, independent of the
  // list filters below — the same reasoning as every previous phase: an
  // overview that shifted with the filters could contradict the dataset.
  const summary = useMemo(
    () => ({
      pending: ACTIONS.filter((a) => a.status === "pending_approval").length,
      approved: ACTIONS.filter((a) => a.status === "approved").length,
      executing: ACTIONS.filter((a) => a.status === "executing").length,
      completed: ACTIONS.filter((a) => a.status === "completed").length,
      failed: ACTIONS.filter((a) => a.status === "failed").length,
    }),
    [],
  );

  const filteredActions = useMemo(() => {
    return ACTIONS.filter(
      (action) =>
        matchesSearch(action, search) &&
        (status === "all" || action.status === status) &&
        (riskLevel === "all" || action.riskLevel === riskLevel) &&
        (affectedSystem === "all" || action.affectedSystem === affectedSystem) &&
        (verificationStatus === "all" || action.verification.status === verificationStatus),
    );
  }, [search, status, riskLevel, affectedSystem, verificationStatus]);

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Actions</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Operational actions recommended, approved, executed, or verified by the operations
            system — the step that follows an approval and closes out an incident.
          </p>
        </div>
        <Badge variant="accent">Operational action history</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <ActionSummaryCard label="Pending Actions" value={summary.pending} tone="warning" />
        <ActionSummaryCard label="Approved" value={summary.approved} tone="accent" />
        <ActionSummaryCard label="Executing" value={summary.executing} tone="info" />
        <ActionSummaryCard label="Completed" value={summary.completed} tone="success" />
        <ActionSummaryCard label="Failed" value={summary.failed} tone="danger" />
      </div>

      <Card className="mt-6 p-4 sm:p-5">
        <ActionFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          riskLevel={riskLevel}
          onRiskLevelChange={setRiskLevel}
          affectedSystem={affectedSystem}
          onAffectedSystemChange={setAffectedSystem}
          verificationStatus={verificationStatus}
          onVerificationStatusChange={setVerificationStatus}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </Card>

      <div className="mt-4">
        {filteredActions.length > 0 ? (
          <ActionTable actions={filteredActions} />
        ) : (
          <Card>
            <EmptyState
              title="No actions match your current filters."
              description="Try a different search term, or clear your filters to see every action."
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
        Showing {filteredActions.length} of {ACTIONS.length} actions. Static demo data — nothing on
        this page has been executed.
      </p>
    </PageContainer>
  );
}
