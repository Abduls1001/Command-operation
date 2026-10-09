import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "./page";

/**
 * Phase 16: the dashboard's Active Incidents come from GET /api/incidents/active, not from
 * static data. (Phase 15's dashboard tests live in page.test.tsx and are unchanged.)
 */

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const DAY = "2026-09-29T10:00:00";
const DASHBOARD_DATA: Record<string, unknown[]> = {
  "/api/orders": [
    { total: 100, status: "completed", created_at: DAY },
    { total: 50, status: "payment_failed", created_at: DAY },
  ],
  "/api/payments": [
    { status: "success", created_at: DAY },
    { status: "failed", created_at: DAY },
  ],
  "/api/complaints": [{ created_at: DAY }],
  "/api/health-metrics": [
    { system: "website", timestamp: DAY, status: "healthy", response_time_ms: 120, error_rate: 0.01 },
  ],
};

const BACKEND_INCIDENTS = [
  {
    id: "payment_failure_spike",
    title: "Payment failure spike",
    severity: "critical",
    status: "open",
    description: "25.8% of payments through PayFlow failed in the last 6 hours (8 of 31).",
    category: "payments",
    affected_system: "PayFlow",
    detected_at: "2026-09-29T11:47:15",
    evidence: [{ label: "Payment failure rate", value: "25.8% (8 of 31 payments)" }],
  },
  {
    id: "health_degraded_payment_gateway",
    title: "Payment Gateway is degraded",
    severity: "high",
    status: "open",
    description: "The latest health reading reports Payment Gateway as degraded.",
    category: "system_health",
    affected_system: "Payment Gateway",
    detected_at: "2026-09-29T11:47:15",
    evidence: [{ label: "Status", value: "degraded" }],
  },
  {
    id: "inventory_below_reorder",
    title: "Inventory below reorder level",
    severity: "high",
    status: "open",
    description: "2 products out of stock, 7 more at or below the reorder level.",
    category: "inventory",
    affected_system: "Inventory",
    detected_at: "2026-09-29T11:47:15",
    evidence: [{ label: "Out of stock", value: "Desk Lamp LED, Leather Wallet" }],
  },
];

type IncidentsHandler = () => Response | Promise<Response>;

function routeFetch(incidents: IncidentsHandler) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes("/api/incidents/active")) return incidents();
    if (url.includes("/api/agent/investigate")) {
      return jsonResponse({ question: "q", answer: "A.", tools_used: ["get_orders"] });
    }
    const path = Object.keys(DASHBOARD_DATA).find((p) => url.includes(p));
    return path ? jsonResponse(DASHBOARD_DATA[path]) : jsonResponse({ detail: "down" }, 503);
  });
}

function incidentCalls() {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/incidents/active"));
}

/** The KPI card whose label is "Active Incidents" (the panel heading shares the words). */
function activeIncidentsKpi() {
  const label = screen.getAllByText("Active Incidents").find((el) => el.tagName === "P");
  expect(label).toBeDefined();
  return within(label!.parentElement as HTMLElement);
}

/** The Active Incidents panel (the card containing the "Active Incidents" heading). */
function incidentsPanel() {
  const heading = screen.getByRole("heading", { name: "Active Incidents" });
  return within(heading.closest("div.rounded-lg") as HTMLElement);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Dashboard Active Incidents (Phase 16)", () => {
  it("displays the incidents detected by the backend instead of static data", async () => {
    routeFetch(() => jsonResponse(BACKEND_INCIDENTS));
    render(<DashboardPage />);

    expect(await screen.findByRole("heading", { name: "Payment failure spike" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Payment Gateway is degraded" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inventory below reorder level" })).toBeInTheDocument();
    expect(screen.getByText("Desk Lamp LED, Leather Wallet")).toBeInTheDocument();
    expect(screen.getByText("3 active")).toBeInTheDocument();
    expect(incidentCalls()).toHaveLength(1);
    expect(String(incidentCalls()[0][0])).toMatch(/\/api\/incidents\/active$/);

    // The former static demo incidents are gone from the panel. (The AI Activity feed
    // beside it is still static demo data and mentions INC-2031, so look only inside it.)
    const panel = incidentsPanel();
    expect(panel.getAllByRole("listitem")).toHaveLength(3);
    for (const staticText of [
      "Checkout success rate dropped sharply",
      "Elevated dispatch delays — West Coast warehouse",
      "Intermittent website 502s during traffic spike",
      "INC-2031",
      "INC-2030",
    ]) {
      expect(panel.queryByText(staticText)).not.toBeInTheDocument();
    }
    expect(screen.queryByText("Checkout success rate dropped sharply")).not.toBeInTheDocument();
  });

  it("drives the Active Incidents KPI card from the same data", async () => {
    routeFetch(() => jsonResponse(BACKEND_INCIDENTS));
    render(<DashboardPage />);
    await screen.findByRole("heading", { name: "Payment failure spike" });

    const kpi = activeIncidentsKpi();
    expect(kpi.getByText("3")).toBeInTheDocument();
    expect(kpi.getByText("1 critical, 2 high")).toBeInTheDocument();
    // The old static card said "+1 vs yesterday".
    expect(screen.queryByText("+1 vs yesterday")).not.toBeInTheDocument();
  });

  it("shows the loading state while incidents are being fetched", async () => {
    routeFetch(() => new Promise<Response>(() => {})); // never resolves
    render(<DashboardPage />);

    expect(await screen.findByText("Orders Today")).toBeInTheDocument();
    expect(screen.getByText("Loading active incidents…")).toBeInTheDocument();
    expect(activeIncidentsKpi().getByText("…")).toBeInTheDocument();
  });

  it("shows an empty state when no incidents are active", async () => {
    routeFetch(() => jsonResponse([]));
    render(<DashboardPage />);

    expect(await screen.findByRole("heading", { name: "No active incidents" })).toBeInTheDocument();
    expect(screen.getByText("0 active")).toBeInTheDocument();
    expect(activeIncidentsKpi().getByText("0")).toBeInTheDocument();
    expect(incidentsPanel().queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.queryByText("Checkout success rate dropped sharply")).not.toBeInTheDocument();
    expect(screen.queryByText("Could not load active incidents.")).not.toBeInTheDocument();
  });

  it("handles an incidents API failure without breaking the rest of the dashboard, and retries", async () => {
    const user = userEvent.setup();
    let failing = true;
    routeFetch(() =>
      failing ? jsonResponse({ detail: "Database is unavailable." }, 503) : jsonResponse(BACKEND_INCIDENTS),
    );
    render(<DashboardPage />);

    expect(await screen.findByText("Could not load active incidents.")).toBeInTheDocument();
    expect(screen.getByText(/HTTP 503\): Database is unavailable\./)).toBeInTheDocument();
    expect(activeIncidentsKpi().getByText("—")).toBeInTheDocument();
    // Everything else on the dashboard, including Phase 15's panel, is unaffected.
    expect(screen.getByText("Orders Today")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Operational Health" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI Investigation" })).toBeInTheDocument();
    expect(screen.queryByText("Could not load dashboard data.")).not.toBeInTheDocument();
    expect(screen.queryByText("Checkout success rate dropped sharply")).not.toBeInTheDocument();

    failing = false;
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Payment failure spike" })).toBeInTheDocument();
    expect(screen.queryByText("Could not load active incidents.")).not.toBeInTheDocument();
    expect(incidentCalls()).toHaveLength(2);
  });

  it("handles a network failure on the incidents request", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/api/incidents/active")) throw new TypeError("Failed to fetch");
      const path = Object.keys(DASHBOARD_DATA).find((p) => url.includes(p));
      return path ? jsonResponse(DASHBOARD_DATA[path]) : jsonResponse({ detail: "down" }, 503);
    });
    render(<DashboardPage />);

    expect(await screen.findByText("Could not load active incidents.")).toBeInTheDocument();
    expect(screen.getByText(/Could not reach the backend/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Orders Today")).toBeInTheDocument());
  });

  it("keeps the AI Investigation panel working next to the incidents", async () => {
    const user = userEvent.setup();
    routeFetch(() => jsonResponse(BACKEND_INCIDENTS));
    render(<DashboardPage />);
    await screen.findByRole("heading", { name: "Payment failure spike" });

    await user.type(screen.getByRole("textbox", { name: /your question/i }), "Why?");
    await user.click(screen.getByRole("button", { name: "Investigate" }));

    expect(await screen.findByText("A.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Payment failure spike" })).toBeInTheDocument();
  });
});
