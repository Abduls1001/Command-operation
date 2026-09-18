import type { SVGProps } from "react";

/**
 * Small line icons used by the sidebar and shell chrome.
 *
 * No icon library is installed in this project (Phase 1 introduced no such
 * dependency), and the task scope for Phase 2 says not to install a large one
 * unless necessary. These are hand-drawn, dependency-free SVGs in a
 * consistent 24x24 stroke style instead.
 */

type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.25" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.25" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.25" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.25" />
    </svg>
  );
}

export function IncidentsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <line x1="12" y1="9.5" x2="12" y2="14.5" />
      <circle cx="12" cy="17.25" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InvestigationsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" />
    </svg>
  );
}

export function ActionsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function ApprovalsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.6 2.6L16 9.5" />
    </svg>
  );
}

export function SystemsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3" y="4" width="18" height="5.5" rx="1.25" />
      <rect x="3" y="14.5" width="18" height="5.5" rx="1.25" />
      <circle cx="7" cy="6.75" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17.25" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KnowledgeBaseIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 5.5C4 4.67 4.67 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5V5.5Z" />
      <path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5c.83 0 1.5-.67 1.5-1.5V5.5Z" />
    </svg>
  );
}

export function AnalyticsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3.5" y="12" width="3" height="8" rx="0.5" />
      <rect x="10.5" y="7" width="3" height="13" rx="0.5" />
      <rect x="17.5" y="4" width="3" height="16" rx="0.5" />
    </svg>
  );
}

export function ReportsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M7 3.5h6.5l3.5 3.5v13.5H7Z" />
      <path d="M13.5 3.5v3.5H17" />
      <line x1="9.5" y1="12.5" x2="14.5" y2="12.5" />
      <line x1="9.5" y1="16" x2="14.5" y2="16" />
    </svg>
  );
}

export function AuditLogsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <rect x="9" y="2.5" width="6" height="3" rx="0.75" />
      <line x1="8.5" y1="10.5" x2="15.5" y2="10.5" />
      <line x1="8.5" y1="14" x2="15.5" y2="14" />
      <line x1="8.5" y1="17.5" x2="12.5" y2="17.5" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
    </svg>
  );
}

export function ChevronsLeftIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <polyline points="14 5 7.5 12 14 19" />
      <polyline points="19 5 12.5 12 19 19" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}
