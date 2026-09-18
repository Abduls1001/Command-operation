import type { ComponentType, SVGProps } from "react";

import {
  ActionsIcon,
  AnalyticsIcon,
  ApprovalsIcon,
  AuditLogsIcon,
  DashboardIcon,
  IncidentsIcon,
  InvestigationsIcon,
  KnowledgeBaseIcon,
  ReportsIcon,
  SettingsIcon,
  SystemsIcon,
} from "./icons";

/**
 * The eleven pages of the application, per PROJECT_SPEC.md §6.
 *
 * This is the single place that defines the site's navigation. The Sidebar
 * renders from it, the Header derives the current page title from it, and
 * each route's placeholder page pulls its description from it — so there is
 * one list to update, not several that can drift apart.
 */

export interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description:
      "Overall operational health, active incidents, system status, and current AI activity.",
    icon: DashboardIcon,
  },
  {
    label: "Incidents",
    href: "/incidents",
    description:
      "The record of business problems, detected or reported — the organising object of the system.",
    icon: IncidentsIcon,
  },
  {
    label: "Investigations",
    href: "/investigations",
    description:
      "How the AI worked a given incident: the step-by-step timeline, evidence, and root cause.",
    icon: InvestigationsIcon,
  },
  {
    label: "Actions",
    href: "/actions",
    description: "Actions recommended or executed by the AI, and their outcomes.",
    icon: ActionsIcon,
  },
  {
    label: "Approvals",
    href: "/approvals",
    description: "The human-in-the-loop queue for actions that require authorisation.",
    icon: ApprovalsIcon,
  },
  {
    label: "Systems & Tools",
    href: "/systems",
    description: "The business systems NovaCommerce runs and the tools the agent can invoke.",
    icon: SystemsIcon,
  },
  {
    label: "Knowledge Base",
    href: "/knowledge-base",
    description: "Company documentation, policies, and operational runbooks.",
    icon: KnowledgeBaseIcon,
  },
  {
    label: "Analytics",
    href: "/analytics",
    description: "Operational metrics and AI performance over time.",
    icon: AnalyticsIcon,
  },
  {
    label: "Reports",
    href: "/reports",
    description: "Final investigation and resolution reports — the durable record of a closed incident.",
    icon: ReportsIcon,
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    description: "Chronological record of significant system, user, and AI activity.",
    icon: AuditLogsIcon,
  },
  {
    label: "Settings",
    href: "/settings",
    description: "Application configuration, users, permissions, and thresholds.",
    icon: SettingsIcon,
  },
];
