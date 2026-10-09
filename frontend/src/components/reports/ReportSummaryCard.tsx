import { Card } from "@/components/ui/Card";

interface ReportSummaryCardProps {
  label: string;
  value: number;
  tone?: "neutral" | "danger" | "warning" | "info" | "success";
}

const TONE_TEXT: Record<NonNullable<ReportSummaryCardProps["tone"]>, string> = {
  neutral: "text-foreground",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
};

/**
 * A single report-count card (Total Reports, Resolved, Pending Review,
 * Critical Incidents). Every value is derived from the same REPORTS array
 * on the Reports page — never hardcoded separately, never random.
 */
export function ReportSummaryCard({ label, value, tone = "neutral" }: ReportSummaryCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${TONE_TEXT[tone]}`}>
        {value}
      </p>
    </Card>
  );
}
