import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Constrains and centers page content to a consistent maximum width.
 * Every page's top-level content wraps in this.
 */
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return <div className={`mx-auto w-full max-w-7xl ${className}`}>{children}</div>;
}
