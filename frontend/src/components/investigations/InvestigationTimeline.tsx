import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TimelineEvent } from "@/lib/mock/investigations";
import { formatClockTime } from "@/lib/mock/time";

interface InvestigationTimelineProps {
  events: TimelineEvent[];
}

/**
 * Chronological event-by-event record of the investigation. Static demo
 * content — see lib/mock/investigations.ts. Each event's optional `source`
 * label stands in for "which tool/system produced this step," a concrete,
 * presentation-only stand-in for the future agent's real tool calls.
 */
export function InvestigationTimeline({ events }: InvestigationTimelineProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Investigation Timeline</h3>
        <Badge variant="neutral">Simulated</Badge>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No timeline events yet"
          description="This investigation hasn't recorded any steps yet."
        />
      ) : (
        <ol className="mt-4 space-y-4">
          {events.map((event, index) => (
            <li key={event.id} className="flex gap-4">
              <div className="flex flex-shrink-0 flex-col items-center">
                <span className="font-mono text-xs text-muted">{formatClockTime(event.timestamp)}</span>
                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" aria-hidden="true" />
                {index < events.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-sm font-semibold text-foreground">
                  {event.title}
                  {event.source && (
                    <span className="ml-2 text-xs font-normal text-muted">via {event.source}</span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-muted">{event.description}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
