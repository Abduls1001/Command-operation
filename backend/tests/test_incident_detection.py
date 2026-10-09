"""Phase 16: deterministic incident detection rules (app/incidents/detection.py)."""

from datetime import timedelta

from app.incidents import detect_incidents
from app.incidents import detection
from tests.conftest import (
    NOW, add_complaints, add_customer_and_products, add_health, add_orders, add_payments,
    load_simulation,
)

RECENT = NOW - timedelta(hours=1)  # inside the 6-hour detection window


def by_id(incidents):
    return {i.id: i for i in incidents}


def evidence(incident):
    return {e.label: e.value for e in incident.evidence}


# --- no false incidents -----------------------------------------------------------------


def test_healthy_data_creates_no_incidents(healthy_db):
    assert detect_incidents(healthy_db, as_of=NOW) == []


def test_empty_database_creates_no_incidents(db):
    assert detect_incidents(db) == []


def test_simulation_without_the_fault_has_no_operational_incidents(db):
    """The real generator with no scenario: payments, health, orders and complaints are
    all normal. (Stock still runs down over the 2 weeks, which is a real inventory issue.)"""
    load_simulation(db, seed=42, scenario=False)
    ids = set(by_id(detect_incidents(db)))
    assert ids <= {"inventory_below_reorder"}


# --- payments ---------------------------------------------------------------------------


def test_payment_failure_spike_is_detected(healthy_db):
    # 20 failures alongside the 40 successful payments of the last 6 hours: 33.3%.
    add_payments(healthy_db, 20, "failed", RECENT, reason="gateway_timeout")
    incident = by_id(detect_incidents(healthy_db, as_of=NOW))["payment_failure_spike"]

    assert incident.title == "Payment failure spike"
    assert incident.severity == "critical"
    assert incident.category == "payments"
    assert incident.status == "open"
    assert incident.affected_system == "PayFlow"
    assert incident.detected_at == NOW
    ev = evidence(incident)
    assert ev["Payment failure rate"] == "33.3% (20 of 60 payments)"
    assert ev["Top failure reasons"] == "gateway_timeout x20"
    assert ev["Gateway"] == "PayFlow"


def test_payment_failure_severity_follows_the_rate(healthy_db):
    # 8 failures among the 40 successful payments of the last 6 hours: 16.7% -> high.
    add_payments(healthy_db, 8, "failed", RECENT, reason="gateway_timeout")
    assert by_id(detect_incidents(healthy_db, as_of=NOW))["payment_failure_spike"].severity == "high"
    # 20 more failures: 28 of 68 = 41% -> critical.
    add_payments(healthy_db, 20, "failed", RECENT, reason="gateway_timeout")
    assert by_id(detect_incidents(healthy_db, as_of=NOW))["payment_failure_spike"].severity == "critical"


def test_a_few_failures_are_not_a_spike(healthy_db):
    # 4 of 44 is 9.1% and below the minimum count of 5: noise, not a spike.
    add_payments(healthy_db, 4, "failed", RECENT, reason="card_declined")
    assert "payment_failure_spike" not in by_id(detect_incidents(healthy_db, as_of=NOW))


def test_failures_at_a_normal_rate_are_not_a_spike(healthy_db):
    add_payments(healthy_db, 400, "success", RECENT)
    add_payments(healthy_db, 8, "failed", RECENT, reason="card_declined")  # 8/448 = 1.8%
    assert "payment_failure_spike" not in by_id(detect_incidents(healthy_db, as_of=NOW))


def test_old_failures_outside_the_window_are_ignored(healthy_db):
    just_outside = NOW - timedelta(hours=detection.WINDOW_HOURS + 2)
    add_payments(healthy_db, 30, "failed", just_outside, reason="gateway_5xx")
    assert "payment_failure_spike" not in by_id(detect_incidents(healthy_db, as_of=NOW))


# --- system health ----------------------------------------------------------------------


def test_degraded_health_is_detected(db):
    add_health(db, "payment_gateway", ["healthy", "healthy", "degraded", "degraded", "degraded"],
               response_ms=2910, error_rate=0.333)
    add_health(db, "website", ["healthy"] * 5)
    db.commit()

    found = by_id(detect_incidents(db, as_of=NOW))
    assert set(found) == {"health_degraded_payment_gateway"}   # only the unhealthy system
    incident = found["health_degraded_payment_gateway"]
    assert incident.title == "Payment Gateway is degraded"
    assert incident.severity == "high"
    assert incident.category == "system_health"
    assert incident.affected_system == "Payment Gateway"
    ev = evidence(incident)
    assert ev["Status"] == "degraded"
    assert ev["Response time"] == "2,910 ms"
    assert ev["Error rate"] == "33.3%"
    assert ev["Not healthy since"] == "2026-09-29 09:00 UTC (3 hourly readings)"


def test_a_system_that_is_down_is_critical(db):
    add_health(db, "website", ["healthy", "down"])
    db.commit()
    incident = by_id(detect_incidents(db, as_of=NOW))["health_degraded_website"]
    assert incident.severity == "critical"
    assert incident.title == "Website is down"


def test_a_recovered_system_is_not_an_incident(db):
    add_health(db, "payment_gateway", ["healthy", "degraded", "degraded", "healthy"])
    db.commit()
    assert detect_incidents(db, as_of=NOW) == []


# --- order processing -------------------------------------------------------------------


def test_order_processing_problems_are_detected(healthy_db):
    # Failed orders only, no failed payments: proves the rule reads the orders data.
    add_orders(healthy_db, 20, "payment_failed", RECENT, total=100.0)   # 20 of 60 = 33.3%
    found = by_id(detect_incidents(healthy_db, as_of=NOW))

    incident = found["order_processing_failures"]
    assert incident.title == "Orders failing to complete"
    assert incident.severity == "high"
    assert incident.category == "orders"
    assert incident.affected_system == "Order Processing"
    assert incident.status == "open"
    ev = evidence(incident)
    assert ev["Orders not completed"] == "20 of 60 (33.3%)"
    assert ev["Order value not realised"] == "$2,000.00"
    assert "payment_failure_spike" not in found


def test_order_processing_severity_is_medium_below_20_percent(healthy_db):
    add_orders(healthy_db, 8, "payment_failed", RECENT)                  # 8 of 48 = 16.7%
    assert by_id(detect_incidents(healthy_db, as_of=NOW))["order_processing_failures"].severity == "medium"


def test_few_failed_orders_are_not_a_problem(healthy_db):
    add_orders(healthy_db, 4, "payment_failed", RECENT)
    assert "order_processing_failures" not in by_id(detect_incidents(healthy_db, as_of=NOW))


# --- inventory --------------------------------------------------------------------------


def test_out_of_stock_products_are_a_high_severity_incident(db):
    add_customer_and_products(db, stocks=((0, 60), (300, 60), (40, 60)))
    db.commit()
    incident = by_id(detect_incidents(db, as_of=NOW))["inventory_below_reorder"]
    assert incident.severity == "high"
    assert incident.category == "inventory"
    ev = evidence(incident)
    assert ev["Out of stock"] == "Product 1"
    assert ev["Below reorder level"] == "Product 3 (40 left)"


def test_low_stock_without_stockouts_is_medium_and_the_reorder_level_itself_counts(db):
    add_customer_and_products(db, stocks=((60, 60), (300, 60)))   # exactly at reorder level
    db.commit()
    incident = by_id(detect_incidents(db, as_of=NOW))["inventory_below_reorder"]
    assert incident.severity == "medium"
    assert "Out of stock" not in evidence(incident)


def test_stock_above_the_reorder_level_is_fine(db):
    add_customer_and_products(db, stocks=((61, 60), (300, 60)))
    db.commit()
    assert detect_incidents(db, as_of=NOW) == []


# --- complaints -------------------------------------------------------------------------


def test_complaint_spike_is_detected(healthy_db):
    add_complaints(healthy_db, 8, RECENT, category="payment_failed")
    incident = by_id(detect_incidents(healthy_db, as_of=NOW))["complaint_spike"]
    assert incident.category == "complaints"
    assert incident.affected_system == "Customer Support"
    ev = evidence(incident)
    assert ev["Complaints, last 6 hours"] == "9"                 # 8 new + the stray one
    assert ev["Top categories"] == "payment_failed x8, shipping_delay x1"


def test_a_handful_of_complaints_is_not_a_spike(healthy_db):
    add_complaints(healthy_db, 3, RECENT)
    assert "complaint_spike" not in by_id(detect_incidents(healthy_db, as_of=NOW))


def test_complaints_are_compared_with_the_usual_level(healthy_db):
    # A busy week: 3 complaints in these hours every day, so "usual" is 3.0 and a spike
    # needs at least 9. Today has 7 new + the stray one = 8: elevated, but not 3x usual.
    for day in range(1, 8):
        add_complaints(healthy_db, 3, RECENT - timedelta(days=day))
    add_complaints(healthy_db, 7, RECENT)
    assert "complaint_spike" not in by_id(detect_incidents(healthy_db, as_of=NOW))

    add_complaints(healthy_db, 1, RECENT)                                # now 9 = 3 x usual
    incident = by_id(detect_incidents(healthy_db, as_of=NOW))["complaint_spike"]
    assert evidence(incident)["Usual, same hours (previous 7 days)"] == "3.0"


# --- behaviour across rules -------------------------------------------------------------


def test_incidents_are_ordered_most_severe_first_with_stable_ids(healthy_db):
    add_payments(healthy_db, 30, "failed", RECENT, reason="gateway_timeout")
    add_health(healthy_db, "payment_gateway", ["degraded"])        # newer than the healthy ones
    healthy_db.commit()

    incidents = detect_incidents(healthy_db, as_of=NOW)
    rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    assert [rank[i.severity] for i in incidents] == sorted(rank[i.severity] for i in incidents)
    assert incidents[0].id == "payment_failure_spike"
    assert [i.id for i in incidents] == [i.id for i in detect_incidents(healthy_db, as_of=NOW)]


def test_as_of_defaults_to_the_newest_data(healthy_db):
    add_payments(healthy_db, 30, "failed", RECENT, reason="gateway_timeout")
    healthy_db.commit()
    incident = by_id(detect_incidents(healthy_db))["payment_failure_spike"]
    assert incident.detected_at == RECENT


# --- the real simulation ----------------------------------------------------------------


def test_simulated_payment_gateway_fault_produces_the_expected_incidents(db):
    load_simulation(db, seed=42, scenario=True)
    found = by_id(detect_incidents(db))

    assert set(found) == {
        "payment_failure_spike",
        "health_degraded_payment_gateway",
        "order_processing_failures",
        "inventory_below_reorder",
    }
    payments = found["payment_failure_spike"]
    assert payments.severity == "critical"
    assert payments.affected_system == "PayFlow"
    assert evidence(payments)["Payment failure rate"] == "25.8% (8 of 31 payments)"
    assert evidence(payments)["Top failure reasons"] == "gateway_timeout x6, gateway_5xx x2"
    assert evidence(found["health_degraded_payment_gateway"])["Not healthy since"].startswith(
        "2026-09-29 06:00 UTC")
    assert evidence(found["inventory_below_reorder"])["Out of stock"] == "Desk Lamp LED, Leather Wallet"
