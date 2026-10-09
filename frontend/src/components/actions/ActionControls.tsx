"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Action } from "@/lib/mock/actions";

interface ActionControlsProps {
  action: Action;
}

const linkClassName =
  "rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background";

/**
 * Contextual controls for an action: links back through the chain that
 * produced it, plus — for an approved action that hasn't run — a demo-only
 * "Execute Action" button.
 *
 * The Execute button is UI only, exactly as the Phase 7 brief requires. It
 * does not call a backend, touch a database, trigger n8n, call an LLM, or
 * perform any real operation. It flips a local `useState` flag so the demo
 * shows what the control will eventually feel like, labels that state
 * clearly as a demo interaction, and offers a reset — nothing was
 * persisted, so nothing needs undoing.
 */
export function ActionControls({ action }: ActionControlsProps) {
  const [demoExecuted, setDemoExecuted] = useState(false);

  const canOfferExecute = action.status === "approved";

  return (
    <Card className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">Action Controls</h3>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/incidents/${action.incidentId}`} className={linkClassName}>
          View Incident
        </Link>
        {action.investigationId && (
          <Link href={`/investigations/${action.investigationId}`} className={linkClassName}>
            View Investigation
          </Link>
        )}
        {action.approvalId && (
          <Link href={`/approvals/${action.approvalId}`} className={linkClassName}>
            View Approval
          </Link>
        )}
      </div>

      {canOfferExecute && (
        <div className="mt-4 border-t border-border pt-4">
          {demoExecuted ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="accent">Demo interaction only — nothing was executed</Badge>
              <span className="text-sm text-muted">
                In the finished system this is where execution would begin.
              </span>
              <button
                type="button"
                onClick={() => setDemoExecuted(false)}
                className="ml-auto rounded-md border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                Reset demo interaction
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setDemoExecuted(true)}
                className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Execute Action
              </button>
              <span className="text-sm text-muted">
                UI only in this phase — this button does not execute anything.
              </span>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
        No control on this page calls a backend API, modifies a database, triggers n8n, calls an
        AI model, or performs a real business operation.
      </p>
    </Card>
  );
}
