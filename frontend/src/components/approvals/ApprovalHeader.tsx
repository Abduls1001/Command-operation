import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { formatExpiry, type Approval } from "@/lib/mock/approvals";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

import { ApprovalRiskBadge } from "./ApprovalRiskBadge";
import { ApprovalStatusBadge } from "./ApprovalStatusBadge";

interface ApprovalHeaderProps {
  approval: Approval;
}

/**
 * Detail-page header: id, title, related incident/investigation links,
 * status/risk badges, and requested/expiry times — the "Request
 * Information" section of the brief. Mirrors InvestigationHeader's shape.
 */
export function ApprovalHeader({ approval }: ApprovalHeaderProps) {
  return (
    <div>
      <Link
        href="/approvals"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        &larr; Back to Approvals
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-medium text-muted">{approval.id}</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">{approval.title}</h2>
          <p className="mt-1 text-sm text-muted">
            Related incident:{" "}
            <Link
              href={`/incidents/${approval.incidentId}`}
              className="font-mono font-medium text-accent hover:underline"
            >
              {approval.incidentId}
            </Link>
            {approval.investigationId && (
              <>
                {" "}
                &middot; Related investigation:{" "}
                <Link
                  href={`/investigations/${approval.investigationId}`}
                  className="font-mono font-medium text-accent hover:underline"
                >
                  {approval.investigationId}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ApprovalStatusBadge status={approval.status} />
          <ApprovalRiskBadge riskLevel={approval.riskLevel} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:w-auto sm:auto-cols-max sm:grid-flow-col">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Affected System</dt>
          <dd className="mt-0.5 font-medium text-foreground">{approval.affectedSystem}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Requested By</dt>
          <dd className="mt-0.5 font-medium text-foreground">{approval.requestedBy}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Requested</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatRelativeToDemoNow(approval.requestedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Expiration</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {approval.status === "pending" ? (
              formatExpiry(approval.expiresAt)
            ) : (
              <Badge variant="neutral">Not applicable</Badge>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
