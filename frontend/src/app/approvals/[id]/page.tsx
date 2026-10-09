import { notFound } from "next/navigation";

import { ApprovalContext } from "@/components/approvals/ApprovalContext";
import { ApprovalDecision } from "@/components/approvals/ApprovalDecision";
import { ApprovalEvidence } from "@/components/approvals/ApprovalEvidence";
import { ApprovalHeader } from "@/components/approvals/ApprovalHeader";
import { ApprovalRiskImpact } from "@/components/approvals/ApprovalRiskImpact";
import { PageContainer } from "@/components/ui/PageContainer";
import { getApprovalById } from "@/lib/mock/approvals";

interface ApprovalDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Approval detail/review workspace — `/approvals/[id]`. Looks the approval
 * up in the same static APPROVALS array the queue page filters
 * (lib/mock/approvals.ts, Phase 6). An unknown id renders Next's standard
 * not-found page, matching the Incidents and Investigations detail routes.
 */
export default async function ApprovalDetailPage({ params }: ApprovalDetailPageProps) {
  const { id } = await params;
  const approval = getApprovalById(id);

  if (!approval) {
    notFound();
  }

  return (
    <PageContainer>
      <ApprovalHeader approval={approval} />

      <div className="mt-6 flex flex-col gap-6">
        <ApprovalContext approval={approval} />
        <ApprovalEvidence evidenceSummary={approval.evidenceSummary} />
        <ApprovalRiskImpact approval={approval} />
        <ApprovalDecision approval={approval} />
      </div>
    </PageContainer>
  );
}
