/**
 * Client for the Phase 16 incident endpoint: GET /api/incidents/active.
 *
 * Contract (backend/app/api/schemas.py IncidentOut):
 *   response  Incident[], most severe first; [] when nothing is wrong
 *   errors    503 (database not configured / unavailable) with { "detail": string }
 *
 * Incidents are detected by deterministic rules on the backend (app/incidents/detection.py)
 * from the real NovaCommerce data. This module only fetches and validates them.
 */

// NEXT_PUBLIC_ values are public; this is only the backend address, not a secret.
// Same variable and default as the dashboard's data fetching and lib/api/agent.ts.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

export const ACTIVE_INCIDENTS_PATH = "/api/incidents/active";

export const INCIDENT_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = ["open", "investigating", "awaiting_approval", "resolved"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export interface IncidentEvidence {
  label: string;
  value: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  /** "payments" | "system_health" | "orders" | "inventory" | "complaints" */
  category: string;
  affected_system: string;
  /** Naive UTC timestamp, e.g. "2026-09-29T11:47:15". */
  detected_at: string;
  evidence: IncidentEvidence[];
}

export type IncidentsErrorKind = "http" | "network" | "invalid_response";

export class IncidentsError extends Error {
  readonly kind: IncidentsErrorKind;
  readonly status?: number;

  constructor(kind: IncidentsErrorKind, message: string, status?: number) {
    super(message);
    this.name = "IncidentsError";
    this.kind = kind;
    this.status = status;
  }
}

const MAX_DETAIL_CHARS = 300;

/** Pulls a short human-readable message out of a FastAPI error body, if there is one. */
function extractDetail(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("detail" in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail !== "string") return null;
  const text = detail.trim();
  if (!text) return null;
  return text.length > MAX_DETAIL_CHARS ? `${text.slice(0, MAX_DETAIL_CHARS)}…` : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOneOf<T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function parseIncident(raw: unknown): Incident | null {
  if (!isRecord(raw)) return null;
  const { id, title, severity, status, description, category, affected_system, detected_at, evidence } =
    raw;
  if (
    typeof id !== "string" ||
    id === "" ||
    typeof title !== "string" ||
    !isOneOf(INCIDENT_SEVERITIES, severity) ||
    !isOneOf(INCIDENT_STATUSES, status) ||
    typeof description !== "string" ||
    typeof category !== "string" ||
    typeof affected_system !== "string" ||
    typeof detected_at !== "string" ||
    !Array.isArray(evidence)
  ) {
    return null;
  }
  const parsedEvidence: IncidentEvidence[] = [];
  for (const item of evidence) {
    if (!isRecord(item) || typeof item.label !== "string" || typeof item.value !== "string") {
      return null;
    }
    parsedEvidence.push({ label: item.label, value: item.value });
  }
  return {
    id,
    title,
    severity,
    status,
    description,
    category,
    affected_system,
    detected_at,
    evidence: parsedEvidence,
  };
}

function parseIncidents(body: unknown): Incident[] {
  if (Array.isArray(body)) {
    const incidents: Incident[] = [];
    for (const raw of body) {
      const incident = parseIncident(raw);
      // One malformed record fails the whole response: silently dropping it could hide
      // a real incident, and the dashboard can show an error with a retry instead.
      if (!incident) break;
      incidents.push(incident);
    }
    if (incidents.length === body.length) return incidents;
  }
  throw new IncidentsError(
    "invalid_response",
    "The server returned an unexpected response, so incidents cannot be shown.",
  );
}

/** Fetches the currently active incidents and validates the response shape. */
export async function fetchActiveIncidents(
  options: { signal?: AbortSignal } = {},
): Promise<Incident[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${ACTIVE_INCIDENTS_PATH}`, {
      headers: { Accept: "application/json" },
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new IncidentsError(
      "network",
      "Could not reach the backend. Check that it is running and try again.",
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const detail = extractDetail(body);
    const prefix = `Incident detection failed (HTTP ${response.status})`;
    throw new IncidentsError("http", detail ? `${prefix}: ${detail}` : `${prefix}.`, response.status);
  }

  return parseIncidents(body);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-09-29T11:47:15" -> "29 Sep 2026, 11:47 UTC". The backend sends naive UTC, so this
 * formats the string directly instead of going through Date, which would silently
 * reinterpret it in the viewer's time zone. Unrecognised input is returned unchanged.
 */
export function formatDetectedAt(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day, hour, minute] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return iso;
  return `${Number(day)} ${monthName} ${year}, ${hour}:${minute} UTC`;
}
