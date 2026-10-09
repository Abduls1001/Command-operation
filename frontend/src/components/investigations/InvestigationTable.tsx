import Link from "next/link";

import { TableShell } from "@/components/ui/TableShell";
import type { Investigation } from "@/lib/mock/investigations";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

import { ConfidenceBadge, InvestigationStageBadge } from "./InvestigationStageBadge";
import { InvestigationStatusBadge } from "./InvestigationStatusBadge";

interface InvestigationTableProps {
  investigations: Investigation[];
}

/**
 * The Investigations list, rendered inside the shared TableShell primitive
 * (also used by Incidents in Phase 4). Each row links to its detail route,
 * and its related-incident id links straight to that incident (Phase 4).
 */
export function InvestigationTable({ investigations }: InvestigationTableProps) {
  return (
    <TableShell>
      <thead>
        <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Investigation
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Incident
          </th>
          <th scope="col" className="px-4 py-3">
            Title
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Status
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Stage
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Confidence
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Started
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Updated
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {investigations.map((investigation) => (
          <tr key={investigation.id} className="transition-colors hover:bg-background">
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
              <Link
                href={`/investigations/${investigation.id}`}
                className="font-medium text-accent hover:underline"
              >
                {investigation.id}
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
              <Link href={`/incidents/${investigation.incidentId}`} className="text-muted hover:underline">
                {investigation.incidentId}
              </Link>
            </td>
            <td className="px-4 py-3">
              <Link href={`/investigations/${investigation.id}`} className="hover:underline">
                <span className="text-sm font-medium text-foreground">{investigation.title}</span>
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <InvestigationStatusBadge status={investigation.status} />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <InvestigationStageBadge stage={investigation.stage} />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              {investigation.confidence ? (
                <ConfidenceBadge confidence={investigation.confidence} />
              ) : (
                <span className="text-xs text-muted">—</span>
              )}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
              {formatRelativeToDemoNow(investigation.startedAt)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
              {formatRelativeToDemoNow(investigation.updatedAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
