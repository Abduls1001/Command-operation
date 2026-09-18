import { AiActivity } from "@/components/dashboard/AiActivity";
import { IncidentSummary } from "@/components/dashboard/IncidentSummary";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OperationalHealth } from "@/components/dashboard/OperationalHealth";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  ACTIVE_INCIDENTS,
  AI_ACTIVITY,
  KPI_METRICS,
  LAST_UPDATED,
  OPERATIONAL_HEALTH,
  SYSTEM_STATUS,
} from "@/lib/mock/dashboard";

/**
 * The Dashboard — the landing page and the place a problem is first
 * noticed (PROJECT_SPEC.md §6). Phase 3 replaces the Phase 2 placeholder
 * with real layout and static demo content.
 *
 * All data on this page is static mock data from lib/mock/dashboard.ts, per
 * DEVELOPMENT_PLAN.md's Phase 3 scope. No backend, database, or AI calls.
 */
export default function DashboardPage() {
  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Operations Dashboard</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Overall operational health, active incidents, system status, and current AI
            activity across NovaCommerce.
          </p>
        </div>
        <p className="text-xs text-muted">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_METRICS.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncidentSummary incidents={ACTIVE_INCIDENTS} />
        </div>
        <div className="flex flex-col gap-6">
          <OperationalHealth items={OPERATIONAL_HEALTH} />
          <AiActivity items={AI_ACTIVITY} />
        </div>
      </div>

      <div className="mt-6">
        <SystemStatus systems={SYSTEM_STATUS} />
      </div>
    </PageContainer>
  );
}
