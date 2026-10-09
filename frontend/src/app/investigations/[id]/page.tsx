import { notFound } from "next/navigation";

import { EvidenceList } from "@/components/investigations/EvidenceList";
import { FindingsPanel } from "@/components/investigations/FindingsPanel";
import { InvestigationHeader } from "@/components/investigations/InvestigationHeader";
import { InvestigationProgress } from "@/components/investigations/InvestigationProgress";
import { InvestigationTimeline } from "@/components/investigations/InvestigationTimeline";
import { RecommendationPanel } from "@/components/investigations/RecommendationPanel";
import { RootCausePanel } from "@/components/investigations/RootCausePanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { getInvestigationById } from "@/lib/mock/investigations";

interface InvestigationDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Investigation detail workspace — `/investigations/[id]`. Looks the
 * investigation up in the same static INVESTIGATIONS array the list page
 * filters (lib/mock/investigations.ts, Phase 5). An unknown id renders
 * Next's standard not-found page.
 */
export default async function InvestigationDetailPage({ params }: InvestigationDetailPageProps) {
  const { id } = await params;
  const investigation = getInvestigationById(id);

  if (!investigation) {
    notFound();
  }

  return (
    <PageContainer>
      <InvestigationHeader investigation={investigation} />

      <div className="mt-6 flex flex-col gap-6">
        <InvestigationProgress stage={investigation.stage} status={investigation.status} />
        <InvestigationTimeline events={investigation.timeline} />
        <EvidenceList evidence={investigation.evidence} />
        <FindingsPanel findings={investigation.findings} evidence={investigation.evidence} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RootCausePanel rootCause={investigation.rootCause} evidence={investigation.evidence} />
          <RecommendationPanel recommendation={investigation.recommendation} />
        </div>
      </div>
    </PageContainer>
  );
}
