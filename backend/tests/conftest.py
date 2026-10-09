"""Shared fixtures for the backend tests.

Tests run against an in-memory SQLite database built from the real SQLAlchemy models, so
they need no PostgreSQL and never touch a real database. No test calls an LLM.
"""

from datetime import datetime, timedelta
from itertools import count

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db import models as m
from app.simulation import generate_novacommerce_data

# The moment incidents are evaluated at in the hand-built datasets: a Tuesday noon.
NOW = datetime(2026, 9, 29, 12, 0)

_ids = count(1)


def make_engine():
    # StaticPool + check_same_thread=False: the API tests use the same in-memory database
    # from FastAPI's worker threads.
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    m.Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def engine():
    engine = make_engine()
    yield engine
    engine.dispose()


@pytest.fixture
def db(engine):
    with Session(engine) as session:
        yield session


# --- builders for small, hand-made datasets ---------------------------------------------


def add_customer_and_products(db: Session, stocks=((300, 60), (250, 60))) -> None:
    db.add(m.Customer(id="CUS-1", name="Ava Khan", email="a@example.com", city="Lahore",
                      signed_up_at=NOW - timedelta(days=400)))
    for i, (stock, reorder) in enumerate(stocks, start=1):
        db.add(m.Product(id=f"PRD-{i}", name=f"Product {i}", category="Home", price=10))
        db.add(m.InventoryRecord(product_id=f"PRD-{i}", stock_on_hand=stock, reorder_level=reorder))
    db.flush()


def add_orders(db: Session, n: int, status: str, at: datetime, total: float = 50.0) -> None:
    for k in range(n):
        db.add(m.Order(id=f"ORD-{next(_ids)}", customer_id="CUS-1", total=total, status=status,
                       created_at=at - timedelta(minutes=k)))
    db.flush()


def add_payments(db: Session, n: int, status: str, at: datetime, reason: str | None = None,
                 gateway: str = "PayFlow") -> None:
    for k in range(n):
        db.add(m.Payment(id=f"PAY-{next(_ids)}", order_id=f"ORD-P{next(_ids)}", amount=50,
                         gateway=gateway, status=status,
                         failure_reason=reason if status == "failed" else None,
                         created_at=at - timedelta(minutes=k)))
    db.flush()


def add_complaints(db: Session, n: int, at: datetime, category: str = "payment_failed") -> None:
    for k in range(n):
        db.add(m.Complaint(id=f"CMP-{next(_ids)}", customer_id="CUS-1", order_id=None,
                           category=category, message="Something went wrong.",
                           created_at=at - timedelta(minutes=k)))
    db.flush()


def add_health(db: Session, system: str, statuses: list[str], response_ms: int = 150,
               error_rate: float = 0.002) -> None:
    """One hourly reading per status, oldest first, the last one at NOW - 1 hour."""
    for k, status in enumerate(reversed(statuses), start=1):
        db.add(m.HealthMetric(system=system, timestamp=NOW - timedelta(hours=k), status=status,
                              response_time_ms=response_ms, error_rate=error_rate))
    db.flush()


@pytest.fixture
def healthy_db(db):
    """A normal business: orders and payments succeed (history for 8 days plus the last
    few hours), every system healthy, plenty of stock, one stray complaint."""
    add_customer_and_products(db)
    for day in range(0, 9):
        at = NOW - timedelta(days=day, hours=1)
        add_orders(db, 40, "completed", at)
        add_payments(db, 40, "success", at)
    for system in ("payment_gateway", "website", "order_processing", "inventory_sync"):
        add_health(db, system, ["healthy"] * 24)
    add_complaints(db, 1, NOW - timedelta(hours=2), category="shipping_delay")
    db.commit()
    return db


def load_simulation(db: Session, seed: int = 42, scenario: bool = True):
    """Load the Phase 9 NovaCommerce simulation, the same way app.db.seed does."""
    data = generate_novacommerce_data(seed=seed, scenario=scenario)
    db.add_all(m.Customer(**vars(c)) for c in data.customers)
    db.add_all(m.Product(**vars(p)) for p in data.products)
    db.flush()
    db.add_all(m.InventoryRecord(**vars(i)) for i in data.inventory)
    db.add_all(
        m.Order(id=o.id, customer_id=o.customer_id, total=o.total, status=o.status,
                created_at=o.created_at)
        for o in data.orders
    )
    db.flush()
    db.add_all(
        m.OrderItem(order_id=o.id, product_id=i.product_id, quantity=i.quantity,
                    unit_price=i.unit_price)
        for o in data.orders for i in o.items
    )
    db.add_all(m.Payment(**vars(p)) for p in data.payments)
    db.add_all(m.Complaint(**vars(c)) for c in data.complaints)
    db.add_all(m.HealthMetric(**vars(h)) for h in data.health)
    db.commit()
    return data
