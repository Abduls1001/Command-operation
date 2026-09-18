import type { ReactNode } from "react";

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-background text-muted border-border",
  accent: "bg-accent-muted text-accent border-accent/20",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

/**
 * A small labeled pill. Named "status badge" in the Development Plan because
 * its main future use is incident/action status (Phase 4, Phase 7); the
 * "accent" variant is what the Phase 2 placeholder pages use for
 * "Coming in a later phase".
 */
export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
