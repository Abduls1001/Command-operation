"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronsLeftIcon } from "./icons";
import { NAV_ITEMS } from "./navigation";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * Left navigation. Fixed-dark theme independent of the content area — see
 * the note at the top of globals.css.
 *
 * Two responsive behaviours, both simple:
 * - Desktop (lg+): always visible, can collapse to an icon-only rail.
 * - Below lg: hidden off-canvas by default, slides in as an overlay drawer.
 */
export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar-bg transition-transform duration-200 ease-in-out",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-[width] lg:duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-64 lg:w-[76px]" : "w-64",
        ].join(" ")}
        aria-label="Primary"
      >
        {/* Brand */}
        <div className="flex h-16 flex-shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sm font-semibold text-slate-900">
            AI
          </div>
          <div className={collapsed ? "min-w-0 lg:hidden" : "min-w-0"}>
            <p className="truncate text-sm font-semibold text-white">AI Operations</p>
            <p className="truncate text-xs text-sidebar-text-muted">Command Center</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={[
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      collapsed ? "lg:justify-center" : "",
                      active
                        ? "bg-sidebar-active-bg text-sidebar-active-text"
                        : "text-sidebar-text hover:bg-sidebar-active-bg/60 hover:text-sidebar-active-text",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-[18px] w-[18px] flex-shrink-0",
                        active
                          ? "text-sidebar-accent"
                          : "text-sidebar-text-muted group-hover:text-sidebar-text",
                      ].join(" ")}
                    />
                    <span className={collapsed ? "truncate lg:hidden" : "truncate"}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse toggle — desktop only; mobile closes via the overlay/backdrop */}
        <div className="hidden flex-shrink-0 border-t border-sidebar-border p-2 lg:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-sidebar-text-muted transition-colors hover:bg-sidebar-active-bg/60 hover:text-sidebar-text",
              collapsed ? "justify-center" : "justify-start",
            ].join(" ")}
          >
            <ChevronsLeftIcon
              className={`h-4 w-4 flex-shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
