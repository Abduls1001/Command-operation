import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IncidentsError, type Incident } from "@/lib/api/incidents";

import { IncidentSummary } from "./IncidentSummary";
import type { IncidentsState } from "./useActiveIncidents";

const PAYMENTS: Incident = {
  id: "payment_failure_spike",
  title: "Payment failure spike",
  severity: "critical",
  status: "open",
  description: "25.8% of payments through PayFlow failed in the last 6 hours (8 of 31).",
  category: "payments",
  affected_system: "PayFlow",
  detected_at: "2026-09-29T11:47:15",
  evidence: [
    { label: "Payment failure rate", value: "25.8% (8 of 31 payments)" },
    { label: "Top failure reasons", value: "gateway_timeout x6, gateway_5xx x2" },
  ],
};

const INVENTORY: Incident = {
  id: "inventory_below_reorder",
  title: "Inventory below reorder level",
  severity: "high",
  status: "open",
  description: "2 products out of stock, 7 more at or below the reorder level.",
  category: "inventory",
  affected_system: "Inventory",
  detected_at: "2026-09-29T11:47:15",
  evidence: [{ label: "Out of stock", value: "Desk Lamp LED, Leather Wallet" }],
};

function renderPanel(state: IncidentsState, onRetry = vi.fn()) {
  render(<IncidentSummary state={state} onRetry={onRetry} />);
  return onRetry;
}

describe("IncidentSummary", () => {
  it("shows each detected incident with severity, status, system, time and evidence", () => {
    renderPanel({ status: "ready", incidents: [PAYMENTS, INVENTORY] });

    expect(screen.getByRole("heading", { name: "Active Incidents" })).toBeInTheDocument();
    expect(screen.getByText("2 active")).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);

    const first = within(items[0]);
    expect(first.getByRole("heading", { name: "Payment failure spike" })).toBeInTheDocument();
    expect(first.getByText("Critical")).toBeInTheDocument();
    expect(first.getByText("Open")).toBeInTheDocument();
    expect(first.getByText("PayFlow")).toBeInTheDocument();
    expect(first.getByText("Detected 29 Sep 2026, 11:47 UTC")).toBeInTheDocument();
    expect(first.getByText(/25\.8% of payments through PayFlow failed/)).toBeInTheDocument();
    expect(first.getByText("Payment failure rate")).toBeInTheDocument();
    expect(first.getByText("25.8% (8 of 31 payments)")).toBeInTheDocument();
    expect(first.getByText("gateway_timeout x6, gateway_5xx x2")).toBeInTheDocument();

    const second = within(items[1]);
    expect(second.getByText("High")).toBeInTheDocument();
    expect(second.getByText("Desk Lamp LED, Leather Wallet")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    renderPanel({ status: "loading" });
    expect(screen.getByRole("status")).toHaveTextContent("Loading active incidents");
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no active incidents", () => {
    renderPanel({ status: "ready", incidents: [] });
    expect(screen.getByText("No active incidents")).toBeInTheDocument();
    expect(screen.getByText("0 active")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error and a Retry button that calls onRetry", async () => {
    const user = userEvent.setup();
    const onRetry = renderPanel({
      status: "error",
      error: new IncidentsError("http", "Incident detection failed (HTTP 503): Database is unavailable.", 503),
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Could not load active incidents.");
    expect(screen.getByText(/HTTP 503/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders backend text as plain text, never as HTML", () => {
    renderPanel({
      status: "ready",
      incidents: [
        {
          ...PAYMENTS,
          title: '<img src=x onerror="alert(1)"> Payment failure spike',
          evidence: [{ label: "<b>Rate</b>", value: "<script>alert(1)</script>" }],
        },
      ],
    });

    expect(document.querySelector("img, script, b")).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
  });
});
