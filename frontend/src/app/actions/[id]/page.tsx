import { notFound } from "next/navigation";

import { ActionContext } from "@/components/actions/ActionContext";
import { ActionControls } from "@/components/actions/ActionControls";
import { ActionExecution } from "@/components/actions/ActionExecution";
import { ActionHeader } from "@/components/actions/ActionHeader";
import { ActionLifecycle } from "@/components/actions/ActionLifecycle";
import { ActionTimeline } from "@/components/actions/ActionTimeline";
import { ActionVerificationPanel } from "@/components/actions/ActionVerificationPanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { getActionById } from "@/lib/mock/actions";

interface ActionDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Action detail view — `/actions/[id]`. Looks the action up in the same
 * static ACTIONS array the list page filters (lib/mock/actions.ts, Phase
 * 7). An unknown id renders Next's standard not-found page, matching the
 * Incidents, Investigations, and Approvals detail routes.
 */
export default async function ActionDetailPage({ params }: ActionDetailPageProps) {
  const { id } = await params;
  const action = getActionById(id);

  if (!action) {
    notFound();
  }

  return (
    <PageContainer>
      <ActionHeader action={action} />

      <div className="mt-6 flex flex-col gap-6">
        <ActionLifecycle action={action} />
        <ActionContext action={action} />
        <ActionExecution action={action} />
        <ActionVerificationPanel verification={action.verification} />
        <ActionTimeline events={action.timeline} />
        <ActionControls action={action} />
      </div>
    </PageContainer>
  );
}
