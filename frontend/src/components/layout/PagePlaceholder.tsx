import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/PageContainer";

import { ClockIcon } from "./icons";

interface PagePlaceholderProps {
  title: string;
  description: string;
}

/**
 * Placeholder body for a page whose real content hasn't been built yet.
 * Every Phase 2 route renders this. Real page content replaces it in the
 * phase that owns that page (Phase 3 for Dashboard, Phase 4 for Incidents,
 * and so on — see DEVELOPMENT_PLAN.md).
 */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
        </div>
        <Badge variant="accent">Coming in a later phase</Badge>
      </div>

      <Card>
        <EmptyState
          icon={<ClockIcon className="h-5 w-5" />}
          title="Not built yet"
          description="This page is a placeholder from Phase 2 (Website Shell). Its real content is scheduled for a later phase of the Development Plan."
        />
      </Card>
    </PageContainer>
  );
}
