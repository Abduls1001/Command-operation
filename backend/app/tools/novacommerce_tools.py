"""Read-only tools the future AI agent will use to look at NovaCommerce operational data.

Each tool reuses the existing data layer: the session from app.db.session, the queries in
app.db.queries and the response schemas in app.api.schemas, so a tool returns exactly the
same records as the matching GET /api endpoint. Output is plain JSON-serializable
dicts/lists (datetimes are ISO strings). Tools only read; they never write.

Database problems (not configured, unreachable, tables missing) propagate as exceptions.
The agent layer will decide how to report them.

Every tool takes the same optional paging arguments:
    limit  - max records to return (1-2000, default 50), newest first where time-ordered
    offset - records to skip, for paging (default 0)
"""

from collections.abc import Callable
from contextlib import contextmanager
from typing import Any

from app.api import schemas
from app.db import queries
from app.db.session import get_db

MAX_LIMIT = 2000  # same ceiling as the REST API

# get_db is the FastAPI dependency (one session per use); reuse it instead of a second
# connection setup.
_session = contextmanager(get_db)


def _check_paging(limit: int, offset: int) -> None:
    if not 1 <= limit <= MAX_LIMIT:
        raise ValueError(f"limit must be between 1 and {MAX_LIMIT}")
    if offset < 0:
        raise ValueError("offset must be 0 or greater")


def _dump(schema: type[schemas._Out], rows) -> list[dict[str, Any]]:
    return [schema.model_validate(r).model_dump(mode="json") for r in rows]


def get_orders(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Get customer orders (newest first), each with its line items.

    Fields: id, customer_id, total, status ("completed" or "payment_failed"),
    created_at, items[product_id, quantity, unit_price]."""
    _check_paging(limit, offset)
    with _session() as db:
        return _dump(schemas.OrderOut, queries.get_orders(db, limit, offset))


def get_payments(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Get payment attempts (newest first), one per order.

    Fields: id, order_id, amount, gateway, status ("success" or "failed"),
    failure_reason (null when successful), created_at."""
    _check_paging(limit, offset)
    with _session() as db:
        return _dump(schemas.PaymentOut, queries.get_payments(db, limit, offset))


def get_products(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Get the product catalogue. Fields: id, name, category, price."""
    _check_paging(limit, offset)
    with _session() as db:
        return _dump(schemas.ProductOut, queries.get_products(db, limit, offset))


def get_inventory(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Get current stock per product. Fields: product_id, product_name, stock_on_hand,
    reorder_level (stock at or below this needs restocking)."""
    _check_paging(limit, offset)
    with _session() as db:
        return [
            schemas.InventoryOut(
                product_id=r.product_id, product_name=r.product.name,
                stock_on_hand=r.stock_on_hand, reorder_level=r.reorder_level,
            ).model_dump(mode="json")
            for r in queries.get_inventory(db, limit, offset)
        ]


def get_complaints(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Get customer complaints (newest first).

    Fields: id, customer_id, order_id (may be null), category, message, created_at."""
    _check_paging(limit, offset)
    with _session() as db:
        return _dump(schemas.ComplaintOut, queries.get_complaints(db, limit, offset))


def get_health_metrics(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Get hourly website/system health readings (newest first).

    Fields: system, timestamp, status ("healthy", "degraded" or "down"),
    response_time_ms, error_rate (0.0-1.0)."""
    _check_paging(limit, offset)
    with _session() as db:
        return _dump(schemas.HealthMetricOut, queries.get_health_metrics(db, limit, offset))


# Name -> function. The later agent phase will turn this into LLM tool definitions; the
# docstrings above are the tool descriptions.
TOOLS: dict[str, Callable[..., list[dict[str, Any]]]] = {
    f.__name__: f
    for f in (get_orders, get_payments, get_products, get_inventory, get_complaints,
              get_health_metrics)
}
