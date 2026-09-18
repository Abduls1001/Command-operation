import { Card } from "@/components/ui/Card";
import type { OperationalHealthItem } from "@/lib/mock/dashboard";

import { SYSTEM_STATUS_LABEL } from "./statusStyles";

const DOT_CLASS: Record<OperationalHealthItem["status"], string> = {
  operational: "bg-success",
  degraded: "bg-warning",
  investigating: "bg-info",
  outage: "bg-danger",
};

interface OperationalHealthProps {
  items: OperationalHealthItem[];
}

/**
 * Compact "at a glance" strip for the handful of systems most likely to
 * explain whatever the KPI cards are flagging. Deliberately smaller and
 * quieter than the full System Status panel below it, which lists every
 * NovaCommerce system with more detail.
 */
export function OperationalHealth({ items }: OperationalHealthProps) {
  return (
    <Card className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">Operational Health</h3>
      <ul className="mt-3 divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${DOT_CLASS[item.status]}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {item.name}
                <span className="ml-2 text-xs font-normal text-muted">
                  {SYSTEM_STATUS_LABEL[item.status]}
                </span>
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
