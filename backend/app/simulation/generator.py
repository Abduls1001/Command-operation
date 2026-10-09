"""Deterministic NovaCommerce data generator.

Same seed + same arguments -> identical data. Uses only the stdlib `random.Random`.

Timeline (UTC): 14 normal days, then a problem morning.
    HISTORY_START ........................ PROBLEM_START ...... PROBLEM_END
    normal business (payment failure ~2%)   gateway degraded (~27%)

The scenario is causal, not painted on: the payment outcome of each order draws
against the gateway's failure rate at that hour; a failed payment makes the order
"payment_failed" (no revenue) and may trigger a complaint; the health metrics for the
payment gateway are derived from the payments that actually happened.
"""

import random
from datetime import datetime, timedelta

from app.simulation.models import (
    Complaint,
    Customer,
    HealthMetric,
    InventoryRecord,
    NovaCommerceData,
    Order,
    OrderItem,
    Payment,
    Product,
)

HISTORY_START = datetime(2026, 9, 15, 0, 0)
PROBLEM_START = datetime(2026, 9, 29, 6, 0)
PROBLEM_END = datetime(2026, 9, 29, 12, 0)  # exclusive; also the end of history

BASELINE_FAILURE_RATE = 0.02
DEGRADED_FAILURE_RATE = 0.27
GATEWAY = "PayFlow"
DECLINE_REASONS = ("card_declined", "insufficient_funds")
DEGRADED_REASONS = ("gateway_timeout", "gateway_5xx", "gateway_timeout")

# Expected orders per hour (index = hour of day, UTC): quiet nights, busy evenings.
_HOURLY_ORDERS = (
    0.5, 0.3, 0.2, 0.2, 0.4, 1.5, 3.0, 4.5, 5.5, 6.0, 6.0, 6.5,
    6.5, 6.0, 5.5, 5.5, 6.0, 6.5, 7.0, 7.5, 6.5, 4.5, 2.5, 1.0,
)
_WEEKEND_FACTOR = 1.15

_PRODUCTS = (
    ("Trail Runner Sneakers", "Footwear", 89.0),
    ("Canvas Backpack", "Bags", 59.0),
    ("Wireless Earbuds", "Electronics", 79.0),
    ("Smart Fitness Watch", "Electronics", 149.0),
    ("Insulated Water Bottle", "Home", 24.0),
    ("Merino Wool Sweater", "Apparel", 95.0),
    ("Denim Jacket", "Apparel", 110.0),
    ("Desk Lamp LED", "Home", 39.0),
    ("Yoga Mat Pro", "Fitness", 45.0),
    ("Bluetooth Speaker", "Electronics", 65.0),
    ("Leather Wallet", "Accessories", 35.0),
    ("Sunglasses Classic", "Accessories", 55.0),
)
_FIRST = ("Ava", "Liam", "Noah", "Emma", "Mia", "Omar", "Sara", "Ali", "Zoe", "Ethan",
          "Hina", "Lucas", "Nina", "Ravi", "Ella", "Sam", "Ines", "Yusuf", "Chloe", "Ben")
_LAST = ("Khan", "Smith", "Garcia", "Ahmed", "Brown", "Lee", "Patel", "Novak", "Silva",
         "Jones", "Ali", "Martin")
_CITIES = ("Lahore", "London", "Toronto", "Dubai", "Berlin", "Austin", "Sydney", "Madrid")

_BACKGROUND_COMPLAINTS = (
    ("shipping_delay", "My package is late."),
    ("product_quality", "The item arrived damaged."),
    ("other", "I need help with my account."),
)
_PAYMENT_COMPLAINT_MESSAGES = (
    "My payment failed at checkout but my card was fine.",
    "Checkout kept timing out when I tried to pay.",
    "I was unable to complete my purchase, payment error.",
)

COMPLAINT_RATE_AFTER_FAILED_PAYMENT = 0.5
CUSTOMER_COUNT = 150
INITIAL_STOCK = 400


def _is_degraded(ts: datetime, scenario: bool) -> bool:
    return scenario and PROBLEM_START <= ts < PROBLEM_END


def generate_novacommerce_data(seed: int = 42, scenario: bool = True) -> NovaCommerceData:
    """Build the full dataset. `scenario=False` gives a purely normal timeline."""
    rng = random.Random(seed)
    data = NovaCommerceData(seed=seed)

    data.products = [
        Product(id=f"PRD-{i + 1:03d}", name=n, category=c, price=p)
        for i, (n, c, p) in enumerate(_PRODUCTS)
    ]
    data.customers = [
        Customer(
            id=f"CUS-{i + 1:04d}",
            name=f"{rng.choice(_FIRST)} {rng.choice(_LAST)}",
            email=f"customer{i + 1}@example.com",
            city=rng.choice(_CITIES),
            signed_up_at=HISTORY_START - timedelta(days=rng.randint(30, 700)),
        )
        for i in range(CUSTOMER_COUNT)
    ]

    units_sold = {p.id: 0 for p in data.products}
    order_no = payment_no = complaint_no = 0

    hour = HISTORY_START
    while hour < PROBLEM_END:
        degraded = _is_degraded(hour, scenario)
        failure_rate = DEGRADED_FAILURE_RATE if degraded else BASELINE_FAILURE_RATE

        expected = _HOURLY_ORDERS[hour.hour] * (
            _WEEKEND_FACTOR if hour.weekday() >= 5 else 1.0
        )
        count = int(expected) + (1 if rng.random() < expected - int(expected) else 0)

        failed_this_hour = 0
        for _ in range(count):
            created = hour + timedelta(minutes=rng.randint(0, 59), seconds=rng.randint(0, 59))
            customer = rng.choice(data.customers)
            items = tuple(
                OrderItem(p.id, qty, p.price)
                for p, qty in (
                    (rng.choice(data.products), rng.randint(1, 2))
                    for _ in range(rng.randint(1, 3))
                )
            )
            total = round(sum(i.quantity * i.unit_price for i in items), 2)

            order_no += 1
            payment_no += 1
            failed = rng.random() < failure_rate
            order_id = f"ORD-{order_no:05d}"

            data.orders.append(Order(
                id=order_id, customer_id=customer.id, items=items, total=total,
                status="payment_failed" if failed else "completed", created_at=created,
            ))
            data.payments.append(Payment(
                id=f"PAY-{payment_no:05d}", order_id=order_id, amount=total, gateway=GATEWAY,
                status="failed" if failed else "success",
                failure_reason=(
                    rng.choice(DEGRADED_REASONS if degraded else DECLINE_REASONS)
                    if failed else None
                ),
                created_at=created,
            ))

            if failed:
                failed_this_hour += 1
                if rng.random() < COMPLAINT_RATE_AFTER_FAILED_PAYMENT:
                    complaint_no += 1
                    data.complaints.append(Complaint(
                        id=f"CMP-{complaint_no:04d}", customer_id=customer.id,
                        order_id=order_id, category="payment_failed",
                        message=rng.choice(_PAYMENT_COMPLAINT_MESSAGES),
                        created_at=created + timedelta(minutes=rng.randint(2, 20)),
                    ))
            else:
                for item in items:
                    units_sold[item.product_id] += item.quantity

        # Small steady trickle of unrelated complaints (~0.1 per hour).
        if rng.random() < 0.1:
            category, message = rng.choice(_BACKGROUND_COMPLAINTS)
            complaint_no += 1
            data.complaints.append(Complaint(
                id=f"CMP-{complaint_no:04d}", customer_id=rng.choice(data.customers).id,
                order_id=None, category=category, message=message,
                created_at=hour + timedelta(minutes=rng.randint(0, 59)),
            ))

        _append_health(data, hour, degraded, count, failed_this_hour, rng)
        hour += timedelta(hours=1)

    data.inventory = [
        InventoryRecord(
            product_id=p.id,
            stock_on_hand=max(0, INITIAL_STOCK - units_sold[p.id]),
            reorder_level=60,
        )
        for p in data.products
    ]
    data.complaints.sort(key=lambda c: c.created_at)
    return data


def _append_health(
    data: NovaCommerceData, hour: datetime, degraded: bool,
    attempts: int, failed: int, rng: random.Random,
) -> None:
    """One hourly reading per system. Gateway error rate comes from real payments."""
    gw_error = (failed / attempts) if attempts else 0.0
    gw_status = "degraded" if degraded else "healthy"
    gw_latency = rng.randint(1800, 3200) if degraded else rng.randint(180, 320)
    data.health.append(HealthMetric("payment_gateway", hour, gw_status, gw_latency, round(gw_error, 3)))
    # Unaffected systems stay normal: the problem is isolated to payments.
    data.health.append(HealthMetric("website", hour, "healthy", rng.randint(120, 260), 0.002))
    data.health.append(HealthMetric("order_processing", hour, "healthy", rng.randint(90, 200), 0.003))
    data.health.append(HealthMetric("inventory_sync", hour, "healthy", rng.randint(80, 180), 0.001))
