import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ReportEvent } from "@/lib/mock/reports";
import { formatReportTimestamp } from "@/lib/mock/reports";

interface ReportTimelineProps {
  events: ReportEvent[];
}

/**
 * The incident's whole lifecycle in one column: detection → investigation →
 * evidence → root cause → recommendation → approval → action →
 * verification → report. Uses the same vertical-timeline treatment as the
 * Investigations and Actions timelines, but with absolute timestamps, since
 * a report is read long after the fact.
 */
export function ReportTimeline({ events }: ReportTimelineProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Report Timeline</h3>
        <Badge variant="neutral">Simulated</Badge>
      </div>

      <ol className="mt-4 space-y-4">
        {events.map((event, index) => (
          <li key={event.id} className="flex gap-4">
            <div className="flex w-32 flex-shrink-0 flex-col items-end">
              <span className="text-right font-mono text-xs text-muted">
                {formatReportTimestamp(event.timestamp)}
              </span>
            </div>
            <div className="flex flex-shrink-0 flex-col items-center">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-accent" aria-hidden="true" />
              {index < events.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-sm font-semibold text-foreground">{event.title}</p>
              <p className="mt-0.5 text-sm text-muted">{event.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
