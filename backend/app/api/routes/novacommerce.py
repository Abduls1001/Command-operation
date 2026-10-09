"""Read-only endpoints that expose NovaCommerce data from PostgreSQL.

Deliberately basic: newest first, limit/offset paging, no filters or analytics.
Database access lives in app/db/queries.py.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import schemas
from app.db import queries
from app.db.session import get_db

router = APIRouter(tags=["novacommerce"])

DB = Annotated[Session, Depends(get_db)]
Limit = Annotated[int, Query(ge=1, le=2000, description="Max rows to return")]
Offset = Annotated[int, Query(ge=0, description="Rows to skip")]


@router.get("/orders", response_model=list[schemas.OrderOut])
def list_orders(db: DB, limit: Limit = 50, offset: Offset = 0):
    return queries.get_orders(db, limit, offset)


@router.get("/products", response_model=list[schemas.ProductOut])
def list_products(db: DB, limit: Limit = 50, offset: Offset = 0):
    return queries.get_products(db, limit, offset)


@router.get("/payments", response_model=list[schemas.PaymentOut])
def list_payments(db: DB, limit: Limit = 50, offset: Offset = 0):
    return queries.get_payments(db, limit, offset)


@router.get("/inventory", response_model=list[schemas.InventoryOut])
def list_inventory(db: DB, limit: Limit = 50, offset: Offset = 0):
    return [
        schemas.InventoryOut(
            product_id=r.product_id, product_name=r.product.name,
            stock_on_hand=r.stock_on_hand, reorder_level=r.reorder_level,
        )
        for r in queries.get_inventory(db, limit, offset)
    ]


@router.get("/complaints", response_model=list[schemas.ComplaintOut])
def list_complaints(db: DB, limit: Limit = 50, offset: Offset = 0):
    return queries.get_complaints(db, limit, offset)


@router.get("/health-metrics", response_model=list[schemas.HealthMetricOut])
def list_health_metrics(db: DB, limit: Limit = 50, offset: Offset = 0):
    return queries.get_health_metrics(db, limit, offset)
