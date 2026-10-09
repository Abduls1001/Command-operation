"use client";

import { useMemo, useState } from "react";

import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportSummaryCard } from "@/components/reports/ReportSummaryCard";
import { ReportTable } from "@/components/reports/ReportTable";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/PageContainer";
import type { VerificationStatus } from "@/lib/mock/actions";
import type { IncidentSeverity } from "@/lib/mock/incidents";
import {
  REPORTS,
  RESOLVED_OUTCOMES,
  type Report,
  type ReportOutcome,
  type ReportStatus,
} from "@/lib/mock/reports";

function matchesSearch(report: Report, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [
    report.id,
    report.incidentId,
    report.investigationId ?? "",
    report.title,
    report.rootCause?.summary ?? "",
    report.verification.finalOutcome,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

/**
 * The Reports page — the durable record of each incident's full lifecycle.
 * All data is static (lib/mock/reports.ts, Phase 8). Search and filtering
 * run entirely client-side: there is no backend call anywhere on this page,
 * no report is generated, and no document is produced.
 */
export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [severity, setSeverity] = useState<IncidentSeverity | "all">("all");
  const [outcome, setOutcome] = useState<ReportOutcome | "all">("all");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | "all">("all");

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    severity !== "all" ||
    outcome !== "all" ||
    verificationStatus !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setSeverity("all");
    setOutcome("all");
    setVerificationStatus("all");
  };

  // Summary cards always reflect the full report set, independent of the
  // list filters below — the same reasoning as every previous phase.
  const summary = useMemo(
    () => ({
      total: REPORTS.length,
      resolved: REPORTS.filter((r) => RESOLVED_OUTCOMES.includes(r.outcome)).length,
      pendingReview: REPORTS.filter((r) => r.status === "under_review").length,
      critical: REPORTS.filter((r) => r.severity === "critical").length,
    }),
    [],
  );

  const filteredReports = useMemo(() => {
    return REPORTS.filter(
      (report) =>
        matchesSearch(report, search) &&
        (status === "all" || report.status === status) &&
        (severity === "all" || report.severity === severity) &&
        (outcome === "all" || report.outcome === outcome) &&
        (verificationStatus === "all" || report.verification.status === verificationStatus),
    );
  }, [search, status, severity, outcome, verificationStatus]);

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Reports</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Structured operational investigation and resolution reports — what happened, what was
            found, what was done, and whether it worked.
          </p>
        </div>
        <Badge variant="accent">Operational reports</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportSummaryCard label="Total Reports" value={summary.total} />
        <ReportSummaryCard label="Resolved" value={summary.resolved} tone="success" />
        <ReportSummaryCard label="Pending Review" value={summary.pendingReview} tone="info" />
        <ReportSummaryCard label="Critical Incidents" value={summary.critical} tone="danger" />
      </div>

      <Card className="mt-6 p-4 sm:p-5">
        <ReportFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          severity={severity}
          onSeverityChange={setSeverity}
          outcome={outcome}
          onOutcomeChange={setOutcome}
          verificationStatus={verificationStatus}
          onVerificationStatusChange={setVerificationStatus}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </Card>

      <div className="mt-4">
        {filteredReports.length > 0 ? (
          <ReportTable reports={filteredReports} />
        ) : (
          <Card>
            <EmptyState
              title="No reports match your current filters."
              description="Try a different search term, or clear your filters to see every report."
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
        Showing {filteredReports.length} of {REPORTS.length} reports. Static demo data — no report
        is generated and no document is produced.
      </p>
    </PageContainer>
  );
}
