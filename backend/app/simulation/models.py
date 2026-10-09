"""Simple typed records for the simulated NovaCommerce business.

Relationships (by id):
    Customer -> Order -> OrderItem -> Product -> InventoryRecord
    Order -> Payment
    Customer / Order -> Complaint
    system name -> HealthMetric
All timestamps are naive UTC.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

OrderStatus = Literal["completed", "payment_failed"]
PaymentStatus = Literal["success", "failed"]
ComplaintCategory = Literal[
    "payment_failed", "checkout_error", "shipping_delay", "product_quality", "other"
]
HealthStatus = Literal["healthy", "degraded", "down"]


@dataclass(frozen=True)
class Customer:
    id: str
    name: str
    email: str
    city: str
    signed_up_at: datetime


@dataclass(frozen=True)
class Product:
    id: str
    name: str
    category: str
    price: float


@dataclass(frozen=True)
class OrderItem:
    product_id: str
    quantity: int
    unit_price: float


@dataclass(frozen=True)
class Order:
    id: str
    customer_id: str
    items: tuple[OrderItem, ...]
    total: float
    status: OrderStatus
    created_at: datetime


@dataclass(frozen=True)
class Payment:
    id: str
    order_id: str
    amount: float
    gateway: str
    status: PaymentStatus
    failure_reason: str | None
    created_at: datetime


@dataclass(frozen=True)
class InventoryRecord:
    product_id: str
    stock_on_hand: int
    reorder_level: int


@dataclass(frozen=True)
class Complaint:
    id: str
    customer_id: str
    order_id: str | None
    category: ComplaintCategory
    message: str
    created_at: datetime


@dataclass(frozen=True)
class HealthMetric:
    system: str
    timestamp: datetime
    status: HealthStatus
    response_time_ms: int
    error_rate: float  # 0.0 - 1.0


@dataclass
class NovaCommerceData:
    seed: int
    customers: list[Customer] = field(default_factory=list)
    products: list[Product] = field(default_factory=list)
    orders: list[Order] = field(default_factory=list)
    payments: list[Payment] = field(default_factory=list)
    inventory: list[InventoryRecord] = field(default_factory=list)
    complaints: list[Complaint] = field(default_factory=list)
    health: list[HealthMetric] = field(default_factory=list)
