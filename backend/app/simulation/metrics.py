"""Simple derived metrics computed straight from the simulated records."""

from dataclasses import dataclass
from datetime import datetime, timedelta

from app.simulation.models import NovaCommerceData


@dataclass(frozen=True)
class PeriodMetrics:
    orders: int                # all orders placed (including ones whose payment failed)
    successful_orders: int
    revenue: float             # sum of totals of orders with a successful payment
    successful_payments: int
    failed_payments: int
    payment_failure_rate: float
    complaints: int


def compute_metrics(data: NovaCommerceData, start: datetime, end: datetime) -> PeriodMetrics:
    """Metrics for start <= timestamp < end."""
    orders = [o for o in data.orders if start <= o.created_at < end]
    payments = [p for p in data.payments if start <= p.created_at < end]
    ok = sum(1 for p in payments if p.status == "success")
    failed = len(payments) - ok
    return PeriodMetrics(
        orders=len(orders),
        successful_orders=sum(1 for o in orders if o.status == "completed"),
        revenue=round(sum(p.amount for p in payments if p.status == "success"), 2),
        successful_payments=ok,
        failed_payments=failed,
        payment_failure_rate=round(failed / len(payments), 4) if payments else 0.0,
        complaints=sum(1 for c in data.complaints if start <= c.created_at < end),
    )


def compare_to_baseline(
    data: NovaCommerceData, start: datetime, end: datetime, baseline_days: int = 7
) -> tuple[PeriodMetrics, dict[str, float]]:
    """Metrics for [start, end) plus the per-day average of the same clock window on the
    `baseline_days` days before it (same hours, so time-of-day effects cancel out)."""
    actual = compute_metrics(data, start, end)
    days = [
        compute_metrics(data, start - timedelta(days=d), end - timedelta(days=d))
        for d in range(1, baseline_days + 1)
    ]
    n = len(days)
    baseline = {
        "orders": sum(m.orders for m in days) / n,
        "successful_orders": sum(m.successful_orders for m in days) / n,
        "revenue": sum(m.revenue for m in days) / n,
        "successful_payments": sum(m.successful_payments for m in days) / n,
        "failed_payments": sum(m.failed_payments for m in days) / n,
        "payment_failure_rate": (
            sum(m.failed_payments for m in days)
            / max(1, sum(m.successful_payments + m.failed_payments for m in days))
        ),
        "complaints": sum(m.complaints for m in days) / n,
    }
    return actual, baseline
