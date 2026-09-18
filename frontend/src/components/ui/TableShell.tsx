import type { ReactNode } from "react";

interface TableShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Structural table chrome: a bordered, scrollable wrapper around a <table>.
 * Carries no data and no columns of its own — Phase 4 (Incidents) is the
 * first page that will actually put rows inside one. Included now, per
 * DEVELOPMENT_PLAN.md's Phase 2 scope, so later phases share one table
 * presentation rather than each inventing its own.
 */
export function TableShell({ children, className = "" }: TableShellProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-border bg-surface ${className}`}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
