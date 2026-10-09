"""SQLAlchemy models for the NovaCommerce business data (Phase 9 simulation).

Mirrors app/simulation/models.py one-to-one, same ids and fields. Tables use the
`nc_` prefix to keep NovaCommerce data (the world being observed) visibly separate
from future Command Center tables (ARCHITECTURE.md section 4).

Relationships:
    Customer -> Order -> OrderItem -> Product -> InventoryRecord
    Order -> Payment            Customer / Order -> Complaint
All timestamps are naive UTC, as in the simulation.
"""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "nc_customers"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(200), unique=True)
    city: Mapped[str] = mapped_column(String(100))
    signed_up_at: Mapped[datetime] = mapped_column(DateTime)

    orders: Mapped[list["Order"]] = relationship(back_populates="customer")
    complaints: Mapped[list["Complaint"]] = relationship(back_populates="customer")


class Product(Base):
    __tablename__ = "nc_products"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(100))
    price: Mapped[float] = mapped_column(Numeric(10, 2))

    inventory: Mapped["InventoryRecord"] = relationship(back_populates="product", uselist=False)


class Order(Base):
    __tablename__ = "nc_orders"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("nc_customers.id"), index=True)
    total: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(32), index=True)  # completed | payment_failed
    created_at: Mapped[datetime] = mapped_column(DateTime, index=True)

    customer: Mapped[Customer] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
    payment: Mapped["Payment"] = relationship(back_populates="order", uselist=False)
    complaints: Mapped[list["Complaint"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "nc_order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("nc_orders.id"), index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("nc_products.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))

    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product] = relationship()


class Payment(Base):
    __tablename__ = "nc_payments"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("nc_orders.id"), unique=True)  # one per order
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    gateway: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(16), index=True)  # success | failed
    failure_reason: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, index=True)

    order: Mapped[Order] = relationship(back_populates="payment")


class InventoryRecord(Base):
    __tablename__ = "nc_inventory"

    product_id: Mapped[str] = mapped_column(ForeignKey("nc_products.id"), primary_key=True)
    stock_on_hand: Mapped[int] = mapped_column(Integer)
    reorder_level: Mapped[int] = mapped_column(Integer)

    product: Mapped[Product] = relationship(back_populates="inventory")


class Complaint(Base):
    __tablename__ = "nc_complaints"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("nc_customers.id"), index=True)
    order_id: Mapped[str | None] = mapped_column(ForeignKey("nc_orders.id"), index=True)
    category: Mapped[str] = mapped_column(String(32))
    message: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, index=True)

    customer: Mapped[Customer] = relationship(back_populates="complaints")
    order: Mapped[Order | None] = relationship(back_populates="complaints")


class HealthMetric(Base):
    """System/website health: one reading per system per hour."""

    __tablename__ = "nc_health_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    system: Mapped[str] = mapped_column(String(50), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(16))  # healthy | degraded | down
    response_time_ms: Mapped[int] = mapped_column(Integer)
    error_rate: Mapped[float] = mapped_column(Float)  # 0.0 - 1.0
