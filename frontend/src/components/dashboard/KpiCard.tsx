import { Card } from "@/components/ui/Card";
import type { KpiMetric, Tone } from "@/lib/mock/dashboard";

const TONE_TEXT: Record<Tone, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-muted",
};

/** Small up/down/flat triangle — no icon dependency, matches icons.tsx's approach. */
function TrendGlyph({ trend, tone }: { trend: KpiMetric["trend"]; tone: Tone }) {
  if (trend === "flat") {
    return <span className={`inline-block ${TONE_TEXT[tone]}`}>&#8213;</span>;
  }
  return (
    <span className={`inline-block ${TONE_TEXT[tone]}`}>
      {trend === "up" ? "\u25B2" : "\u25BC"}
    </span>
  );
}

interface KpiCardProps {
  metric: KpiMetric;
}

/**
 * A single key-metric card: label, headline value, and a trend/delta line.
 * Used four-up on the Dashboard. Static demo data only (Phase 3) — see
 * lib/mock/dashboard.ts.
 */
export function KpiCard({ metric }: KpiCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm font-medium text-muted">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {metric.value}
      </p>
      <p className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${TONE_TEXT[metric.tone]}`}>
        <TrendGlyph trend={metric.trend} tone={metric.tone} />
        <span>{metric.delta}</span>
      </p>
    </Card>
  );
}
