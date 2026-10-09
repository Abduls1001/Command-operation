import { Card } from "@/components/ui/Card";

interface ActionSummaryCardProps {
  label: string;
  value: number;
  tone?: "neutral" | "danger" | "warning" | "info" | "success" | "accent";
}

const TONE_TEXT: Record<NonNullable<ActionSummaryCardProps["tone"]>, string> = {
  neutral: "text-foreground",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
  accent: "text-accent",
};

/**
 * A single action-count card (Pending Actions, Approved, Executing,
 * Completed, Failed). Every value is derived from the same ACTIONS array
 * on the Actions page — never hardcoded separately, never random.
 */
export function ActionSummaryCard({ label, value, tone = "neutral" }: ActionSummaryCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${TONE_TEXT[tone]}`}>
        {value}
      </p>
    </Card>
  );
}
