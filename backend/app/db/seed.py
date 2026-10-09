"""Create the NovaCommerce tables and load the Phase 9 simulation into PostgreSQL.

Run from backend/:  python -m app.db.seed [--seed 42]

Re-running replaces the NovaCommerce rows (delete + reload), so it is safe to repeat.
Only the NovaCommerce tables are touched.
"""

import argparse

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db import models as m
from app.db.session import get_engine
from app.simulation import generate_novacommerce_data

# Children first, for deletion; reversed for insertion.
_DELETE_ORDER = (
    m.Complaint, m.Payment, m.OrderItem, m.Order,
    m.InventoryRecord, m.Product, m.Customer, m.HealthMetric,
)


def seed(seed_value: int = 42) -> dict[str, int]:
    data = generate_novacommerce_data(seed=seed_value)
    engine = get_engine()
    m.Base.metadata.create_all(engine)

    with Session(engine) as session, session.begin():
        for model in _DELETE_ORDER:
            session.execute(delete(model))

        session.add_all(m.Customer(**vars(c)) for c in data.customers)
        session.add_all(m.Product(**vars(p)) for p in data.products)
        session.flush()
        session.add_all(m.InventoryRecord(**vars(i)) for i in data.inventory)
        session.add_all(
            m.Order(id=o.id, customer_id=o.customer_id, total=o.total,
                    status=o.status, created_at=o.created_at)
            for o in data.orders
        )
        session.flush()
        session.add_all(
            m.OrderItem(order_id=o.id, product_id=i.product_id,
                        quantity=i.quantity, unit_price=i.unit_price)
            for o in data.orders for i in o.items
        )
        session.add_all(m.Payment(**vars(p)) for p in data.payments)
        session.add_all(m.Complaint(**vars(c)) for c in data.complaints)
        session.add_all(m.HealthMetric(**vars(h)) for h in data.health)

    return {
        "customers": len(data.customers), "products": len(data.products),
        "orders": len(data.orders),
        "order_items": sum(len(o.items) for o in data.orders),
        "payments": len(data.payments), "inventory": len(data.inventory),
        "complaints": len(data.complaints), "health_metrics": len(data.health),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--seed", type=int, default=42)
    for table, count in seed(parser.parse_args().seed).items():
        print(f"{table:16s} {count}")
