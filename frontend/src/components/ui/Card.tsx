import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * A bordered surface panel. The general-purpose container for grouped
 * content — used here for the placeholder pages, and by every data-bearing
 * page from Phase 3 onward.
 */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-lg border border-border bg-surface ${className}`}>
      {children}
    </div>
  );
}
