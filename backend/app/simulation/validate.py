"""Phase 9 validation. Run from backend/:  python -m app.simulation.validate"""

from app.simulation import (
    PROBLEM_END, PROBLEM_START, compare_to_baseline, generate_novacommerce_data,
)


def main() -> int:
    data = generate_novacommerce_data(seed=42)
    again = generate_novacommerce_data(seed=42)
    other = generate_novacommerce_data(seed=7)
    checks: list[tuple[str, bool]] = []

    checks.append(("deterministic: same seed -> identical data", data == again))
    checks.append(("different seed -> different data", data.orders != other.orders))

    order_ids = {o.id for o in data.orders}
    customer_ids = {c.id for c in data.customers}
    product_ids = {p.id for p in data.products}
    pay_by_order = {p.order_id: p for p in data.payments}
    checks.append(("every order has one payment", len(pay_by_order) == len(data.orders) == len(data.payments)))
    checks.append(("orders -> customers valid", all(o.customer_id in customer_ids for o in data.orders)))
    checks.append(("order items -> products valid", all(i.product_id in product_ids for o in data.orders for i in o.items)))
    checks.append(("payment status matches order status", all(
        (pay_by_order[o.id].status == "success") == (o.status == "completed") for o in data.orders)))
    checks.append(("complaints -> customer/order valid", all(
        c.customer_id in customer_ids and (c.order_id is None or c.order_id in order_ids)
        for c in data.complaints)))
    checks.append(("one inventory record per product", {i.product_id for i in data.inventory} == product_ids))

    m, base = compare_to_baseline(data, PROBLEM_START, PROBLEM_END)
    print("Window: %s -> %s (baseline = per-day avg of same hours, prior 7 days)\n" % (PROBLEM_START, PROBLEM_END))
    print("%-24s %12s %12s" % ("", "Normal", "Problem"))
    print("%-24s %12.1f %12d" % ("Orders placed", base["orders"], m.orders))
    print("%-24s %12.1f %12d" % ("Successful payments", base["successful_payments"], m.successful_payments))
    print("%-24s %12.2f %12.2f" % ("Revenue", base["revenue"], m.revenue))
    print("%-24s %12.1f %12d" % ("Payment failures", base["failed_payments"], m.failed_payments))
    print("%-24s %11.1f%% %11.1f%%" % ("Payment failure rate", base["payment_failure_rate"] * 100, m.payment_failure_rate * 100))
    print("%-24s %12.1f %12d" % ("Complaints", base["complaints"], m.complaints))

    checks += [
        ("payment failures increased", m.failed_payments > base["failed_payments"]),
        ("failure rate increased", m.payment_failure_rate > base["payment_failure_rate"]),
        ("successful orders decreased", m.successful_orders < base["successful_orders"]),
        ("revenue decreased", m.revenue < base["revenue"]),
        ("complaints increased", m.complaints > base["complaints"]),
    ]
    gw = [h for h in data.health if h.system == "payment_gateway"]
    checks.append(("gateway health degraded only in problem window", all(
        (h.status == "degraded") == (PROBLEM_START <= h.timestamp < PROBLEM_END) for h in gw)))

    print()
    for name, ok in checks:
        print(("PASS  " if ok else "FAIL  ") + name)
    return 0 if all(ok for _, ok in checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
