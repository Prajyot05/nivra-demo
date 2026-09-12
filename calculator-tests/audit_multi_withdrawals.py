#!/usr/bin/env python3
"""
Audit Unprotected Nivra SIP for Multiple Withdrawals v2.xlsm.

  .venv/bin/python calculator-tests/audit_multi_withdrawals.py

Parity is checked against the @nivra/finance model (requiredSip per goal).
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from openpyxl import load_workbook
except ImportError:
    print("Install openpyxl first: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

XLSX = Path(__file__).resolve().parent / "Nivra SIP for Multiple Withdrawals v2.xlsm"


def monthly_rate(annual: float) -> float:
    return (1 + annual) ** (1 / 12) - 1


def fv(rate: float, nper: float, pmt: float, pv: float = 0, typ: int = 1) -> float:
    if rate == 0:
        return -(pv + pmt * nper)
    factor = (1 + rate) ** nper
    if typ == 1:
        return -(pv * factor + pmt * (1 + rate) * (factor - 1) / rate)
    return -(pv * factor + pmt * (factor - 1) / rate)


def required_sip(target: float, years: int, annual_return: float, tax_rate: float) -> float:
    """Solve SIP so net-after-tax corpus ≈ target (matches packages/finance requiredSip)."""
    if years <= 0:
        return 0.0
    # Binary search monthly SIP
    lo, hi = 0.0, target
    for _ in range(80):
        mid = (lo + hi) / 2
        peak = fv(monthly_rate(annual_return), years * 12, -mid, 0, 1)
        invested = mid * years * 12
        tax = max(0.0, peak - invested) * tax_rate
        net = peak - tax
        if net < target:
            lo = mid
        else:
            hi = mid
    return hi


def model(age: int, annual_return: float, tax_rate: float, withdrawals: list[dict]):
    rows = []
    for w in withdrawals:
        if w["amount"] <= 0 or w["atAge"] <= age:
            continue
        years = w["atAge"] - age
        sip = required_sip(w["amount"], years, annual_return, tax_rate)
        invested = sip * years * 12
        peak = fv(monthly_rate(annual_return), years * 12, -sip, 0, 1)
        tax = max(0.0, peak - invested) * tax_rate
        rows.append({**w, "years": years, "monthlySip": sip, "invested": invested, "tax": tax})
    return {
        "rows": rows,
        "startMonthlySip": sum(r["monthlySip"] for r in rows),
        "totalInvested": sum(r["invested"] for r in rows),
        "totalWithdrawn": sum(r["amount"] for r in rows),
        "totalTax": sum(r["tax"] for r in rows),
    }


def close(a: float, b: float, rel: float = 1e-7) -> bool:
    return abs(a - b) <= max(1e-4, abs(b) * rel)


def main() -> int:
    if not XLSX.exists():
        print(f"Missing workbook: {XLSX}", file=sys.stderr)
        return 1

    wb = load_workbook(XLSX, data_only=False, keep_vba=True)
    print("sheets:", wb.sheetnames)
    ws = wb[wb.sheetnames[0]]
    print(f"=== {ws.title} — Multi Withdrawals v2 ===\n")

    SAMPLE = [
        {"name": "Car", "amount": 2_000_000, "atAge": 33},
        {"name": "Education 1", "amount": 2_000_000, "atAge": 41},
        {"name": "Education 2", "amount": 5_000_000, "atAge": 54},
        {"name": "Education 3", "amount": 3_500_000, "atAge": 54},
        {"name": "Education 4", "amount": 2_000_000, "atAge": 41},
        {"name": "Marriage", "amount": 2_000_000, "atAge": 58},
        {"name": "OldAge Home", "amount": 16_000_000, "atAge": 60},
    ]
    r = model(28, 0.12, 0.125, SAMPLE)
    print("Model sample (age 28, 12%, 12.5% tax):")
    print(f"  Car SIP: {r['rows'][0]['monthlySip']}")
    print(f"  startMonthlySip: {r['startMonthlySip']}")
    print(f"  totalWithdrawn: {r['totalWithdrawn']}")
    print(f"  totalInvested: {r['totalInvested']}")
    print(f"  totalTax: {r['totalTax']}")

    failed = 0
    checks = [
        ("Car SIP", r["rows"][0]["monthlySip"], 25488.856849689902),
        ("totalWithdrawn", r["totalWithdrawn"], 32_500_000),
        ("totalInvested", r["totalInvested"], 6990620.3231626917),
    ]
    print("\n=== Golden parity ===")
    for label, actual, expected in checks:
        ok = close(actual, expected)
        if not ok:
            failed += 1
        print(f"  {'OK' if ok else 'FAIL'} {label}: {actual} vs {expected}")

    # Duplicate ages merge
    ages = {}
    for row in SAMPLE:
        ages.setdefault(row["atAge"], []).append(row["name"])
    print("\nAges with multiple goals:", {a: n for a, n in ages.items() if len(n) > 1})

    if failed:
        print(f"\n{failed} check(s) failed", file=sys.stderr)
        return 1
    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
