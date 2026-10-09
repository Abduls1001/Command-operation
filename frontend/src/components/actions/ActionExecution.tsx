import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDuration, type Action } from "@/lib/mock/actions";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

interface ActionExecutionProps {
  action: Action;
}

const EXECUTION_STATE: Record<Action["status"], string> = {
  pending_approval: "Not started — awaiting approval",
  approved: "Not started — queued for execution",
  executing: "In progress",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Never started — cancelled",
};

function formatTimestamp(iso?: string): string {
  if (!iso) return "\u2014";
  return `${new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;
}

/**
 * Execution Information — what a future execution record will carry:
 * execution state, start/finish times, duration, and the executor that
 * would carry it out. Every value here is static demo content; nothing has
 * been executed, and the executor names are placeholders for tools that
 * don't exist yet (Phase 14). Empty values render as "—" rather than an
 * invented figure.
 */
export function ActionExecution({ action }: ActionExecutionProps) {
  const duration = formatDuration(action.startedAt, action.completedAt);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Execution Information</h3>
        <Badge variant="neutral">Simulated / demo data</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Execution Status
          </dt>
          <dd className="mt-0.5 text-foreground">{EXECUTION_STATE[action.status]}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Executor</dt>
          <dd className="mt-0.5 text-foreground">{action.executor}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Started At</dt>
          <dd className="mt-0.5 text-foreground">
            {formatTimestamp(action.startedAt)}
            {action.startedAt && (
              <span className="ml-2 text-xs text-muted">
                ({formatRelativeToDemoNow(action.startedAt)})
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Completed At</dt>
          <dd className="mt-0.5 text-foreground">
            {formatTimestamp(action.completedAt)}
            {action.completedAt && (
              <span className="ml-2 text-xs text-muted">
                ({formatRelativeToDemoNow(action.completedAt)})
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Execution Duration
          </dt>
          <dd className="mt-0.5 text-foreground">
            {duration ?? (action.status === "executing" ? "Still running" : "\u2014")}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Approval Requirement
          </dt>
          <dd className="mt-0.5 text-foreground">
            {action.approvalRequired ? "Human approval required" : "Below the approval threshold"}
            {action.approvedBy && (
              <span className="mt-0.5 block text-xs text-muted">Approved by {action.approvedBy}</span>
            )}
          </dd>
        </div>
      </dl>

      {action.executionNote && (
        <div className="mt-4 rounded-md border border-border bg-background p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Execution Note</p>
          <p className="mt-1 text-sm text-foreground">{action.executionNote}</p>
        </div>
      )}

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
        These timestamps, durations, and executors are hand-written demo values. No action in this
        application has ever been executed — the execution layer arrives in a later phase.
      </p>
    </Card>
  );
}
