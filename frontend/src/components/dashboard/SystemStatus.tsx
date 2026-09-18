import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { SystemStatusItem } from "@/lib/mock/dashboard";

import { SYSTEM_STATUS_LABEL, SYSTEM_STATUS_VARIANT } from "./statusStyles";

interface SystemStatusProps {
  systems: SystemStatusItem[];
}

/**
 * Detailed status for every NovaCommerce system (PROJECT_SPEC.md §3), one
 * card per system. This is the full picture; OperationalHealth above is the
 * quick-glance subset. Static demo data only — see lib/mock/dashboard.ts.
 */
export function SystemStatus({ systems }: SystemStatusProps) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">System Status</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {systems.map((system) => (
          <Card key={system.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{system.name}</p>
              <Badge variant={SYSTEM_STATUS_VARIANT[system.status]}>
                {SYSTEM_STATUS_LABEL[system.status]}
              </Badge>
            </div>
            <dl className="mt-3 space-y-1.5 text-xs text-muted">
              <div className="flex justify-between">
                <dt>Uptime (30d)</dt>
                <dd className="font-medium text-foreground">{system.uptime}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Response time</dt>
                <dd className="font-medium text-foreground">{system.responseTime}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Last checked</dt>
                <dd className="font-medium text-foreground">{system.lastChecked}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </section>
  );
}
