"""NovaCommerce simulation (Phase 9): a small, deterministic, in-memory data layer.

Not wired to any API, database, or AI code yet. Later phases read it.
"""

from app.simulation.generator import (
    PROBLEM_END,
    PROBLEM_START,
    generate_novacommerce_data,
)
from app.simulation.metrics import PeriodMetrics, compare_to_baseline, compute_metrics
from app.simulation.models import NovaCommerceData

__all__ = [
    "PROBLEM_END",
    "PROBLEM_START",
    "NovaCommerceData",
    "PeriodMetrics",
    "compare_to_baseline",
    "compute_metrics",
    "generate_novacommerce_data",
]
