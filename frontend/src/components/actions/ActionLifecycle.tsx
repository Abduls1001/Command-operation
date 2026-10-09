import { Card } from "@/components/ui/Card";
import { ACTION_LIFECYCLE_STAGES, lifecycleIndexOf, type Action } from "@/lib/mock/actions";

interface ActionLifecycleProps {
  action: Action;
}

/**
 * The six-node action lifecycle: Recommended → Approval → Approved →
 * Execution → Verification → Completed. UI only — nothing advances a
 * stage; the current node is read from the action's own static status via
 * lifecycleIndexOf(). A failed or cancelled action recolors its current
 * node, so the stepper never implies progress that didn't happen.
 *
 * Built to match InvestigationProgress deliberately, so a reader who has
 * seen the investigation stepper recognises this one immediately.
 */
export function ActionLifecycle({ action }: ActionLifecycleProps) {
  const currentIndex = lifecycleIndexOf(action);

  const currentNodeClass =
    action.status === "failed"
      ? "border-danger bg-danger text-white"
      : action.status === "cancelled"
        ? "border-border bg-muted text-white"
        : "border-accent bg-accent text-accent-foreground";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Action Lifecycle</h3>
        {action.status === "failed" && (
          <span className="text-xs font-medium text-danger">Stopped at this stage</span>
        )}
        {action.status === "cancelled" && (
          <span className="text-xs font-medium text-muted">Cancelled at this stage</span>
        )}
        {action.status === "completed" && action.verification.status === "failed" && (
          <span className="text-xs font-medium text-danger">Executed, but verification failed</span>
        )}
      </div>

      <ol className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-0">
        {ACTION_LIFECYCLE_STAGES.map((label, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={label} className="flex flex-1 items-start sm:flex-col sm:items-center">
              <div className="flex flex-col items-center sm:w-full">
                <div className="flex w-full items-center sm:flex-row">
                  {index > 0 && (
                    <span
                      className={`hidden h-px flex-1 sm:block ${
                        isDone || isCurrent ? "bg-accent" : "bg-border"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={[
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                      isCurrent
                        ? currentNodeClass
                        : isDone
                          ? "border-accent bg-accent-muted text-accent"
                          : "border-border bg-surface text-muted",
                    ].join(" ")}
                  >
                    {isDone ? "\u2713" : index + 1}
                  </span>
                  {index < ACTION_LIFECYCLE_STAGES.length - 1 && (
                    <span
                      className={`hidden h-px flex-1 sm:block ${isDone ? "bg-accent" : "bg-border"}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p
                  className={`mt-1.5 text-center text-xs font-medium sm:mt-2 ${
                    isCurrent || isDone ? "text-foreground" : "text-muted"
                  }`}
                >
                  {label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 border-t border-border pt-3 text-xs text-muted">
        Lifecycle visualization only. No stage advances on its own, and nothing on this page
        executes an action — execution and verification arrive in a later phase.
      </p>
    </Card>
  );
}
