import { notFound } from "next/navigation";

import { ActionSummary } from "@/components/reports/ActionSummary";
import { ApprovalSummary } from "@/components/reports/ApprovalSummary";
import { ExecutiveSummary } from "@/components/reports/ExecutiveSummary";
import { RecommendationSummary } from "@/components/reports/RecommendationSummary";
import { ReportActions } from "@/components/reports/ReportActions";
import { ReportEvidenceSummary } from "@/components/reports/ReportEvidenceSummary";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { ReportIncidentSummary } from "@/components/reports/ReportIncidentSummary";
import { ReportInvestigationSummary } from "@/components/reports/ReportInvestigationSummary";
import { ReportTimeline } from "@/components/reports/ReportTimeline";
import { RootCauseSummary } from "@/components/reports/RootCauseSummary";
import { VerificationSummary } from "@/components/reports/VerificationSummary";
import { PageContainer } from "@/components/ui/PageContainer";
import { getReportById } from "@/lib/mock/reports";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Report detail view — `/reports/[id]`. Looks the report up in the same
 * static REPORTS array the list page filters (lib/mock/reports.ts, Phase
 * 8). An unknown id renders Next's standard not-found page, matching the
 * Incidents, Investigations, Approvals, and Actions detail routes.
 *
 * Section order follows the lifecycle a reader expects: what happened →
 * the incident → the investigation → the evidence → the conclusion → what
 * was proposed → who approved it → what was done → whether it worked →
 * the whole thing in one timeline.
 */
export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;
  const report = getReportById(id);

  if (!report) {
    notFound();
  }

  return (
    <PageContainer>
      <ReportHeader report={report} />

      <div className="mt-6 flex flex-col gap-6">
        <ExecutiveSummary summary={report.executiveSummary} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportIncidentSummary incidentId={report.incidentId} incident={report.incident} />
          <ReportInvestigationSummary investigation={report.investigation} />
        </div>

        <ReportEvidenceSummary evidence={report.evidence} />
        <RootCauseSummary rootCause={report.rootCause} />
        <RecommendationSummary recommendation={report.recommendation} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ApprovalSummary approval={report.approval} />
          <ActionSummary action={report.action} />
        </div>

        <VerificationSummary verification={report.verification} />
        <ReportTimeline events={report.timeline} />
        <ReportActions report={report} />
      </div>
    </PageContainer>
  );
}
