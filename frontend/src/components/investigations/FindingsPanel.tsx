import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EvidenceItem, Finding } from "@/lib/mock/investigations";

interface FindingsPanelProps {
  findings: Finding[];
  evidence: EvidenceItem[];
}

/**
 * Findings — interpretation drawn from evidence, kept visibly distinct from
 * the Evidence section above it. Each finding pairs an observation (what
 * the pattern is) with an analysis (what it means) and links back to the
 * specific evidence items that support it, so a reader can trace the
 * reasoning rather than take the conclusion on faith.
 */
export function FindingsPanel({ findings, evidence }: FindingsPanelProps) {
  const evidenceTitleById = new Map(evidence.map((item) => [item.id, item.title]));

  return (
    <Card className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">Findings</h3>
      <p className="mt-1 text-xs text-muted">
        Interpretation drawn from the evidence above — not new observations of its own.
      </p>

      {findings.length === 0 ? (
        <EmptyState
          title="No findings yet"
          description="Not enough evidence has been collected to draw a finding yet."
        />
      ) : (
        <ul className="mt-4 space-y-4">
          {findings.map((finding) => (
            <li key={finding.id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
              <p className="text-sm font-medium text-foreground">{finding.observation}</p>
              <p className="mt-1 text-sm text-muted">{finding.analysis}</p>
              {finding.relatedEvidenceIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {finding.relatedEvidenceIds.map((evidenceId) => (
                    <Badge key={evidenceId} variant="neutral">
                      {evidenceTitleById.get(evidenceId) ?? evidenceId}
                    </Badge>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
