import { Card } from "@/components/ui/Card";
import {
  PROGRESS_STAGES,
  STAGE_TO_PROGRESS_INDEX,
  type InvestigationStage,
  type InvestigationStatus,
} from "@/lib/mock/investigations";

interface InvestigationProgressProps {
  stage: InvestigationStage;
  status: InvestigationStatus;
}

/**
 * The seven-node investigation lifecycle stepper: Started → Evidence
 * Collection → Analysis → Root Cause → Recommendation → Approval →
 * Resolution. UI-only visualization — no logic runs here, it just reads
 * where this investigation's `stage` falls in PROGRESS_STAGES and renders
 * everything before it as done, that node as current, and the rest as
 * upcoming. A "failed" or "paused" status recolors the current node so the
 * stepper doesn't silently claim things are progressing normally.
 */
export function InvestigationProgress({ stage, status }: InvestigationProgressProps) {
  const currentIndex = STAGE_TO_PROGRESS_INDEX[stage];

  const currentNodeClass =
    status === "failed"
      ? "border-danger bg-danger text-white"
      : status === "paused"
        ? "border-warning bg-warning text-white"
        : "border-accent bg-accent text-accent-foreground";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Investigation Progress</h3>
        {status === "failed" && (
          <span className="text-xs font-medium text-danger">Stalled at this stage</span>
        )}
        {status === "paused" && (
          <span className="text-xs font-medium text-warning">Paused at this stage</span>
        )}
      </div>

      <ol className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-0">
        {PROGRESS_STAGES.map((label, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={label} className="flex flex-1 items-start sm:flex-col sm:items-center">
              <div className="flex flex-col items-center sm:w-full">
                <div className="flex w-full items-center sm:flex-row">
                  {/* Connector before this node (desktop only, skipped for the first) */}
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
                  {index < PROGRESS_STAGES.length - 1 && (
                    <span
                      className={`hidden h-px flex-1 sm:block ${isDone ? "bg-accent" : "bg-border"}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p
                  className={`mt-1.5 text-center text-xs font-medium sm:mt-2 ${
                    isCurrent ? "text-foreground" : isDone ? "text-foreground" : "text-muted"
                  }`}
                >
                  {label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
