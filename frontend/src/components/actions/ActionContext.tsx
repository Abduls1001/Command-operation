import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Action } from "@/lib/mock/actions";

import { ActionRiskBadge } from "./ActionRiskBadge";

interface ActionContextProps {
  action: Action;
}

/**
 * Action Context — why this action was recommended, what it is expected to
 * achieve, what it touches, and the evidence behind it. Deliberately a
 * short list of concrete statements rather than a narrative: per the brief,
 * no hidden model chain-of-thought is exposed here, only the concise
 * structured summary a human needs to judge the action.
 */
export function ActionContext({ action }: ActionContextProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Action Context</h3>
        <Badge variant="neutral">Simulated</Badge>
      </div>

      <div className="mt-4 space-y-4 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Why This Was Recommended
          </p>
          <p className="mt-0.5 text-foreground">{action.reason}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Expected Outcome</p>
          <p className="mt-0.5 text-foreground">{action.expectedOutcome}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Related Evidence Summary
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-foreground">
            {action.evidenceSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Affected System</dt>
          <dd className="mt-0.5 text-foreground">{action.affectedSystem}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Risk</dt>
          <dd className="mt-1">
            <ActionRiskBadge riskLevel={action.riskLevel} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}
