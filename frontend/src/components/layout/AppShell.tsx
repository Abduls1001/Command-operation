"use client";

import { useState, type ReactNode } from "react";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

/**
 * The reusable frame every page renders inside: Sidebar + Header + a main
 * content region. This is the entire deliverable of Phase 2 — it owns no
 * page content of its own.
 *
 * Holds the two pieces of shell UI state (desktop collapse, mobile drawer
 * open/closed) and passes them down, since Sidebar and Header both need to
 * react to them.
 */
export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
