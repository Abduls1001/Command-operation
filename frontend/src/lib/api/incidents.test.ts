import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACTIVE_INCIDENTS_PATH,
  IncidentsError,
  fetchActiveIncidents,
  formatDetectedAt,
} from "./incidents";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const INCIDENT = {
  id: "payment_failure_spike",
  title: "Payment failure spike",
  severity: "critical",
  status: "open",
  description: "25.8% of payments through PayFlow failed in the last 6 hours (8 of 31).",
  category: "payments",
  affected_system: "PayFlow",
  detected_at: "2026-09-29T11:47:15",
  evidence: [{ label: "Payment failure rate", value: "25.8% (8 of 31 payments)" }],
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchActiveIncidents", () => {
  it("requests the active incidents endpoint with GET and returns the incidents", async () => {
    fetchMock.mockResolvedValue(jsonResponse([INCIDENT]));

    const incidents = await fetchActiveIncidents();

    expect(incidents).toEqual([INCIDENT]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(new RegExp(`${ACTIVE_INCIDENTS_PATH}$`));
    expect(ACTIVE_INCIDENTS_PATH).toBe("/api/incidents/active");
    expect(init?.method ?? "GET").toBe("GET");
  });

  it("returns an empty list when the backend detects nothing", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    expect(await fetchActiveIncidents()).toEqual([]);
  });

  it("turns an HTTP error into an IncidentsError with the backend's detail", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Database is unavailable." }, 503));

    const error = await fetchActiveIncidents().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(IncidentsError);
    const failure = error as IncidentsError;
    expect(failure.kind).toBe("http");
    expect(failure.status).toBe(503);
    expect(failure.message).toContain("HTTP 503");
    expect(failure.message).toContain("Database is unavailable.");
  });

  it("handles an HTTP error whose body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

    const error = (await fetchActiveIncidents().catch((e: unknown) => e)) as IncidentsError;

    expect(error.kind).toBe("http");
    expect(error.message).toContain("HTTP 502");
  });

  it("turns a network failure into an IncidentsError", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = (await fetchActiveIncidents().catch((e: unknown) => e)) as IncidentsError;

    expect(error).toBeInstanceOf(IncidentsError);
    expect(error.kind).toBe("network");
  });

  it("lets an aborted request propagate as an AbortError", async () => {
    fetchMock.mockRejectedValue(new DOMException("aborted", "AbortError"));
    await expect(fetchActiveIncidents()).rejects.toMatchObject({ name: "AbortError" });
  });

  it.each([
    ["an object instead of a list", { incidents: [INCIDENT] }],
    ["null", null],
    ["an incident missing a field", [{ ...INCIDENT, title: undefined }]],
    ["an unknown severity", [{ ...INCIDENT, severity: "catastrophic" }]],
    ["an unknown status", [{ ...INCIDENT, status: "snoozed" }]],
    ["malformed evidence", [{ ...INCIDENT, evidence: [{ label: "x" }] }]],
    ["one bad incident among good ones", [INCIDENT, { id: 5 }]],
  ])("rejects %s as an invalid response", async (_name, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));

    const error = (await fetchActiveIncidents().catch((e: unknown) => e)) as IncidentsError;

    expect(error).toBeInstanceOf(IncidentsError);
    expect(error.kind).toBe("invalid_response");
  });
});

describe("formatDetectedAt", () => {
  it("formats the backend's naive UTC timestamp without shifting time zones", () => {
    expect(formatDetectedAt("2026-09-29T11:47:15")).toBe("29 Sep 2026, 11:47 UTC");
    expect(formatDetectedAt("2026-01-05T00:05:00")).toBe("5 Jan 2026, 00:05 UTC");
  });

  it("returns unrecognised input unchanged", () => {
    expect(formatDetectedAt("yesterday")).toBe("yesterday");
    expect(formatDetectedAt("2026-13-01T00:00:00")).toBe("2026-13-01T00:00:00");
  });
});
