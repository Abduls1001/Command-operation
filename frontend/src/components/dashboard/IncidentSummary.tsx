import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDetectedAt } from "@/lib/api/incidents";

import { INCIDENT_STATUS_LABEL, INCIDENT_STATUS_VARIANT, SEVERITY_VARIANT } from "./statusStyles";
import type { IncidentsState } from "./useActiveIncidents";

interface IncidentSummaryProps {
  state: IncidentsState;
  onRetry: () => void;
}

/**
 * The Dashboard's "Active Incidents" panel (Phase 16): the incidents the backend has
 * detected from the real NovaCommerce data (GET /api/incidents/active), most severe first.
 *
 * Handles its own loading, error (with retry) and empty states. Rows are not links:
 * detected incidents are computed, not stored, so the Incidents page (still mock data
 * from Phase 4) has no record to open for them.
 *
 * All text comes from the backend and is rendered as React text nodes only.
 */
export function IncidentSummary({ state, onRetry }: IncidentSummaryProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <h3 className="text-sm font-semibold text-foreground">Active Incidents</h3>
        {state.status === "ready" && (
          <Badge variant="neutral">{state.incidents.length} active</Badge>
        )}
      </div>

      {state.status === "loading" && (
        <p role="status" className="px-4 py-6 text-sm text-muted sm:px-5">
          Loading active incidents…
        </p>
      )}

      {state.status === "error" && (
        <div className="px-4 py-6 sm:px-5">
          <p role="alert" className="text-sm font-medium text-danger">
            Could not load active incidents.
          </p>
          <p className="mt-1 text-sm text-muted">{state.error.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Retry
          </button>
        </div>
      )}

      {state.status === "ready" && state.incidents.length === 0 && (
        <EmptyState
          title="No active incidents"
          description="No operational problems were detected in the latest NovaCommerce data."
        />
      )}

      {state.status === "ready" && state.incidents.length > 0 && (
        <ul className="divide-y divide-border">
          {state.incidents.map((incident) => (
            <li key={incident.id} className="px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">{incident.title}</h4>
                <span className="whitespace-nowrap text-xs text-muted">
                  Detected {formatDetectedAt(incident.detected_at)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={SEVERITY_VARIANT[incident.severity]}>
                  {incident.severity[0].toUpperCase() + incident.severity.slice(1)}
                </Badge>
                <Badge variant={INCIDENT_STATUS_VARIANT[incident.status]}>
                  {INCIDENT_STATUS_LABEL[incident.status]}
                </Badge>
                <Badge variant="neutral">{incident.affected_system}</Badge>
              </div>

              <p className="mt-2 text-sm text-muted">{incident.description}</p>

              {incident.evidence.length > 0 && (
                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-[max-content_1fr]">
                  {incident.evidence.map((item) => (
                    <div key={item.label} className="contents">
                      <dt className="font-medium text-muted">{item.label}</dt>
                      <dd className="mb-1 text-foreground sm:mb-0">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
