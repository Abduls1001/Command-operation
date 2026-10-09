import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Approval } from "@/lib/mock/approvals";

interface ApprovalContextProps {
  approval: Approval;
}

/**
 * Recommendation Context — a concise, structured summary of why this
 * action is being requested: the relevant evidence, the impact observed so
 * far, the expected benefit of approving, and what to weigh before
 * deciding. Deliberately a short list of concrete bullets rather than a
 * narrative explanation, per the brief's explicit instruction not to expose
 * hidden model chain-of-thought — only concise structured findings.
 */
export function ApprovalContext({ approval }: ApprovalContextProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Recommendation Context</h3>
        <Badge variant="neutral">Simulated</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{approval.description}</p>

      <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Relevant Evidence</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-foreground">
            {approval.relevantEvidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Observed Impact</p>
          <p className="mt-0.5 text-foreground">{approval.observedImpact}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Expected Benefit</p>
          <p className="mt-0.5 text-foreground">{approval.expectedBenefit}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Risk Considerations</p>
          <p className="mt-0.5 text-foreground">{approval.riskConsiderations}</p>
        </div>
      </div>
    </Card>
  );
}
