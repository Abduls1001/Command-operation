import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "./page";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const DAY = "2026-09-01T10:00:00";
const DATA: Record<string, unknown[]> = {
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

/** Routes the dashboard's data requests and the agent request independently. */
function routeFetch(options: { dashboardOk?: boolean; agent?: () => Response } = {}) {
  const { dashboardOk = true, agent } = options;
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes("/api/agent/investigate")) {
      return agent ? agent() : jsonResponse({ question: "q", answer: "A.", tools_used: ["get_orders"] });
    }
    const path = Object.keys(DATA).find((p) => url.includes(p));
    if (!dashboardOk || !path) return jsonResponse({ detail: "down" }, 503);
    return jsonResponse(DATA[path]);
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DashboardPage with the AI Investigation panel", () => {
  it("keeps the existing real-data dashboard and adds the panel", async () => {
    routeFetch();
    render(<DashboardPage />);

    expect(await screen.findByText("Orders Today")).toBeInTheDocument();
    expect(screen.getByText("Revenue Today")).toBeInTheDocument();
    expect(screen.getByText("System Health")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Operational Health" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI Activity" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI Investigation" })).toBeInTheDocument();

    const requested = fetchMock.mock.calls.map(([url]) => String(url));
    for (const path of Object.keys(DATA)) {
      expect(requested.some((u) => u.includes(`${path}?limit=2000`))).toBe(true);
    }
    expect(requested.some((u) => u.includes("/api/agent/investigate"))).toBe(false);
  });

  it("still shows the panel when the dashboard data fails to load", async () => {
    routeFetch({ dashboardOk: false });
    render(<DashboardPage />);

    expect(await screen.findByText("Could not load dashboard data.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI Investigation" })).toBeInTheDocument();
  });

  it("keeps the dashboard intact when the AI service fails", async () => {
    const user = userEvent.setup();
    routeFetch({ agent: () => jsonResponse({ detail: "LLM request failed: APIError" }, 502) });
    render(<DashboardPage />);
    await screen.findByText("Orders Today");

    await user.type(screen.getByRole("textbox", { name: /your question/i }), "Why?");
    await user.click(screen.getByRole("button", { name: "Investigate" }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.some((a) => a.textContent?.includes("HTTP 502"))).toBe(true);
    expect(screen.getByText("Orders Today")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Operational Health" })).toBeInTheDocument();
    expect(screen.queryByText("Could not load dashboard data.")).not.toBeInTheDocument();
  });

  it("shows an answer from the dashboard page end to end (mocked HTTP)", async () => {
    const user = userEvent.setup();
    routeFetch();
    render(<DashboardPage />);
    await screen.findByText("Orders Today");

    await user.type(screen.getByRole("textbox", { name: /your question/i }), "Why?");
    await user.click(screen.getByRole("button", { name: "Investigate" }));

    expect(await screen.findByText("A.")).toBeInTheDocument();
    expect(screen.getByText("get_orders")).toBeInTheDocument();
  });
});
