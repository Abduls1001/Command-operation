"""Deterministic incident detection over the NovaCommerce operational data.

    NovaCommerce data (PostgreSQL) -> threshold rules -> structured incidents

Plain arithmetic on counts and rates. No LLM decides whether a threshold was crossed;
the Phase 14/15 agent explains and investigates incidents, it does not detect them.

Incidents are computed on every call and not stored: an incident is "active" exactly while
its condition holds, and disappears when the data no longer shows it. Ids are stable, so
the same condition always has the same id.

"Now" is the newest timestamp in the data (see queries.get_latest_activity_time), because
the simulated dataset ends on a fixed date. Rates are measured over the last WINDOW_HOURS.

Rules (thresholds below were calibrated on the Phase 9 simulation: ~31 orders per
6-hour daytime window, ~2% normal payment failure, a gateway fault at ~27%):

    payment_failure_spike         >= 5 failed payments AND failure rate >= 10%
    health_degraded_<system>      a system's latest health reading is degraded or down
    order_processing_failures     >= 5 orders not completed AND share of orders >= 10%
    inventory_below_reorder       any product at or below its reorder level
    complaint_spike               >= 5 complaints AND >= 3x the usual number for the same
                                  hours over the previous 7 days (usual is floored at 1)

Every rule needs a minimum count as well as a rate: with so few events per window a rate
alone would fire on noise (e.g. 2 failures out of 6 overnight payments).
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Literal

from sqlalchemy.orm import Session

from app.db import queries

WINDOW_HOURS = 6
BASELINE_DAYS = 7

PAYMENT_MIN_FAILED = 5
PAYMENT_MIN_RATE = 0.10
PAYMENT_CRITICAL_RATE = 0.20

ORDER_MIN_FAILED = 5
ORDER_MIN_SHARE = 0.10
ORDER_HIGH_SHARE = 0.20

COMPLAINT_MIN_COUNT = 5
COMPLAINT_MIN_MULTIPLE = 3.0
COMPLAINT_BASELINE_FLOOR = 1.0

MAX_NAMES_SHOWN = 5

Severity = Literal["critical", "high", "medium", "low"]
Category = Literal["payments", "system_health", "orders", "inventory", "complaints"]

_SEVERITY_RANK: dict[str, int] = {"critical": 0, "high": 1, "medium": 2, "low": 3}

_SYSTEM_NAMES = {
    "payment_gateway": "Payment Gateway",
    "website": "Website",
    "order_processing": "Order Processing",
    "inventory_sync": "Inventory Sync",
}


@dataclass(frozen=True)
class IncidentEvidence:
    """One measurement behind an incident, already formatted for display."""

    label: str
    value: str


@dataclass(frozen=True)
class Incident:
    id: str
    title: str
    severity: Severity
    status: Literal["open"]   # detected incidents have no workflow yet: always "open"
    description: str
    category: Category
    affected_system: str
    detected_at: datetime     # the data time the condition was observed at
    evidence: list[IncidentEvidence]


# --- formatting helpers -------------------------------------------------------------


def _pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def _stamp(ts: datetime) -> str:
    return f"{ts:%Y-%m-%d %H:%M} UTC"


def _window_label(start: datetime, end: datetime) -> str:
    return f"{_stamp(start)} to {_stamp(end)}"


def _names(names: list[str]) -> str:
    shown = ", ".join(names[:MAX_NAMES_SHOWN])
    extra = len(names) - MAX_NAMES_SHOWN
    return f"{shown} (+{extra} more)" if extra > 0 else shown


def _counts(pairs: list[tuple[str, int]], limit: int = 3) -> str:
    return ", ".join(f"{name} x{n}" for name, n in pairs[:limit])


def _system_name(system: str) -> str:
    return _SYSTEM_NAMES.get(system, system.replace("_", " ").title())


# --- rules --------------------------------------------------------------------------


def _payment_failure_spike(db: Session, start: datetime, end: datetime) -> Incident | None:
    stats = queries.get_payment_stats(db, start, end)
    if stats.total == 0:
        return None
    rate = stats.failed / stats.total
    if stats.failed < PAYMENT_MIN_FAILED or rate < PAYMENT_MIN_RATE:
        return None

    evidence = [
        IncidentEvidence("Payment failure rate", f"{_pct(rate)} ({stats.failed} of {stats.total} payments)"),
    ]
    base = queries.get_payment_stats(db, start - timedelta(days=BASELINE_DAYS), start)
    if base.total:
        evidence.append(IncidentEvidence(
            f"Previous {BASELINE_DAYS} days", f"{_pct(base.failed / base.total)} failure rate"))
    if stats.gateway:
        evidence.append(IncidentEvidence("Gateway", stats.gateway))
    if stats.failure_reasons:
        evidence.append(IncidentEvidence("Top failure reasons", _counts(stats.failure_reasons)))
    evidence.append(IncidentEvidence("Window", _window_label(start, end)))

    gateway = f" through {stats.gateway}" if stats.gateway else ""
    return Incident(
        id="payment_failure_spike",
        title="Payment failure spike",
        severity="critical" if rate >= PAYMENT_CRITICAL_RATE else "high",
        status="open",
        description=(
            f"{_pct(rate)} of payments{gateway} failed in the last {WINDOW_HOURS} hours "
            f"({stats.failed} of {stats.total})."
        ),
        category="payments",
        affected_system=stats.gateway or "Payments",
        detected_at=end,
        evidence=evidence,
    )


def _health_incidents(db: Session, end: datetime) -> list[Incident]:
    incidents = []
    for reading in queries.get_latest_health_readings(db, end):
        if reading.status == "healthy":
            continue
        name = _system_name(reading.system)
        evidence = [
            IncidentEvidence("Status", reading.status),
            IncidentEvidence("Response time", f"{reading.response_time_ms:,} ms"),
            IncidentEvidence("Error rate", _pct(reading.error_rate)),
        ]
        run = queries.get_unhealthy_run(db, reading.system, end)
        if run:
            since, readings = run
            evidence.append(IncidentEvidence(
                "Not healthy since", f"{_stamp(since)} ({readings} hourly reading{'s' * (readings != 1)})"))
        incidents.append(Incident(
            id=f"health_degraded_{reading.system}",
            title=f"{name} is {'down' if reading.status == 'down' else 'degraded'}",
            severity="critical" if reading.status == "down" else "high",
            status="open",
            description=(
                f"The latest health reading ({_stamp(reading.timestamp)}) reports {name} as "
                f"{reading.status}: {reading.response_time_ms:,} ms response time and "
                f"{_pct(reading.error_rate)} error rate."
            ),
            category="system_health",
            affected_system=name,
            detected_at=end,
            evidence=evidence,
        ))
    return incidents


def _order_processing_failures(db: Session, start: datetime, end: datetime) -> Incident | None:
    stats = queries.get_order_stats(db, start, end)
    if stats.total == 0:
        return None
    share = stats.not_completed / stats.total
    if stats.not_completed < ORDER_MIN_FAILED or share < ORDER_MIN_SHARE:
        return None

    return Incident(
        id="order_processing_failures",
        title="Orders failing to complete",
        severity="high" if share >= ORDER_HIGH_SHARE else "medium",
        status="open",
        description=(
            f"{stats.not_completed} of {stats.total} orders ({_pct(share)}) did not complete in "
            f"the last {WINDOW_HOURS} hours, leaving ${stats.lost_revenue:,.2f} in order value unrealised."
        ),
        category="orders",
        affected_system="Order Processing",
        detected_at=end,
        evidence=[
            IncidentEvidence("Orders not completed", f"{stats.not_completed} of {stats.total} ({_pct(share)})"),
            IncidentEvidence("Order value not realised", f"${stats.lost_revenue:,.2f}"),
            IncidentEvidence("Window", _window_label(start, end)),
        ],
    )


def _inventory_below_reorder(db: Session, end: datetime) -> Incident | None:
    low = queries.get_low_stock(db)
    if not low:
        return None
    out_of_stock = [name for name, stock, _ in low if stock == 0]
    running_low = [f"{name} ({stock} left)" for name, stock, _ in low if stock > 0]

    evidence = []
    if out_of_stock:
        evidence.append(IncidentEvidence("Out of stock", _names(out_of_stock)))
    if running_low:
        evidence.append(IncidentEvidence("Below reorder level", _names(running_low)))

    if out_of_stock:
        summary = (f"{len(out_of_stock)} product{'s' * (len(out_of_stock) != 1)} out of stock, "
                   f"{len(running_low)} more at or below the reorder level.")
    else:
        summary = f"{len(low)} product{'s' * (len(low) != 1)} at or below the reorder level."
    return Incident(
        id="inventory_below_reorder",
        title="Inventory below reorder level",
        severity="high" if out_of_stock else "medium",
        status="open",
        description=summary,
        category="inventory",
        affected_system="Inventory",
        detected_at=end,
        evidence=evidence,
    )


def _complaint_spike(db: Session, start: datetime, end: datetime) -> Incident | None:
    by_category = queries.get_complaint_counts(db, start, end)
    count = sum(by_category.values())
    if count < COMPLAINT_MIN_COUNT:
        return None

    prior = [
        sum(queries.get_complaint_counts(
            db, start - timedelta(days=d), end - timedelta(days=d)).values())
        for d in range(1, BASELINE_DAYS + 1)
    ]
    usual = sum(prior) / BASELINE_DAYS
    if count < COMPLAINT_MIN_MULTIPLE * max(usual, COMPLAINT_BASELINE_FLOOR):
        return None

    return Incident(
        id="complaint_spike",
        title="Customer complaint spike",
        severity="medium",
        status="open",
        description=(
            f"{count} complaints in the last {WINDOW_HOURS} hours, against about {usual:.1f} "
            f"for the same hours over the previous {BASELINE_DAYS} days."
        ),
        category="complaints",
        affected_system="Customer Support",
        detected_at=end,
        evidence=[
            IncidentEvidence(f"Complaints, last {WINDOW_HOURS} hours", str(count)),
            IncidentEvidence(f"Usual, same hours (previous {BASELINE_DAYS} days)", f"{usual:.1f}"),
            IncidentEvidence("Top categories", _counts(list(by_category.items()))),
            IncidentEvidence("Window", _window_label(start, end)),
        ],
    )


# --- entry point --------------------------------------------------------------------


def detect_incidents(db: Session, as_of: datetime | None = None) -> list[Incident]:
    """Evaluate every rule and return the active incidents, most severe first.

    `as_of` is the moment to evaluate at; by default the newest timestamp in the data."""
    end = as_of or queries.get_latest_activity_time(db)
    if end is None:
        return []  # no data, nothing to detect
    start = end - timedelta(hours=WINDOW_HOURS)

    found = [
        _payment_failure_spike(db, start, end),
        *_health_incidents(db, end),
        _order_processing_failures(db, start, end),
        _inventory_below_reorder(db, end),
        _complaint_spike(db, start, end),
    ]
    incidents = [i for i in found if i is not None]
    incidents.sort(key=lambda i: (_SEVERITY_RANK[i.severity], i.id))
    return incidents
