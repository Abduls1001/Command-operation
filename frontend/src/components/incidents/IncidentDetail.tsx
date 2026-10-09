import Link from "next/link";

import { ClockIcon } from "@/components/layout/icons";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Incident } from "@/lib/mock/incidents";
import { formatRelativeToDemoNow } from "@/lib/mock/incidents";
import { getInvestigationsByIncidentId } from "@/lib/mock/investigations";

import { IncidentSeverityBadge } from "./IncidentSeverityBadge";
import { IncidentStatusBadge } from "./IncidentStatusBadge";

const LIFECYCLE_SECTIONS = [
  {
    title: "Root Cause",
    description: "The most likely underlying reason for this incident, with a stated confidence level.",
  },
  {
    title: "Recommended Action",
    description: "A specific, concrete action proposed to address the root cause, and its expected effect.",
  },
  {
    title: "Approval",
    description: "The human decision on the recommended action — approved, rejected, or modified, and by whom.",
  },
  {
    title: "Resolution",
    description: "The executed action's outcome and whether verification confirmed the incident actually recovered.",
  },
] as const;

interface IncidentDetailProps {
  incident: Incident;
}

/**
 * Full detail view for one incident. The top section shows everything this
 * phase actually has (Phase 4's static record); the sections below are
 * clearly labeled placeholders for the lifecycle stages later phases will
 * fill in (Investigation in Phase 5, Approval in Phase 6, and so on — see
 * PROJECT_SPEC.md §5). No investigation or action logic runs here.
 */
export function IncidentDetail({ incident }: IncidentDetailProps) {
  return (
    <div>
      <Link
        href="/incidents"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        &larr; Back to Incidents
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-medium text-muted">{incident.id}</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">{incident.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IncidentSeverityBadge severity={incident.severity} />
          <IncidentStatusBadge status={incident.status} />
        </div>
      </div>

      <Card className="mt-4 p-4 sm:p-5">
        <p className="text-sm text-foreground">{incident.description}</p>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Affected System
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">{incident.affectedSystem}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Source</dt>
            <dd className="mt-0.5 font-medium text-foreground">{incident.source}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Created</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {formatRelativeToDemoNow(incident.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Last Updated
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {formatRelativeToDemoNow(incident.updatedAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Current Operational Context
          </p>
          <p className="mt-1 text-sm text-muted">{incident.operationalContext}</p>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InvestigationLinkCard incidentId={incident.id} />
        {LIFECYCLE_SECTIONS.map((section) => (
          <Card key={section.title}>
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <Badge variant="accent">Coming in a later phase</Badge>
            </div>
            <EmptyState
              icon={<ClockIcon className="h-5 w-5" />}
              title="Not built yet"
              description={section.description}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * The "Investigation" lifecycle card, upgraded in Phase 5: if a real
 * investigation exists for this incident (lib/mock/investigations.ts), it
 * links straight into that investigation's workspace instead of showing a
 * generic "not built yet" placeholder. Incidents with no investigation yet
 * (e.g. a closed incident that was handled manually) still show the
 * original placeholder.
 */
function InvestigationLinkCard({ incidentId }: { incidentId: string }) {
  const investigations = getInvestigationsByIncidentId(incidentId);

  if (investigations.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Investigation</h3>
          <Badge variant="accent">Coming in a later phase</Badge>
        </div>
        <EmptyState
          icon={<ClockIcon className="h-5 w-5" />}
          title="No investigation yet"
          description="No investigation has been started for this incident."
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Investigation</h3>
        <Badge variant="neutral">{investigations.length} linked</Badge>
      </div>
      <ul className="divide-y divide-border">
        {investigations.map((investigation) => (
          <li key={investigation.id} className="px-4 py-3">
            <Link
              href={`/investigations/${investigation.id}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              {investigation.id} &middot; {investigation.title}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
