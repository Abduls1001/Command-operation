"use client";

import { useEffect, useState } from "react";

import { AiActivity } from "@/components/dashboard/AiActivity";
import { AiInvestigationPanel } from "@/components/dashboard/AiInvestigationPanel";
import { IncidentSummary } from "@/components/dashboard/IncidentSummary";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OperationalHealth } from "@/components/dashboard/OperationalHealth";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { useActiveIncidents, type IncidentsState } from "@/components/dashboard/useActiveIncidents";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  AI_ACTIVITY,
  OPERATIONAL_HEALTH,
  SYSTEM_STATUS,
  type KpiMetric,
  type OperationalHealthItem,
} from "@/lib/mock/dashboard";

/**
 * The Dashboard — the landing page and the place a problem is first
 * noticed (PROJECT_SPEC.md §6).
 *
 * Phase 13: the KPI cards (orders, revenue, system health) and the
 * Operational Health strip now use real data from the FastAPI backend
 * (/api/orders, /api/payments, /api/complaints, /api/health-metrics), fetched
 * with native fetch().
 *
 * Phase 16: Active Incidents (the panel and its KPI card) now come from the
 * backend's incident detection (/api/incidents/active), loaded independently of
 * the data above. Sections with no backend API yet (AI activity, system status)
 * remain static demo data from lib/mock/dashboard.ts.
 */

// NEXT_PUBLIC_ values are public; this is only the backend address, not a secret.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// The API pages results (default 50). 2000 is the backend's maximum and covers the
// whole simulated dataset in one request.
const PAGE_LIMIT = 2000;

interface ApiOrder {
  total: number;
  status: string;
  created_at: string;
}

interface ApiPayment {
  status: string;
  created_at: string;
}

interface ApiComplaint {
  created_at: string;
}

interface ApiHealthMetric {
  system: string;
  timestamp: string;
  status: string;
  response_time_ms: number;
  error_rate: number;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}?limit=${PAGE_LIMIT}`);
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

/** Health-metric system names (backend) for each Operational Health row (mock ids). */
const HEALTH_SYSTEM_BY_ID: Record<string, string> = {
  payments: "payment_gateway",
  website: "website",
  "order-processing": "order_processing",
  inventory: "inventory_sync",
};

interface DashboardData {
  kpis: KpiMetric[];
  health: OperationalHealthItem[];
  updatedAt: string;
}

/**
 * Turns the raw API rows into the shapes the existing Dashboard components take.
 * "Today" is the most recent day present in the orders data, because the
 * simulated dataset ends on a fixed date rather than the real current date.
 */
function buildDashboardData(
  orders: ApiOrder[],
  payments: ApiPayment[],
  complaints: ApiComplaint[],
  metrics: ApiHealthMetric[],
): DashboardData {
  const dayOf = (iso: string) => iso.slice(0, 10);
  const latestDay = orders.reduce((max, o) => (dayOf(o.created_at) > max ? dayOf(o.created_at) : max), "");

  const todaysOrders = orders.filter((o) => dayOf(o.created_at) === latestDay);
  const completedOrders = todaysOrders.filter((o) => o.status === "completed");
  const failedOrders = todaysOrders.length - completedOrders.length;
  const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

  const todaysPayments = payments.filter((p) => dayOf(p.created_at) === latestDay);
  const failedPayments = todaysPayments.filter((p) => p.status === "failed").length;
  const failureRate = todaysPayments.length ? (failedPayments / todaysPayments.length) * 100 : 0;
  const elevatedFailures = failureRate > 5;

  const todaysComplaints = complaints.filter((c) => dayOf(c.created_at) === latestDay).length;

  // Latest reading per system.
  const latestBySystem = new Map<string, ApiHealthMetric>();
  for (const metric of metrics) {
    const current = latestBySystem.get(metric.system);
    if (!current || metric.timestamp > current.timestamp) latestBySystem.set(metric.system, metric);
  }
  const readings = Array.from(latestBySystem.values());
  const healthyCount = readings.filter((r) => r.status === "healthy").length;
  const healthPercent = readings.length ? Math.round((healthyCount / readings.length) * 100) : 0;
  const allHealthy = healthyCount === readings.length;

  const kpis: KpiMetric[] = [
    {
      id: "revenue-today",
      label: "Revenue Today",
      value: `$${Math.round(revenue).toLocaleString("en-US")}`,
      trend: elevatedFailures ? "down" : "flat",
      delta: `${failureRate.toFixed(1)}% payment failure rate`,
      tone: elevatedFailures ? "negative" : "positive",
    },
    {
      id: "orders-today",
      label: "Orders Today",
      value: todaysOrders.length.toLocaleString("en-US"),
      trend: elevatedFailures ? "down" : "flat",
      delta: `${completedOrders.length} completed, ${failedOrders} payment failed`,
      tone: elevatedFailures ? "negative" : "positive",
    },
    {
      id: "system-health",
      label: "System Health",
      value: `${healthPercent}%`,
      trend: allHealthy ? "flat" : "down",
      delta: `${healthyCount} of ${readings.length} systems healthy`,
      tone: allHealthy ? "positive" : "neutral",
    },
  ];

  const health: OperationalHealthItem[] = OPERATIONAL_HEALTH.map((item) => {
    const reading = latestBySystem.get(HEALTH_SYSTEM_BY_ID[item.id]);
    if (!reading) return item;
    const detail =
      item.id === "order-processing"
        ? `${completedOrders.length} of ${todaysOrders.length} orders completed, ${todaysComplaints} complaints`
        : `${(reading.error_rate * 100).toFixed(1)}% error rate, ${reading.response_time_ms} ms`;
    return {
      ...item,
      status: reading.status === "healthy" ? "operational" : "degraded",
      detail,
    };
  });

  return {
    kpis,
    health,
    updatedAt: `Today at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
  };
}

const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;

/** The Active Incidents KPI card, from the same backend incidents the panel lists. */
function buildActiveIncidentsKpi(state: IncidentsState): KpiMetric {
  const base = { id: "active-incidents", label: "Active Incidents", trend: "flat" as const };
  if (state.status === "loading") {
    return { ...base, value: "…", delta: "Checking for incidents", tone: "neutral" };
  }
  if (state.status === "error") {
    return { ...base, value: "—", delta: "Incident data unavailable", tone: "neutral" };
  }
  if (state.incidents.length === 0) {
    return { ...base, value: "0", delta: "No active incidents", tone: "positive" };
  }
  const breakdown = SEVERITY_ORDER.map((severity) => ({
    severity,
    count: state.incidents.filter((i) => i.severity === severity).length,
  }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.count} ${entry.severity}`)
    .join(", ");
  return { ...base, value: String(state.incidents.length), delta: breakdown, tone: "negative" };
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardData };

export default function DashboardPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const { state: incidentsState, retry: retryIncidents } = useActiveIncidents();

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchJson<ApiOrder[]>("/api/orders"),
      fetchJson<ApiPayment[]>("/api/payments"),
      fetchJson<ApiComplaint[]>("/api/complaints"),
      fetchJson<ApiHealthMetric[]>("/api/health-metrics"),
    ])
      .then(([orders, payments, complaints, metrics]) => {
        if (!cancelled) {
          setState({
            status: "ready",
            data: buildDashboardData(orders, payments, complaints, metrics),
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }

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
        {state.status === "ready" && (
          <p className="text-xs text-muted">Last updated: {state.data.updatedAt}</p>
        )}
      </div>

      {state.status === "loading" && (
        <Card className="p-6 text-sm text-muted">
          <p role="status">Loading dashboard data…</p>
        </Card>
      )}

      {state.status === "error" && (
        <Card className="p-6">
          <p role="alert" className="text-sm font-medium text-danger">
            Could not load dashboard data.
          </p>
          <p className="mt-1 text-sm text-muted">{state.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Retry
          </button>
        </Card>
      )}

      {state.status === "ready" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[buildActiveIncidentsKpi(incidentsState), ...state.data.kpis].map((metric) => (
              <KpiCard key={metric.id} metric={metric} />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <IncidentSummary state={incidentsState} onRetry={retryIncidents} />
            </div>
            <div className="flex flex-col gap-6">
              <OperationalHealth items={state.data.health} />
              <AiActivity items={AI_ACTIVITY} />
            </div>
          </div>

          <div className="mt-6">
            <SystemStatus systems={SYSTEM_STATUS} />
          </div>
        </>
      )}

      {/* Independent of the data fetch above: works (and fails) on its own. */}
      <div className="mt-6">
        <AiInvestigationPanel />
      </div>
    </PageContainer>
  );
}
