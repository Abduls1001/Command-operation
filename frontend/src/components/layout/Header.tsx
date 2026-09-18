"use client";

import { usePathname } from "next/navigation";

import { MenuIcon } from "./icons";
import { NAV_ITEMS } from "./navigation";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

/**
 * Top bar. Derives the page title from the current route via NAV_ITEMS, so
 * every route page gets a correct header without passing a title down
 * manually. No authentication — "Operator" is a static placeholder, per the
 * Phase 2 scope explicitly excluding auth.
 */
export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const title = current?.label ?? "AI Operations Command Center";

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
          className="-ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-background hover:text-foreground lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
          {title}
        </h1>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          NovaCommerce &middot; Simulated
        </span>

        <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
            OP
          </div>
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            Operator
          </span>
        </div>
      </div>
    </header>
  );
}
