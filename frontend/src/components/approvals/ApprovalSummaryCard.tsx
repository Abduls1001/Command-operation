import { Card } from "@/components/ui/Card";

interface ApprovalSummaryCardProps {
  label: string;
  value: number;
  tone?: "neutral" | "danger" | "warning" | "info" | "success";
}

const TONE_TEXT: Record<NonNullable<ApprovalSummaryCardProps["tone"]>, string> = {
  neutral: "text-foreground",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
};

/**
 * A single approval-count card (Pending Approval, High Risk, Approved
 * Today, Rejected Today). Values are always derived from the same
 * APPROVALS array (see the Approvals page), never hardcoded separately.
 */
export function ApprovalSummaryCard({ label, value, tone = "neutral" }: ApprovalSummaryCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${TONE_TEXT[tone]}`}>
        {value}
      </p>
    </Card>
  );
}
