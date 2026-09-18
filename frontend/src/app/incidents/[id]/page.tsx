import { notFound } from "next/navigation";

import { IncidentDetail } from "@/components/incidents/IncidentDetail";
import { PageContainer } from "@/components/ui/PageContainer";
import { getIncidentById } from "@/lib/mock/incidents";

interface IncidentDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Incident detail route — `/incidents/[id]`. Looks the incident up in the
 * same static INCIDENTS array the list page filters (lib/mock/incidents.ts,
 * Phase 4). An unknown id renders Next's standard not-found page rather
 * than a blank screen.
 */
export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = await params;
  const incident = getIncidentById(id);

  if (!incident) {
    notFound();
  }

  return (
    <PageContainer>
      <IncidentDetail incident={incident} />
    </PageContainer>
  );
}
