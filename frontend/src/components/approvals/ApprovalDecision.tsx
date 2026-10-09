"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Approval, ApprovalDecision as ApprovalDecisionRecord, ApprovalStatus } from "@/lib/mock/approvals";
import { DEMO_NOW } from "@/lib/mock/time";

import { ApprovalStatusBadge } from "./ApprovalStatusBadge";

interface ApprovalDecisionProps {
  approval: Approval;
}

const DEMO_REVIEWER = "You (Operator, demo session)";

/**
 * Recommended Action + the demo Approve/Reject controls + the Audit
 * Preview. This is the only interactive part of the Approvals page.
 *
 * Everything here is local component state, per the brief: clicking
 * Approve/Reject never calls a backend, never writes back to
 * lib/mock/approvals.ts, and never executes anything. It exists purely so
 * the queue *feels* interactive in the demo. A "Reset demo decision"
 * control makes that local-only choice reversible, since nothing was
 * actually persisted in the first place.
 */
export function ApprovalDecision({ approval }: ApprovalDecisionProps) {
  const [status, setStatus] = useState<ApprovalStatus>(approval.status);
  const [decision, setDecision] = useState<ApprovalDecisionRecord | undefined>(approval.decision);
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null);
  const [comment, setComment] = useState("");

  const isPending = status === "pending";
  const wasDecidedThisSession = status !== approval.status;

  function confirmDecision() {
    if (!pendingAction) return;
    setStatus(pendingAction);
    setDecision({
      decision: pendingAction,
      decisionBy: DEMO_REVIEWER,
      decisionAt: DEMO_NOW.toISOString(),
      comment: comment.trim() || (pendingAction === "approved" ? "Approved via demo UI." : "Rejected via demo UI."),
    });
    setPendingAction(null);
    setComment("");
  }

  function resetDemoDecision() {
    setStatus(approval.status);
    setDecision(approval.decision);
    setPendingAction(null);
    setComment("");
  }

  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recommended Action</p>
      <p className="mt-1.5 text-lg font-semibold text-foreground">{approval.requestedAction}</p>
      <p className="mt-1 text-sm text-muted">{approval.reason}</p>

      <p className="mt-4 border-t border-border pt-4 text-xs text-muted">
        This is a demo UI interaction only. Nothing here calls a backend API, modifies a
        database, triggers n8n, or executes a real business action.
      </p>

      <div className="mt-4 border-t border-border pt-4">
        {isPending ? (
          pendingAction ? (
            <div className="rounded-md border border-border bg-background p-3">
              <p className="text-sm font-medium text-foreground">
                {pendingAction === "approved" ? "Approve this operational action?" : "Reject this operational action?"}
              </p>
              <p className="mt-1 text-xs text-muted">
                Demo only — this records a local decision for this session and does not execute
                anything.
              </p>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-muted">
                Decision comment (optional)
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={2}
                  placeholder="Add a note for the audit record…"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm normal-case text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={confirmDecision}
                  className={`rounded-md px-3.5 py-1.5 text-sm font-medium text-white transition-colors ${
                    pendingAction === "approved"
                      ? "bg-success hover:bg-success/90"
                      : "bg-danger hover:bg-danger/90"
                  }`}
                >
                  Confirm {pendingAction === "approved" ? "Approval" : "Rejection"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingAction(null);
                    setComment("");
                  }}
                  className="rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPendingAction("approved")}
                className="rounded-md bg-success px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-success/90"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setPendingAction("rejected")}
                className="rounded-md bg-danger px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-danger/90"
              >
                Reject
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">This approval is no longer pending:</span>
            <ApprovalStatusBadge status={status} />
            {wasDecidedThisSession && (
              <button
                type="button"
                onClick={resetDemoDecision}
                className="ml-auto rounded-md border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                Reset demo decision
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Audit Preview</p>
          <Badge variant="neutral">UI only — not persisted</Badge>
        </div>

        {decision ? (
          <dl className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Decision</dt>
              <dd className="mt-0.5 text-foreground">
                {decision.decision === "approved" ? "Approved" : "Rejected"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Decision By</dt>
              <dd className="mt-0.5 text-foreground">{decision.decisionBy}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Decision Time</dt>
              <dd className="mt-0.5 text-foreground">
                {new Date(decision.decisionAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Decision Comment</dt>
              <dd className="mt-0.5 text-foreground">{decision.comment}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No decision recorded yet. Approving or rejecting above will populate a preview of
            what a future audit record could contain — this is UI only, nothing is persisted.
          </p>
        )}
      </div>
    </Card>
  );
}
