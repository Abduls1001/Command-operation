"""Check every agent tool against the real database and the REST API.

Run from backend/:  python -m app.tools.validate
Needs a seeded PostgreSQL configured through the normal .env / environment. Read-only.
Exit code 0 = all checks passed.
"""

import json
import sys

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import models as m
from app.db.session import get_engine
from app.main import app
from app.tools import TOOLS

# tool name -> (table model for the row count, REST path)
CHECKS = {
    "get_orders": (m.Order, "/api/orders"),
    "get_payments": (m.Payment, "/api/payments"),
    "get_products": (m.Product, "/api/products"),
    "get_inventory": (m.InventoryRecord, "/api/inventory"),
    "get_complaints": (m.Complaint, "/api/complaints"),
    "get_health_metrics": (m.HealthMetric, "/api/health-metrics"),
}

failures = 0


def check(ok: bool, label: str) -> None:
    global failures
    print(f"{'PASS' if ok else 'FAIL'}  {label}")
    failures += 0 if ok else 1


def main() -> int:
    check(set(TOOLS) == set(CHECKS), "registry contains exactly the 6 required tools")
    client = TestClient(app)
    with Session(get_engine()) as db:
        for name, (model, path) in CHECKS.items():
            tool = TOOLS[name]
            db_count = db.scalar(select(func.count()).select_from(model))
            rows = tool(limit=2000)
            check(len(rows) > 0 and len(rows) == db_count,
                  f"{name}: {len(rows)} records == {db_count} rows in the database")
            check(json.loads(json.dumps(rows)) == rows, f"{name}: output is JSON-serializable")
            api = client.get(path, params={"limit": 2000})
            check(api.status_code == 200 and api.json() == rows,
                  f"{name}: identical to GET {path}")
            check(len(tool()) == min(50, db_count), f"{name}: default limit is 50")
            check(tool(limit=3, offset=1) == rows[1:4], f"{name}: limit/offset paging")
            try:
                tool(limit=0)
                check(False, f"{name}: rejects limit=0")
            except ValueError:
                check(True, f"{name}: rejects limit=0")
    print("\nAll tool checks passed." if not failures else f"\n{failures} check(s) FAILED.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
