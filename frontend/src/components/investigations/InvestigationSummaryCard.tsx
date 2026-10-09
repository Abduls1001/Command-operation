import { Card } from "@/components/ui/Card";

interface InvestigationSummaryCardProps {
  label: string;
  value: number;
  tone?: "neutral" | "danger" | "warning" | "info" | "success";
}

const TONE_TEXT: Record<NonNullable<InvestigationSummaryCardProps["tone"]>, string> = {
  neutral: "text-foreground",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
};

/**
 * A single investigation-count card (Total, Running, Completed, Awaiting
 * Approval). Values are always derived from the same INVESTIGATIONS array
 * (see the Investigations page), never hardcoded separately.
 */
export function InvestigationSummaryCard({
  label,
  value,
  tone = "neutral",
}: InvestigationSummaryCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${TONE_TEXT[tone]}`}>
        {value}
      </p>
    </Card>
  );
}
