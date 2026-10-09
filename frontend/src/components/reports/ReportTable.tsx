import Link from "next/link";

import { TableShell } from "@/components/ui/TableShell";
import type { Report } from "@/lib/mock/reports";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

import { ReportOutcomeBadge, ReportStatusBadge } from "./ReportStatusBadge";
import { ReportSeverityBadge } from "./ReportSeverityBadge";

interface ReportTableProps {
  reports: Report[];
}

/**
 * The Reports list, on the same TableShell primitive Incidents,
 * Investigations, Approvals, and Actions use. Root cause is shown as its
 * one-line summary — the full explanation lives in the detail view, so the
 * list stays readable.
 */
export function ReportTable({ reports }: ReportTableProps) {
  return (
    <TableShell>
      <thead>
        <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Report
          </th>
          <th scope="col" className="px-4 py-3">
            Title
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Incident
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Severity
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Status
          </th>
          <th scope="col" className="px-4 py-3">
            Root Cause
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Outcome
          </th>
          <th scope="col" className="whitespace-nowrap px-4 py-3">
            Created
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {reports.map((report) => (
          <tr key={report.id} className="transition-colors hover:bg-background">
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
              <Link href={`/reports/${report.id}`} className="font-medium text-accent hover:underline">
                {report.id}
              </Link>
            </td>
            <td className="px-4 py-3">
              <Link href={`/reports/${report.id}`} className="hover:underline">
                <span className="text-sm font-medium text-foreground">{report.title}</span>
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
              <Link href={`/incidents/${report.incidentId}`} className="text-muted hover:underline">
                {report.incidentId}
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <ReportSeverityBadge severity={report.severity} />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <ReportStatusBadge status={report.status} />
            </td>
            <td className="px-4 py-3 text-sm text-muted">
              {report.rootCause ? report.rootCause.summary : "Not established"}
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <ReportOutcomeBadge outcome={report.outcome} />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
              {formatRelativeToDemoNow(report.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
