import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { IncidentSummaryItem } from "@/lib/mock/dashboard";

import { INCIDENT_STATUS_LABEL, INCIDENT_STATUS_VARIANT, SEVERITY_VARIANT } from "./statusStyles";

interface IncidentSummaryProps {
  incidents: IncidentSummaryItem[];
}

/**
 * The Dashboard's "Active Incidents" panel: a short list of incident
 * summaries. Phase 4 (Incidents UI) owns the full list/detail experience;
 * this stays deliberately short. Each row now links to `/incidents/[id]`
 * (Phase 4's "navigation from Dashboard into an incident") — that route,
 * and the fuller incident record it reads from lib/mock/incidents.ts, did
 * not exist until this phase. The ids here (INC-2031, etc.) are the same
 * incidents in that dataset, by design.
 */
export function IncidentSummary({ incidents }: IncidentSummaryProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <h3 className="text-sm font-semibold text-foreground">Active Incidents</h3>
        <Badge variant="neutral">{incidents.length} shown</Badge>
      </div>

      <ul className="divide-y divide-border">
        {incidents.map((incident) => (
          <li key={incident.id} className="px-4 py-4 transition-colors hover:bg-background sm:px-5">
            <Link href={`/incidents/${incident.id}`} className="block">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-medium text-muted">{incident.id}</span>
                  <h4 className="text-sm font-semibold text-foreground hover:underline">
                    {incident.title}
                  </h4>
                </div>
                <span className="whitespace-nowrap text-xs text-muted">{incident.detectedAt}</span>
              </div>
            </Link>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={SEVERITY_VARIANT[incident.severity]}>
                {incident.severity[0].toUpperCase() + incident.severity.slice(1)}
              </Badge>
              <Badge variant={INCIDENT_STATUS_VARIANT[incident.status]}>
                {INCIDENT_STATUS_LABEL[incident.status]}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-muted">{incident.description}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
