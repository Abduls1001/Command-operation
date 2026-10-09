"""Minimal response shapes for the Phase 10 verification endpoints."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class _Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class OrderItemOut(_Out):
    product_id: str
    quantity: int
    unit_price: float


class OrderOut(_Out):
    id: str
    customer_id: str
    total: float
    status: str
    created_at: datetime
    items: list[OrderItemOut]


class ProductOut(_Out):
    id: str
    name: str
    category: str
    price: float


class PaymentOut(_Out):
    id: str
    order_id: str
    amount: float
    gateway: str
    status: str
    failure_reason: str | None
    created_at: datetime


class InventoryOut(_Out):
    product_id: str
    product_name: str
    stock_on_hand: int
    reorder_level: int


class ComplaintOut(_Out):
    id: str
    customer_id: str
    order_id: str | None
    category: str
    message: str
    created_at: datetime


class HealthMetricOut(_Out):
    system: str
    timestamp: datetime
    status: str
    response_time_ms: int
    error_rate: float


class IncidentEvidenceOut(_Out):
    label: str
    value: str


class IncidentOut(_Out):
    """A detected operational incident (Phase 16). Computed from live data, not stored."""

    id: str
    title: str
    severity: Literal["critical", "high", "medium", "low"]
    status: Literal["open"]
    description: str
    category: Literal["payments", "system_health", "orders", "inventory", "complaints"]
    affected_system: str
    detected_at: datetime
    evidence: list[IncidentEvidenceOut]
