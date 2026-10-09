/**
 * A small, deliberately tiny shared helper: the fixed "current moment" every
 * phase's demo data is written against, plus a pure formatter for turning an
 * ISO timestamp into a relative label ("22 minutes ago") against that fixed
 * instant rather than the real clock.
 *
 * lib/mock/incidents.ts (Phase 4) already has its own copy of this same
 * logic. It is intentionally not imported from here — Phase 5's file
 * boundary says not to modify Phase 4 files unnecessarily, so rather than
 * refactor incidents.ts to depend on this module, this module simply
 * duplicates the same fixed instant. Both copies use the identical ISO
 * string, so the two pages still agree on "now." See CURRENT_STATE.md for
 * this noted as a small, deliberate duplication.
 */

export const DEMO_NOW = new Date("2026-09-18T09:42:00Z");

export function formatRelativeToDemoNow(iso: string): string {
  const date = new Date(iso);
  const diffMs = DEMO_NOW.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const startOfToday = new Date(DEMO_NOW);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setUTCHours(0, 0, 0, 0);
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  if (dayDiff === 1) return `Yesterday at ${time}`;
  if (dayDiff < 7) return `${dayDiff} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Formats an ISO timestamp as a clock time only (used inside the timeline). */
export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}
