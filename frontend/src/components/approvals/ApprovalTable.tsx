import Link from "next/link";

import { TableShell } from "@/components/ui/TableShell";
import { formatExpiry, type Approval } from "@/lib/mock/approvals";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

import { ApprovalRiskBadge } from "./ApprovalRiskBadge";
import { ApprovalStatusBadge } from "./ApprovalStatusBadge";

interface ApprovalTableProps {
  approvals: Approval[];
}

/**
 * The Approvals queue, rendered inside the shared TableShell primitive
 * (also used by Incidents and Investigations). Each row links to its
 * detail route, and its related-incident id links straight to that
 * incident (Phase 4).
 */
export function ApprovalTable({ approvals }: ApprovalTableProps) {
  return (
    <TableShell>
      <thead>
        <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Approval
          </th>
          <th scope="col" className="px-4 py-3">
            Requested Action
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Incident
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Affected System
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Risk
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Status
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Requested
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Expires
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {approvals.map((approval) => (
          <tr key={approval.id} className="transition-colors hover:bg-background">
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
              <Link
                href={`/approvals/${approval.id}`}
                className="font-medium text-accent hover:underline"
              >
                {approval.id}
              </Link>
            </td>
            <td className="px-4 py-3">
              <Link href={`/approvals/${approval.id}`} className="hover:underline">
                <span className="text-sm font-medium text-foreground">{approval.title}</span>
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
              <Link href={`/incidents/${approval.incidentId}`} className="text-muted hover:underline">
                {approval.incidentId}
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">{approval.affectedSystem}</td>
            <td className="whitespace-nowrap px-4 py-3">
              <ApprovalRiskBadge riskLevel={approval.riskLevel} />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <ApprovalStatusBadge status={approval.status} />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
              {formatRelativeToDemoNow(approval.requestedAt)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
              {approval.status === "pending" ? formatExpiry(approval.expiresAt) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
