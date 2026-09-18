import Link from "next/link";

import { TableShell } from "@/components/ui/TableShell";
import type { Incident } from "@/lib/mock/incidents";
import { formatRelativeToDemoNow } from "@/lib/mock/incidents";

import { IncidentSeverityBadge } from "./IncidentSeverityBadge";
import { IncidentStatusBadge } from "./IncidentStatusBadge";

interface IncidentTableProps {
  incidents: Incident[];
}

/**
 * The Incidents list, rendered inside the shared TableShell primitive
 * (built in Phase 2 with no consumer until now — see CURRENT_STATE.md).
 * Each row links to the incident's detail route. Horizontal scroll (from
 * TableShell) keeps this from breaking the layout on narrow screens rather
 * than trying to reflow eight columns into a card grid.
 */
export function IncidentTable({ incidents }: IncidentTableProps) {
  return (
    <TableShell>
      <thead>
        <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            ID
          </th>
          <th scope="col" className="px-4 py-3">
            Title
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Severity
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Status
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Affected System
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Source
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Created
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Updated
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {incidents.map((incident) => (
          <tr key={incident.id} className="transition-colors hover:bg-background">
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
              <Link
                href={`/incidents/${incident.id}`}
                className="font-medium text-accent hover:underline"
              >
                {incident.id}
              </Link>
            </td>
            <td className="px-4 py-3">
              <Link href={`/incidents/${incident.id}`} className="hover:underline">
                <span className="text-sm font-medium text-foreground">{incident.title}</span>
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <IncidentSeverityBadge severity={incident.severity} />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <IncidentStatusBadge status={incident.status} />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
              {incident.affectedSystem}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">{incident.source}</td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
              {formatRelativeToDemoNow(incident.createdAt)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
              {formatRelativeToDemoNow(incident.updatedAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
