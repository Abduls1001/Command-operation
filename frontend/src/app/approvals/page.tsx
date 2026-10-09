"use client";

import { useMemo, useState } from "react";

import { ApprovalFilters } from "@/components/approvals/ApprovalFilters";
import { ApprovalSummaryCard } from "@/components/approvals/ApprovalSummaryCard";
import { ApprovalTable } from "@/components/approvals/ApprovalTable";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/PageContainer";
import { APPROVALS, type Approval, type ApprovalStatus, type RiskLevel } from "@/lib/mock/approvals";
import type { AffectedSystem } from "@/lib/mock/incidents";
import { DEMO_NOW } from "@/lib/mock/time";

function matchesSearch(approval: Approval, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [
    approval.id,
    approval.title,
    approval.incidentId,
    approval.requestedAction,
    approval.affectedSystem,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function isSameDemoDay(iso: string): boolean {
  const date = new Date(iso);
  return (
    date.getUTCFullYear() === DEMO_NOW.getUTCFullYear() &&
    date.getUTCMonth() === DEMO_NOW.getUTCMonth() &&
    date.getUTCDate() === DEMO_NOW.getUTCDate()
  );
}

/**
 * The Approvals page — the human-in-the-loop queue of operational actions
 * an investigation has recommended, waiting for a human decision. All data
 * is static (lib/mock/approvals.ts, Phase 6). Search and filtering run
 * entirely client-side — there is no backend call, and no approve/reject
 * click here changes this array (see ApprovalDecision).
 */
export default function ApprovalsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ApprovalStatus | "all">("all");
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "all">("all");
  const [affectedSystem, setAffectedSystem] = useState<AffectedSystem | "all">("all");

  const hasActiveFilters =
    search.trim() !== "" || status !== "all" || riskLevel !== "all" || affectedSystem !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setRiskLevel("all");
    setAffectedSystem("all");
  };

  // Summary cards always reflect the full approval set, independent of the
  // list filters below — same reasoning as Incidents/Investigations.
  const summary = useMemo(() => {
    return {
      pending: APPROVALS.filter((a) => a.status === "pending").length,
      // "High Risk" groups critical + high together — both need urgent
      // human attention, as distinct from medium/low.
      highRisk: APPROVALS.filter((a) => a.riskLevel === "critical" || a.riskLevel === "high").length,
      approvedToday: APPROVALS.filter(
        (a) => a.status === "approved" && a.decision && isSameDemoDay(a.decision.decisionAt),
      ).length,
      rejectedToday: APPROVALS.filter(
        (a) => a.status === "rejected" && a.decision && isSameDemoDay(a.decision.decisionAt),
      ).length,
    };
  }, []);

  const filteredApprovals = useMemo(() => {
    return APPROVALS.filter(
      (approval) =>
        matchesSearch(approval, search) &&
        (status === "all" || approval.status === status) &&
        (riskLevel === "all" || approval.riskLevel === riskLevel) &&
        (affectedSystem === "all" || approval.affectedSystem === affectedSystem),
    );
  }, [search, status, riskLevel, affectedSystem]);

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Approvals</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Operational actions recommended by an investigation, waiting for human authorization
            before anything is executed.
          </p>
        </div>
        <Badge variant="warning">Pending human review</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ApprovalSummaryCard label="Pending Approval" value={summary.pending} tone="warning" />
        <ApprovalSummaryCard label="High Risk" value={summary.highRisk} tone="danger" />
        <ApprovalSummaryCard label="Approved Today" value={summary.approvedToday} tone="success" />
        <ApprovalSummaryCard label="Rejected Today" value={summary.rejectedToday} tone="neutral" />
      </div>

      <Card className="mt-6 p-4 sm:p-5">
        <ApprovalFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          riskLevel={riskLevel}
          onRiskLevelChange={setRiskLevel}
          affectedSystem={affectedSystem}
          onAffectedSystemChange={setAffectedSystem}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </Card>

      <div className="mt-4">
        {filteredApprovals.length > 0 ? (
          <ApprovalTable approvals={filteredApprovals} />
        ) : (
          <Card>
            <EmptyState
              title="No approvals match your current filters."
              description="Try a different search term, or clear your filters to see every approval."
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
        Showing {filteredApprovals.length} of {APPROVALS.length} approvals.
      </p>
    </PageContainer>
  );
}
