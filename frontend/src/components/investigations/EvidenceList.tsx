import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EvidenceItem, RelevanceLevel } from "@/lib/mock/investigations";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

const RELEVANCE_VARIANT: Record<RelevanceLevel, BadgeVariant> = {
  high: "accent",
  medium: "info",
  low: "neutral",
};

const RELEVANCE_LABEL: Record<RelevanceLevel, string> = {
  high: "High Relevance",
  medium: "Medium Relevance",
  low: "Low Relevance",
};

interface EvidenceListProps {
  evidence: EvidenceItem[];
}

/**
 * Factual evidence collected during the investigation — each item is a
 * standalone observation, deliberately separate from Findings (which is
 * where interpretation happens). Every item is simulated demo content, not
 * a real system's output — labeled "Simulated" rather than left ambiguous.
 */
export function EvidenceList({ evidence }: EvidenceListProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Evidence</h3>
        <Badge variant="neutral">Simulated observations</Badge>
      </div>

      {evidence.length === 0 ? (
        <EmptyState
          title="No evidence collected yet"
          description="This investigation hasn't collected any evidence yet."
        />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {evidence.map((item) => (
            <li key={item.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <Badge variant={RELEVANCE_VARIANT[item.relevance]}>
                  {RELEVANCE_LABEL[item.relevance]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{item.observation}</p>
              <p className="mt-1.5 text-xs text-muted">
                {item.source} &middot; {formatRelativeToDemoNow(item.collectedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
