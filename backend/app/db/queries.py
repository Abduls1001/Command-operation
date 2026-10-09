"""Read queries for the NovaCommerce API. Routes call these; they hold the SQL."""

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import and_, case, func, select
from sqlalchemy.orm import Session, selectinload

from app.db import models as m


def get_orders(db: Session, limit: int, offset: int) -> list[m.Order]:
    stmt = (
        select(m.Order).options(selectinload(m.Order.items))
        .order_by(m.Order.created_at.desc(), m.Order.id.desc())
        .limit(limit).offset(offset)
    )
    return list(db.scalars(stmt))


def get_products(db: Session, limit: int, offset: int) -> list[m.Product]:
    return list(db.scalars(select(m.Product).order_by(m.Product.id).limit(limit).offset(offset)))


def get_payments(db: Session, limit: int, offset: int) -> list[m.Payment]:
    stmt = (
        select(m.Payment).order_by(m.Payment.created_at.desc(), m.Payment.id.desc())
        .limit(limit).offset(offset)
    )
    return list(db.scalars(stmt))


def get_inventory(db: Session, limit: int, offset: int) -> list[m.InventoryRecord]:
    stmt = (
        select(m.InventoryRecord).options(selectinload(m.InventoryRecord.product))
        .order_by(m.InventoryRecord.product_id).limit(limit).offset(offset)
    )
    return list(db.scalars(stmt))


def get_complaints(db: Session, limit: int, offset: int) -> list[m.Complaint]:
    stmt = (
        select(m.Complaint).order_by(m.Complaint.created_at.desc(), m.Complaint.id.desc())
        .limit(limit).offset(offset)
    )
    return list(db.scalars(stmt))


def get_health_metrics(db: Session, limit: int, offset: int) -> list[m.HealthMetric]:
    stmt = (
        select(m.HealthMetric)
        .order_by(m.HealthMetric.timestamp.desc(), m.HealthMetric.system)
        .limit(limit).offset(offset)
    )
    return list(db.scalars(stmt))


# --- Incident detection (Phase 16) -------------------------------------------------
# Small aggregate reads used by app/incidents/detection.py. Time windows are
# (start, end]: strictly after `start`, up to and including `end`.


def get_latest_activity_time(db: Session) -> datetime | None:
    """Newest timestamp in the operational data; this is "now" for incident detection.

    The simulated dataset ends on a fixed date, so detection works relative to the data
    rather than the wall clock (the dashboard does the same for "today")."""
    newest = [
        db.scalar(select(func.max(column)))
        for column in (
            m.Order.created_at, m.Payment.created_at,
            m.Complaint.created_at, m.HealthMetric.timestamp,
        )
    ]
    present = [t for t in newest if t is not None]
    return max(present) if present else None


@dataclass(frozen=True)
class PaymentStats:
    total: int
    failed: int
    gateway: str | None                       # gateway behind most of the failures
    failure_reasons: list[tuple[str, int]]    # (reason, count), most common first


def get_payment_stats(db: Session, start: datetime, end: datetime) -> PaymentStats:
    window = and_(m.Payment.created_at > start, m.Payment.created_at <= end)
    total, failed = db.execute(
        select(
            func.count(m.Payment.id),
            func.coalesce(func.sum(case((m.Payment.status == "failed", 1), else_=0)), 0),
        ).where(window)
    ).one()

    count = func.count(m.Payment.id)
    failures = db.execute(
        select(m.Payment.gateway, m.Payment.failure_reason, count)
        .where(window, m.Payment.status == "failed")
        .group_by(m.Payment.gateway, m.Payment.failure_reason)
        .order_by(count.desc(), m.Payment.failure_reason)
    ).all()

    by_gateway: dict[str, int] = {}
    by_reason: dict[str, int] = {}
    for gateway, reason, n in failures:
        by_gateway[gateway] = by_gateway.get(gateway, 0) + n
        by_reason[reason or "unknown"] = by_reason.get(reason or "unknown", 0) + n
    return PaymentStats(
        total=int(total),
        failed=int(failed),
        gateway=max(by_gateway, key=lambda g: (by_gateway[g], g)) if by_gateway else None,
        failure_reasons=sorted(by_reason.items(), key=lambda kv: (-kv[1], kv[0])),
    )


@dataclass(frozen=True)
class OrderStats:
    total: int
    not_completed: int       # orders whose status is anything other than "completed"
    lost_revenue: float      # sum of the totals of those orders


def get_order_stats(db: Session, start: datetime, end: datetime) -> OrderStats:
    completed = m.Order.status == "completed"
    total, not_completed, lost = db.execute(
        select(
            func.count(m.Order.id),
            func.coalesce(func.sum(case((completed, 0), else_=1)), 0),
            func.coalesce(func.sum(case((completed, 0), else_=m.Order.total)), 0),
        ).where(m.Order.created_at > start, m.Order.created_at <= end)
    ).one()
    return OrderStats(int(total), int(not_completed), round(float(lost), 2))


def get_complaint_counts(db: Session, start: datetime, end: datetime) -> dict[str, int]:
    """Complaints per category in the window, most common first."""
    count = func.count(m.Complaint.id)
    rows = db.execute(
        select(m.Complaint.category, count)
        .where(m.Complaint.created_at > start, m.Complaint.created_at <= end)
        .group_by(m.Complaint.category)
        .order_by(count.desc(), m.Complaint.category)
    ).all()
    return {category: int(n) for category, n in rows}


def get_latest_health_readings(db: Session, end: datetime) -> list[m.HealthMetric]:
    """The newest reading of each system, at or before `end`."""
    latest = (
        select(m.HealthMetric.system, func.max(m.HealthMetric.timestamp).label("ts"))
        .where(m.HealthMetric.timestamp <= end)
        .group_by(m.HealthMetric.system)
        .subquery()
    )
    stmt = (
        select(m.HealthMetric)
        .join(latest, and_(m.HealthMetric.system == latest.c.system,
                           m.HealthMetric.timestamp == latest.c.ts))
        .order_by(m.HealthMetric.system)
    )
    return list(db.scalars(stmt))


def get_unhealthy_run(db: Session, system: str, end: datetime) -> tuple[datetime, int] | None:
    """(time of the first reading, number of readings) since the system was last healthy."""
    last_healthy = db.scalar(
        select(func.max(m.HealthMetric.timestamp)).where(
            m.HealthMetric.system == system, m.HealthMetric.status == "healthy",
            m.HealthMetric.timestamp <= end,
        )
    )
    conditions = [m.HealthMetric.system == system, m.HealthMetric.timestamp <= end]
    if last_healthy is not None:
        conditions.append(m.HealthMetric.timestamp > last_healthy)
    first, n = db.execute(
        select(func.min(m.HealthMetric.timestamp), func.count(m.HealthMetric.id)).where(*conditions)
    ).one()
    return (first, int(n)) if n else None


def get_low_stock(db: Session) -> list[tuple[str, int, int]]:
    """(product name, stock on hand, reorder level) for products at or below their
    reorder level, emptiest first."""
    rows = db.execute(
        select(m.Product.name, m.InventoryRecord.stock_on_hand, m.InventoryRecord.reorder_level)
        .join(m.Product, m.Product.id == m.InventoryRecord.product_id)
        .where(m.InventoryRecord.stock_on_hand <= m.InventoryRecord.reorder_level)
        .order_by(m.InventoryRecord.stock_on_hand, m.Product.name)
    ).all()
    return [(name, int(stock), int(reorder)) for name, stock, reorder in rows]
