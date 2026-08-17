# API contract — `POST /api/calculate/:id`

Handoff for Prajyot (end of Day 5; Growth live Days 6–8). Copy **Investment Growth** (`/growth`) for layout. Call this endpoint. Do **not** implement `pmt` / EMI / SIP math in the frontend.

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
| `growth-sip` | Investment Growth · SIP | Flat SIP, delay, inflation. UI `/growth` |
| `growth-lumpsum` | Investment Growth · Lumpsum | One-time |
| `growth-stepup` | Investment Growth · Step-up | Yearly step-up |
| `growth-periodic` | Investment Growth · Periodic | `timesPerYear` must divide 12 |
| `goal-sip` | Unified Goal Planner · SIP vs Step-up | Wired on `/` and `/goals` |
| `goal-current` | Unified Goal Planner · Current LS/SIP | Existing corpus + SIP; remaining LS/SIP/step-up. UI `/goals` |
| `goal-ls-sip` | Unified Goal Planner · LS–SIP options | Extra lumpsum now vs remaining SIP |
| `goal-existing-sip` | Unified Goal Planner · Existing SIP | Additional SIP = full required − current SIP |
| `goal-periodic` | Unified Goal Planner · Periodic lumpsum | `timesPerYear` must divide 12 |
| `goal-compounding` | Unified Goal Planner · Growth steps | Required SIP + lumpsum paths; extra years after goal |
| `loan-emi` | Loan EMI | Uses `r/12` (not effective monthly). **Must** use this helper. |
| `education` | Child Education Planner | Age/class cost grid. Tax grosses **fees**, not investment gain. UI `/education` |

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

## `goal-current`

**Input:** `goalAmount`, `tenureYears`, `returnPct`, `inflationPct`, `taxPct`, `stepUpPct`, `useInflationAdjustedGoal`, optional `currentCorpus`, `currentMonthlySip`.

**Output:** `inflAdjGoal`, `targetGoal`, `existing` (`corpusFv`, `sipFv`, `totalFv`, `totalInvested`, `netCredit`), `shortfall`, `overfunded`, `lumpsum` / `standard` / `stepUp` legs, `schedule[]` of `{ year, existingEnd, sipMonthly, sipYearEnd, stepMonthly, stepYearEnd, combinedSipEnd }`.

Existing lumpsum uses annual compounding. Additional amounts are solved so **combined net after tax ≈ target**.

---

## `goal-ls-sip`

**Input:** same goal fields + `currentCorpus`, `extraLumpsum`, `stepUpPct`.

**Output:** `allLumpsum`, `allSip`, `mixSip`, `mixStepUp`, `extraLumpsumFv`, `mixShortfall`, remaining SIP/step-up legs, yearly `schedule`.

---

## `goal-existing-sip`

**Input:** goal fields + `currentMonthlySip`, `stepUpPct`.

**Output:** same shape as `goal-current` with `currentCorpus = 0`. Additional SIP equals full required SIP minus current SIP.

---

## `goal-periodic`

**Input:** goal fields + `amount`, `timesPerYear` (1, 2, 3, 4, 6, or 12), `stepUpPct`.

**Output:** `periodic` (`maturity`, `totalInvested`, `payments`, `netCredit`), `shortfall`, remaining `lumpsum` / `standard` / `stepUp`, SIP/step-up `schedule`.

---

## `goal-compounding`

**Input:** goal fields + optional `extraYears` (default 5).

**Output:** required `standard` SIP and `lumpsum` at the goal year, `sipAfterExtra` / `lumpsumAfterExtra`, `schedule[]` of `{ year, sipMonthly, sipYearEnd, lumpsumEnd }`, `delays[]` like `goal-sip`.

---

## `loan-emi`

**Input:** `principal`, `years`, `interestPct`.

**Output:** `emi`, `totalPrincipal`, `totalInterest`, `totalPaid`, `schedule[]` of `{ month, emi, principal, interest, balance }`.

EMI formula matches Unprotected Loan EMI v1: `[P × R × (1+R)^N] / [(1+R)^N − 1]` with `R = annual/12`.

---

## `education`

**Input**

```json
{
  "clientName": "Mr. Anshu Kaul",
  "age": 35,
  "childName": "Jitender Agarwal",
  "childAge": 5,
  "returnPct": 12,
  "taxPct": 12.5,
  "costs": [
    { "age": 6, "classLabel": "Class 1", "cost": 25000 },
    { "age": 21, "classLabel": "College - 4", "cost": 7000000 }
  ]
}
```

`childAge` is an integer (do not send DOB). Percents are human numbers. Each cost row is the fee at that child age.

**Output `result`**

| field | meaning |
| --- | --- |
| `totalCost` | Future education fees (`age > childAge`) |
| `totalTax` | Cap. gains on those fees: `cost × taxRate` (Excel F, not tax on investment gain) |
| `totalWithdrawal` | `cost + tax` for future years (Excel G / P36) |
| `lastFeeAge` / `sipYears` | Last year with a fee; SIP years = lastFeeAge − childAge |
| `lumpsum` | `{ lumpsum, invested, tax, peakCorpus, remaining }` — required today (Excel Q10) |
| `sip` | `{ monthlySip, invested, tax, peakCorpus, remaining }` — GoalSeek last-year SIP balance to 0 |
| `compare[]` | `{ category, lumpsum, sip }` for Invested / Cap. gains tax / Peak corpus |
| `costChart[]` | `{ age, classLabel, cost, tax }` — cost grid for stacked columns |
| `schedule[]` | `{ age, classLabel, cost, tax, withdrawal, sipCorpus, sipBalance, lumpsumBalance }` |

Lumpsum is a backward PV of later withdrawals (Excel type=0). SIP uses effective monthly rate and beginning-of-month payments (type=1). Past years (`age ≤ childAge`) have zero withdrawal / SIP / lumpsum activity.

---

## Rules

1. UI form → `POST /api/calculate/:id` → `packages/finance` → ResultCard / ScheduleTable / charts from [`docs/charts.md`](charts.md).
2. If you need a new formula (depreciation, corpus assignment, XIRR), ask Yash to add it to `packages/finance`. Then wire the screen.
3. Vehicle Loan and Multi-Goal with Corpus Assignment use **Full Set**; everything else uses **Unprotected**.
