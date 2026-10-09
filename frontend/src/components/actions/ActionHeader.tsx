import Link from "next/link";

import type { Action } from "@/lib/mock/actions";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

import { ActionRiskBadge } from "./ActionRiskBadge";
import { ActionStatusBadge } from "./ActionStatusBadge";
import { ActionVerificationBadge } from "./ActionVerificationBadge";

interface ActionHeaderProps {
  action: Action;
}

/**
 * Action Information — the detail page header: id, title, description, the
 * links back through the chain that produced it (incident, investigation,
 * approval), affected system, risk, and current status. Mirrors
 * ApprovalHeader's shape so the two detail pages read as one product.
 */
export function ActionHeader({ action }: ActionHeaderProps) {
  return (
    <div>
      <Link
        href="/actions"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        &larr; Back to Actions
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-medium text-muted">{action.id}</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">{action.title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">{action.description}</p>
          <p className="mt-2 text-sm text-muted">
            Related incident:{" "}
            <Link
              href={`/incidents/${action.incidentId}`}
              className="font-mono font-medium text-accent hover:underline"
            >
              {action.incidentId}
            </Link>
            {action.investigationId && (
              <>
                {" "}
                &middot; Investigation:{" "}
                <Link
                  href={`/investigations/${action.investigationId}`}
                  className="font-mono font-medium text-accent hover:underline"
                >
                  {action.investigationId}
                </Link>
              </>
            )}
            {action.approvalId ? (
              <>
                {" "}
                &middot; Approval:{" "}
                <Link
                  href={`/approvals/${action.approvalId}`}
                  className="font-mono font-medium text-accent hover:underline"
                >
                  {action.approvalId}
                </Link>
              </>
            ) : (
              <> &middot; Approval: none required (below the approval threshold)</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActionStatusBadge status={action.status} />
          <ActionRiskBadge riskLevel={action.riskLevel} />
          <ActionVerificationBadge status={action.verification.status} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:w-auto sm:auto-cols-max sm:grid-flow-col">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Affected System</dt>
          <dd className="mt-0.5 font-medium text-foreground">{action.affectedSystem}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Action Type</dt>
          <dd className="mt-0.5 font-medium text-foreground">{action.actionType}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Requested</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatRelativeToDemoNow(action.requestedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Approved</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {action.approvedAt ? formatRelativeToDemoNow(action.approvedAt) : "\u2014"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
