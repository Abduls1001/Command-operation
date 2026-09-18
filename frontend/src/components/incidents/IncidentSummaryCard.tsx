import { Card } from "@/components/ui/Card";

interface IncidentSummaryCardProps {
  label: string;
  value: number;
  tone?: "neutral" | "danger" | "warning" | "info" | "success";
}

const TONE_TEXT: Record<NonNullable<IncidentSummaryCardProps["tone"]>, string> = {
  neutral: "text-foreground",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
};

/**
 * A single incident-count card (Total, Active, Critical, Investigating,
 * Resolved). Values are always passed in already derived from the same
 * INCIDENTS array (see the Incidents page), never hardcoded separately, so
 * the cards can't drift out of sync with the list below them.
 */
export function IncidentSummaryCard({ label, value, tone = "neutral" }: IncidentSummaryCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${TONE_TEXT[tone]}`}>
        {value}
      </p>
    </Card>
  );
}
