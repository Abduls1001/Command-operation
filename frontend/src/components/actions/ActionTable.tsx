import Link from "next/link";

import { TableShell } from "@/components/ui/TableShell";
import type { Action, ActionStatus } from "@/lib/mock/actions";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

import { ActionRiskBadge } from "./ActionRiskBadge";
import { ActionStatusBadge } from "./ActionStatusBadge";
import { ActionVerificationBadge } from "./ActionVerificationBadge";

interface ActionTableProps {
  actions: Action[];
}

/**
 * A coloured left edge per row, so the five lifecycle states the summary
 * cards count (plus cancelled) are distinguishable at a glance without
 * reading each status badge. Deliberately uses the existing status
 * palette rather than introducing new colours.
 */
const STATUS_EDGE: Record<ActionStatus, string> = {
  pending_approval: "border-l-warning",
  approved: "border-l-accent",
  executing: "border-l-info",
  completed: "border-l-success",
  failed: "border-l-danger",
  cancelled: "border-l-border",
};

/** The most recent point an action actually reached, with a label saying
 * which point that is — more useful in a list than always showing the
 * request time for an action that finished twenty minutes later. */
function latestMilestone(action: Action): { label: string; iso: string } {
  if (action.completedAt) {
    return { label: action.status === "failed" ? "Failed" : "Completed", iso: action.completedAt };
  }
  if (action.startedAt) return { label: "Started", iso: action.startedAt };
  if (action.approvedAt) return { label: "Approved", iso: action.approvedAt };
  return { label: "Requested", iso: action.requestedAt };
}

/**
 * The Actions list, rendered inside the shared TableShell primitive (also
 * used by Incidents, Investigations, and Approvals). Each row links to its
 * detail route; the related incident id links straight into Phase 4's
 * incident detail.
 */
export function ActionTable({ actions }: ActionTableProps) {
  return (
    <TableShell>
      <thead>
        <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Action
          </th>
          <th scope="col" className="px-4 py-3">
            Title
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Incident
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Affected System
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Type
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Risk
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Status
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Verification
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Time
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {actions.map((action) => {
          const milestone = latestMilestone(action);

          return (
            <tr key={action.id} className="transition-colors hover:bg-background">
              <td
                className={`whitespace-nowrap border-l-4 px-4 py-3 font-mono text-xs ${STATUS_EDGE[action.status]}`}
              >
                <Link
                  href={`/actions/${action.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {action.id}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link href={`/actions/${action.id}`} className="hover:underline">
                  <span className="text-sm font-medium text-foreground">{action.title}</span>
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                <Link href={`/incidents/${action.incidentId}`} className="text-muted hover:underline">
                  {action.incidentId}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
                {action.affectedSystem}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">{action.actionType}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <ActionRiskBadge riskLevel={action.riskLevel} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <ActionStatusBadge status={action.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <ActionVerificationBadge status={action.verification.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
                {formatRelativeToDemoNow(milestone.iso)}
                <span className="mt-0.5 block text-xs text-muted">{milestone.label}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}
