import Link from "next/link";

import type { Investigation } from "@/lib/mock/investigations";
import { formatRelativeToDemoNow } from "@/lib/mock/time";

import { InvestigationStageBadge } from "./InvestigationStageBadge";
import { InvestigationStatusBadge } from "./InvestigationStatusBadge";

interface InvestigationHeaderProps {
  investigation: Investigation;
}

/**
 * Detail-page header: id, title, related incident, status/stage badges,
 * and started/updated times. The related-incident link is the one place
 * this page reaches back into the Incidents domain (Phase 4).
 */
export function InvestigationHeader({ investigation }: InvestigationHeaderProps) {
  return (
    <div>
      <Link
        href="/investigations"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        &larr; Back to Investigations
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-medium text-muted">{investigation.id}</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">{investigation.title}</h2>
          <p className="mt-1 text-sm text-muted">
            Related incident:{" "}
            <Link
              href={`/incidents/${investigation.incidentId}`}
              className="font-mono font-medium text-accent hover:underline"
            >
              {investigation.incidentId}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InvestigationStatusBadge status={investigation.status} />
          <InvestigationStageBadge stage={investigation.stage} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:w-auto sm:auto-cols-max sm:grid-flow-col">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Started</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatRelativeToDemoNow(investigation.startedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Last Updated</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatRelativeToDemoNow(investigation.updatedAt)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
