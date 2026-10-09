"""Phase 16: GET /api/incidents/active."""

from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.session import DatabaseNotConfigured, get_db
from app.main import app
from tests.conftest import NOW, add_payments, load_simulation, make_engine

URL = "/api/incidents/active"

INCIDENT_KEYS = {
    "id", "title", "severity", "status", "description", "category",
    "affected_system", "detected_at", "evidence",
}


@pytest.fixture
def client_for(engine):
    """Returns a TestClient whose requests use a session on the test database."""

    def override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_returns_the_detected_incidents_with_the_expected_structure(client_for, db):
    load_simulation(db, seed=42, scenario=True)

    response = client_for.get(URL)
    assert response.status_code == 200
    incidents = response.json()

    assert [i["id"] for i in incidents] == [
        "payment_failure_spike",           # critical
        "health_degraded_payment_gateway",  # high, ids break ties alphabetically
        "inventory_below_reorder",
        "order_processing_failures",
    ]
    for incident in incidents:
        assert set(incident) == INCIDENT_KEYS
        assert incident["status"] == "open"
        assert incident["severity"] in {"critical", "high", "medium", "low"}
        assert incident["category"] in {"payments", "system_health", "orders", "inventory", "complaints"}
        assert incident["title"] and incident["description"] and incident["affected_system"]
        datetime.fromisoformat(incident["detected_at"])
        assert incident["evidence"], "every incident carries its evidence"
        for item in incident["evidence"]:
            assert set(item) == {"label", "value"}
            assert isinstance(item["label"], str) and isinstance(item["value"], str)

    payments = incidents[0]
    assert payments["severity"] == "critical"
    assert payments["category"] == "payments"
    assert {"label": "Payment failure rate", "value": "25.8% (8 of 31 payments)"} in payments["evidence"]


def test_returns_an_empty_list_when_nothing_is_wrong(client_for, healthy_db):
    response = client_for.get(URL)
    assert response.status_code == 200
    assert response.json() == []


def test_reflects_the_current_data_on_every_request(client_for, healthy_db):
    assert client_for.get(URL).json() == []

    add_payments(healthy_db, 30, "failed", NOW.replace(hour=11), reason="gateway_timeout")
    healthy_db.commit()
    assert [i["id"] for i in client_for.get(URL).json()] == ["payment_failure_spike"]


def test_is_read_only(client_for):
    for method in (client_for.post, client_for.put, client_for.patch, client_for.delete):
        assert method(URL).status_code == 405


def test_an_unavailable_database_gives_a_503_not_a_crash():
    def broken():
        raise DatabaseNotConfigured("not configured")
        yield  # pragma: no cover  (makes this a generator, like the real dependency)

    app.dependency_overrides[get_db] = broken
    try:
        response = TestClient(app).get(URL)
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 503
    assert response.json() == {"detail": "Database is not configured."}


def test_missing_tables_give_a_503_not_a_crash():
    """e.g. the seed has not been run: the existing DBAPIError handler answers."""
    empty_engine = make_engine()
    from app.db import models as m
    m.Base.metadata.drop_all(empty_engine)

    def override():
        with Session(empty_engine) as session:
            yield session

    app.dependency_overrides[get_db] = override
    try:
        response = TestClient(app).get(URL)
    finally:
        app.dependency_overrides.clear()
        empty_engine.dispose()
    assert response.status_code == 503
    assert "detail" in response.json()
