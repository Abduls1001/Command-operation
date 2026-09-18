import type { BadgeVariant } from "@/components/ui/Badge";
import type {
  IncidentSeverity,
  IncidentStatus,
  SystemStatusLevel,
} from "@/lib/mock/dashboard";

/**
 * Central mapping from domain-level status/severity values to the Badge's
 * visual variants. Kept in one place so every dashboard component reads the
 * same colors for the same meaning, rather than each inventing its own.
 */

export const SYSTEM_STATUS_VARIANT: Record<SystemStatusLevel, BadgeVariant> = {
  operational: "success",
  degraded: "warning",
  investigating: "info",
  outage: "danger",
};

export const SYSTEM_STATUS_LABEL: Record<SystemStatusLevel, string> = {
  operational: "Operational",
  degraded: "Degraded",
  investigating: "Investigating",
  outage: "Outage",
};

export const SEVERITY_VARIANT: Record<IncidentSeverity, BadgeVariant> = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
};

export const INCIDENT_STATUS_VARIANT: Record<IncidentStatus, BadgeVariant> = {
  open: "danger",
  investigating: "info",
  awaiting_approval: "warning",
  resolved: "success",
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  awaiting_approval: "Awaiting Approval",
  resolved: "Resolved",
};
