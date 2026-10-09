import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EvidenceItem, RootCause } from "@/lib/mock/investigations";

import { ConfidenceBadge } from "./InvestigationStageBadge";

interface RootCausePanelProps {
  rootCause?: RootCause;
  evidence: EvidenceItem[];
}

/**
 * The root-cause conclusion — visually set apart (accent border) from
 * Evidence and Findings above it, since this is the investigation's single
 * most load-bearing claim. Shown only once an investigation has actually
 * reached this stage; earlier-stage investigations show why it isn't here
 * yet rather than a placeholder that could be mistaken for a real gap in
 * the app (compare IncidentDetail's "Coming in a later phase" cards, which
 * mean something different: a feature this whole project hasn't built).
 */
export function RootCausePanel({ rootCause, evidence }: RootCausePanelProps) {
  if (!rootCause) {
    return (
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">Root Cause</h3>
        <EmptyState
          title="Root cause not yet identified"
          description="This investigation hasn't reached the root-cause stage yet."
        />
      </Card>
    );
  }

  const evidenceTitleById = new Map(evidence.map((item) => [item.id, item.title]));

  return (
    <Card className="bg-accent-muted/40 p-4 ring-1 ring-inset ring-accent/30 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Likely Root Cause
        </p>
        <ConfidenceBadge confidence={rootCause.confidence} />
      </div>
      <p className="mt-1.5 text-lg font-semibold text-foreground">{rootCause.summary}</p>
      <p className="mt-2 text-sm text-muted">{rootCause.explanation}</p>

      {rootCause.supportingEvidenceIds.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Supporting Evidence
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-foreground">
            {rootCause.supportingEvidenceIds.map((evidenceId) => (
              <li key={evidenceId}>{evidenceTitleById.get(evidenceId) ?? evidenceId}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
