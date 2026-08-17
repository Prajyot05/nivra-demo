# API contract — `POST /api/calculate/:id`

Handoff for Prajyot (end of Day 5). Copy **Investment Growth** (`/growth`) for layout. Call this endpoint. Do **not** implement `pmt` / EMI / SIP math in the frontend.

Base URL: same origin as the Next.js app (`/api/...`). There is no separate Express server.

```
POST /api/calculate/:id
Content-Type: application/json
```

Success:

```json
{ "id": "<calculator-id>", "result": { } }
```

Validation error (`400`):

```json
{ "error": "Invalid input", "issues": [{ "path": "years", "message": "..." }] }
```

Unknown id (`404`):

```json
{ "error": "Unknown calculator id: ..." }
```

Percents are **human numbers** (12 = 12%), not decimals. Money is INR. The engine does **not** round; round only when displaying.

---

## Live calculator ids

| id | Product | Notes |
| --- | --- | --- |
| `growth-sip` | Investment Growth · SIP | Flat SIP, delay, inflation |
| `growth-lumpsum` | Investment Growth · Lumpsum | One-time |
| `growth-stepup` | Investment Growth · Step-up | Yearly step-up |
| `growth-periodic` | Investment Growth · Periodic | `timesPerYear` must divide 12 |
| `goal-sip` | Unified Goal Planner · SIP vs Step-up | Wired on `/` |
| `loan-emi` | Loan EMI | Uses `r/12` (not effective monthly). **Must** use this helper. |

Health: `GET /api/health` → `{ ok, calculators }`.

---

## `growth-sip`

**Input**

```json
{
  "clientName": "Mr. Anshu Kaul",
  "age": 30,
  "monthlyInvestment": 1500,
  "sipYears": 5,
  "investYears": 5,
  "returnPct": 12,
  "inflationPct": 5.75,
  "delayMonths": 6,
  "taxPct": 0
}
```

**Output `result`**

| field | meaning |
| --- | --- |
| `maturity` | Corpus at horizon (Excel FV type=1, monthly rate `(1+r)^(1/12)-1`) |
| `totalInvested` | `monthly * sipYears * 12` |
| `gain` | maturity − invested |
| `inflationAdjusted` | maturity / `(1+inf)^sipYears` |
| `delayedMaturity` / `costOfDelay` | null if `delayMonths` is 0 |
| `tax` / `netAfterTax` | capital-gains on gain |
| `schedule[]` | `{ year, monthly, investedToDate, yearEnd, inflationAdjusted }` |

---

## `growth-lumpsum`

**Input:** `amount`, `years`, `returnPct`, optional `inflationPct`, `delayMonths`, `taxPct`.

**Output:** `maturity`, `totalInvested`, `gain`, `inflationAdjusted`, `inflationAdjustedGain`, `delayedMaturity`, `costOfDelay`, `tax`, `netAfterTax`, `schedule`.

---

## `growth-stepup`

**Input:** `startMonthly`, `sipYears`, `returnPct`, `stepUpPct`, optional `inflationPct`, `taxPct`.

**Output:** `startMonthly`, `endMonthly`, `maturity`, `totalInvested`, `gain`, `inflationAdjusted`, `tax`, `netAfterTax`, `schedule`.

---

## `growth-periodic`

**Input:** `amount`, `timesPerYear` (1, 2, 3, 4, 6, or 12), `years` (max 50), `returnPct`, optional `taxPct`.

**Output:** `maturity`, `totalInvested`, `gain`, `tax`, `netAfterTax`, `payments`, `schedule[]` of `{ month, contribution, contributionFv }`.

---

## `goal-sip`

**Input**

```json
{
  "clientName": "Mr. John Doe",
  "age": 30,
  "goalAmount": 1000000,
  "tenureYears": 15,
  "returnPct": 12,
  "inflationPct": 5.75,
  "taxPct": 12.5,
  "stepUpPct": 10,
  "useInflationAdjustedGoal": false
}
```

**Output `result`**

| field | meaning |
| --- | --- |
| `inflAdjGoal` | `goal * (1+inf)^years` |
| `targetGoal` | raw or inflation-adjusted, per flag |
| `standard` | `{ monthlySip, invested, maturity, gain, tax, netAfterTax }` |
| `stepUp` | same + `endMonthlySip` |
| `schedule[]` | `{ year, stdMonthly, stdYearEnd, stepMonthly, stepYearEnd }` |
| `delays[]` | `{ months, sipRequired, extraInvested }` for 3/6/9/12 |

SIP is solved so **net after tax ≈ target**. Monthly rate is effective, payments beginning-of-month.

---

## `loan-emi`

**Input:** `principal`, `years`, `interestPct`.

**Output:** `emi`, `totalPrincipal`, `totalInterest`, `totalPaid`, `schedule[]` of `{ month, emi, principal, interest, balance }`.

EMI formula matches Unprotected Loan EMI v1: `[P × R × (1+R)^N] / [(1+R)^N − 1]` with `R = annual/12`.

---

## Rules

1. UI form → `POST /api/calculate/:id` → `packages/finance` → ResultCard / ScheduleTable / GrowthChart.
2. If you need a new formula (depreciation, corpus assignment, XIRR), ask Yash to add it to `packages/finance`. Then wire the screen.
3. Vehicle Loan and Multi-Goal with Corpus Assignment use **Full Set**; everything else uses **Unprotected**.
