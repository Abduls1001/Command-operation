import { Card } from "@/components/ui/Card";
import type { AiActivityItem, AiActivityType } from "@/lib/mock/dashboard";

const TYPE_LABEL: Record<AiActivityType, string> = {
  investigation_started: "Investigation Started",
  evidence_collected: "Evidence Collected",
  root_cause_identified: "Root Cause Identified",
  recommendation_generated: "Recommendation Generated",
  awaiting_approval: "Waiting for Approval",
};

const TYPE_DOT_CLASS: Record<AiActivityType, string> = {
  investigation_started: "bg-info",
  evidence_collected: "bg-muted",
  root_cause_identified: "bg-warning",
  recommendation_generated: "bg-accent",
  awaiting_approval: "bg-warning",
};

interface AiActivityProps {
  items: AiActivityItem[];
}

/**
 * Static feed of AI activity, presented as a vertical timeline. This is
 * UI-only per the Phase 3 scope — there is no agent behind it yet. Real
 * activity will come from the Investigations domain once the backend and
 * agent exist (Phases 10–13).
 */
export function AiActivity({ items }: AiActivityProps) {
  return (
    <Card className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">AI Activity</h3>
      <ol className="mt-3 space-y-4">
        {items.map((item, index) => (
          <li key={item.id} className="flex gap-3">
            <span className="flex flex-col items-center self-stretch">
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${TYPE_DOT_CLASS[item.type]}`}
                aria-hidden="true"
              />
              {index < items.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {TYPE_LABEL[item.type]}
                <span className="ml-2 font-mono normal-case tracking-normal text-muted">
                  {item.incidentId}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-foreground">{item.message}</p>
              <p className="mt-0.5 text-xs text-muted">{item.timestamp}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
