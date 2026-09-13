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
| `goal-compounding` | Unified Goal Planner · Growth steps | Required SIP + lumpsum; wealth-step timings. No inflation. |
| `loan-emi` | Loan EMI | Uses `r/12` (not effective monthly). **Must** use this helper. UI `/loans` |
| `loan-prepay` | Loan yearly extra | Unprotected Periodic Extra Payments v1. UI `/loans` |
| `loan-extra-vs-invest` | Extra vs invest **v2** | Unprotected v2. UI `/loans` |
| `loan-interest-recovery` | Interest recovery v7 | Proposed shorter loan + SIP. UI `/loans` |
| `vehicle-loan` | Vehicle loan benefit | Full Set Veh-Loan. UI `/loans` |
| `mf-fd` | MF vs FD | Day-count post-tax compare. UI `/mf-fd` |
| `insurance-irr` | Insurance IRR | XIRR on premium/maturity cashflows. UI `/insurance` |
| `insurance-tp` | Convert to term + invest | Keep vs surrender. UI `/insurance` |
| `multi-goal-assign` | Multi-goal corpus assign | Full Set. UI `/multi-goal` |
| `multi-withdrawals` | SIP for withdrawals | Unprotected v2. UI `/multi-goal` |
| `education` | Child Education Planner | Age/class cost grid. Tax grosses **fees**, not investment gain. UI `/education` |
| `fire-planner` | FIRE Planner v10 | Corpus / SIP to retire early. UI `/fire` |
| `financial-health` | Financial Health v4 | How long corpus lasts. UI `/fire` |

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
  "goalAmount": 10000000,
  "tenureYears": 15,
  "returnPct": 12,
  "inflationPct": 5.25,
  "taxPct": 12.5,
  "stepUpPct": 10,
  "useInflationAdjustedGoal": true
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

**Output:** `periodic` (`maturity`, `totalInvested`, `payments`, `gain`, `tax`, `netCredit`), `shortfall`, remaining `lumpsum` / `standard` / `stepUp`, `schedule[]` of `{ year, periodicPaid, periodicInvestedYtd, sipMonthly, sipYearEnd, stepMonthly, stepYearEnd }`.

---

## `goal-compounding`

Unprotected *Goal with Power of Compounding / Growth Steps*. There is **no inflation input**. Net after tax equals the stated goal.

**Input**

```json
{
  "clientName": "Opinder Jain",
  "age": 30,
  "goalAmount": 5000000,
  "tenureYears": 15,
  "returnPct": 14,
  "taxPct": 12.5,
  "investmentType": "one-time",
  "stepSize": 1000000
}
```

`investmentType` is `one-time` or `sip` (which path the growth-step table uses). `stepSize` is one of `10000` · `100000` · `1000000` · `10000000`. Optional `extraYears` (default 0) extends the yearly schedule only. Optional `inflationPct` / `useInflationAdjustedGoal` default off so a shared goal-planner payload still parses.

**Output `result`**

| field | meaning |
| --- | --- |
| `targetGoal` | Stated goal (inflation off unless the caller opts in) |
| `standard` | Required monthly SIP so **net after tax ≈ goal**. `invested`, `maturity`, `gain`, `tax`, `netAfterTax` at the goal year |
| `lumpsum` | Required lumpsum today (`lumpsum.lumpsum`) plus the same mix fields at the goal year |
| `growthSteps[]` | `{ step, targetCorpus, corpus, months }` when `INT(corpus / stepSize)` rises. Sample One Time / ₹10L steps: 23, 86, 123, 150, 170 months |
| `investmentType` / `stepSize` | Echo of the selected path and step |
| `schedule[]` | `{ year, sipMonthly, sipYearEnd, lumpsumEnd }` for tenure (+ extra years if sent) |
| `sipAfterExtra` / `lumpsumAfterExtra` | Corpus at tenure + extra years (equals goal-year maturity when extra years is 0) |

Sample: ₹50 L / 15y / 14% / 12.5% tax → SIP **₹9,670.13**/mo, lumpsum **₹7,84,843.64**, SIP maturity **₹54,65,625.28**, lumpsum maturity **₹56,02,165.19**.

---

## `loan-emi`

**Input:** `principal`, `years`, `interestPct`, optional `recoverReturnPct` (default 12), optional `delayMonths` (default 12).

`delayMonths` must be strictly less than `years × 12` so at least one recovery investment month remains.

**Output:** `emi`, `totalPrincipal`, `totalInterest`, `totalPaid`, `schedule[]` of `{ month, emi, principal, interest, balance }`, plus interest-recovery fields:

| field | meaning |
| --- | --- |
| `recoverMonthlySip` | Monthly SIP (start now) that grows to `totalInterest` over the loan term at `recoverReturnPct` |
| `recoverInvested` | `recoverMonthlySip × recoverMonths` |
| `delayedRecoverMonthlySip` | Monthly SIP if start is delayed by `delayMonths` |
| `delayedRecoverInvested` | `delayedRecoverMonthlySip × delayedRecoverMonths` |
| `recoverMonths` / `delayedRecoverMonths` | Investment months (full term vs term minus delay) |

EMI formula matches Unprotected Loan EMI v1: `[P × R × (1+R)^N] / [(1+R)^N − 1]` with `R = annual/12`.

Interest recovery uses effective monthly return `(1+r)^(1/12)-1`. Immediate SIP is beginning-of-period (Excel type=1). Delayed SIP matches Excel end-of-period (type=0) over the remaining months.

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

## `mf-fd`

**Input:** `amount`, `days`, `mfReturnPct`, `fdReturnPct`, `mfTaxPct`, `fdTaxPct`.

UI tax selects match Excel ActiveX lists: MF `10 | 12.5 | 20 | 30`, FD `20 | 25 | 30`. Period and amount are shared (FD mirrors MF).

**Output:** `mf` / `fd` legs (`annualizedReturn`, `returnPerDay`, `preTax`, `tax`, `postTax`, `invested`, `gain`, `net`), `mfAdvantage`, `fdAdvantage`, `difference`, `compare[]`.

Annualized return = amount × rate. Per-day = annualized / 365. Pre-tax = per-day × days. Post-tax = pre-tax − pre-tax × tax. Advantage cells are `max(0, side − other)` like Excel C15/F15. Sample: ₹100 Cr / 15 days / 5% vs 3% / 20% vs 25% tax → MF post-tax **16,43,835.62**.

---

## `loan-prepay`

**Input:** `principal`, `years`, `interestPct`, `yearlyExtra`, optional `recoverReturnPct` (default 12).

**Output:** EMI schedule with extra at months 12, 24, …; `monthsPaid`, `interestSaved`, `totalExtra`, `recoverSip` / `revisedRecoverSip` (SIP to recover original vs remaining interest).

---

## `loan-extra-vs-invest`

**Input:** `principal`, `years`, `interestPct`, `extraAmount`, `extraMonth`, `investReturnPct`, `taxPct`, `incomeTaxPct`.

**Output:** option 1 prepay (`option1Saving`, remaining months) vs option 2 invest extra (`corpusAfterTax`, `option2Saving`), plus `path[]` of outstanding vs investment.

Sample: ₹2 Cr / 20y / 8.5% / extra ₹50 L at month 49 / 9% / 12.5% CG / 20% income tax.

---

## `loan-interest-recovery`

**Input:** `principal`, `years` (baseline), `interestPct`, `proposedYears` (must be **less than** `years`), `sipReturnPct`.

**Output:** `baselineEmi`, `baselineInterest`, `baselinePaid`, `proposedEmi`, `proposedInterest`, `proposedPaid`, `monthlySip`, `sipInvested`, `sipAtHorizon`, `totalInvestedLoanPlusSip`, `savingsVsBaselinePaid`, `wealthCreated`, `totalAssetPlusWealth`, `additionalWealth`, year `schedule` of baseline balance / proposed balance / SIP / loanPlusSip.

---

## `vehicle-loan`

**Input:** `onRoadCost`, `loanAmount`, `interestPct`, `years`, `incomeTaxPct`, `depreciationPct`, returns and tax for FD / debt / conservative / equity.

**Output:** `emi`, `totalInterest`, `totalDepreciation`, tax saved fields, depreciation schedule, `options[]` (No loan, FD, MF debt, Conservative, Equity) with invested / maturity / profit / netProfit / out-of-pocket / financialBenefit, `compare[]`, `stacked[]`, and `best` option name.

FD uses quarterly FV; others annual FV. Depreciation is declining balance on on-road cost.

---

## `insurance-irr`

**Input:** `premium`, `payTerm`, `corpusAtPayEnd`, `policyTerm`, `returnPct`, `taxPct`.

**Output:** `maturity` = FV(return, policy − pay, 0, −corpusAtPayEnd, 1), `gain`, `tax`, `net`, `xirr`, `payTermRate`.

Sample: ₹2 L × 5y, corpus ₹11.6 L, 20y, 11%, 12.5% tax → maturity **55,50,123.81**.

---

## `insurance-tp`

**Input:** current policy (`premium`, `payTerm`, `yearsPaid`, `policyTerm`, `yearsToMaturity`, `maturityValue`, `taxPct`, `surrenderValue`) plus term (`termPremium`, `termYears`) and `returnPct`.

**Output:** `keep` (net after tax, IRR) vs `switch` (`investMaturity`, term cost, IRR), `compare[]`.

---

## `multi-goal-assign`

**Input:** `shortTermYears`, `shortTermReturnPct`, `longTermReturnPct`, `inflationPct`, `taxPct`, optional `delayMonths`, `currentCorpus`, `corpusReturnPct`, `goals[]` of `{ name, amount, years }`.

**Output:** per-goal SIP / lumpsum (net after tax = inflated goal, ST vs LT yield), corpus assigned soonest-first, `compare[]`.

---

## `multi-withdrawals`

**Input:** `age`, `returnPct`, `taxPct`, `withdrawals[]` of `{ name, amount, atAge }` (1–20 goals).

**Output:** independent required SIP per withdrawal, `startMonthlySip`, totals, `ageChart` / `schedule`.

---

## `fire-planner`

**Input:** `age`, `retirementAge`, `survivingAge`, `monthlyExpenses`, `lifestyleYearly`, `monthlyExpenseFactorPct` / `lifestyleFactorPct` (100 = same as current; allowed 0–200 for UI options like 150%/200%), `inflationPct`, `returnPct`, `returnAfterPct`, `taxPct`, optional `corpusSlices[]` of `{ returnPct, amount }` (max 3), `currentSipMonthly`, `currentSipReturnPct`, `limitSipYears`, `stepUpPct`, `delayMonths`.

**Output:** inflated expenses at retirement, `corpusRequired` (backward PV of taxed withdrawals), `currentAtRetirement`, `balanceCorpus`, `additionalLumpsum`, flat `monthlySip` / `stepUpStartSip`, delay SIP/lumpsum, age `schedule[]` (`corpus`, `contribution`, `withdrawal`, `phase`).

UI `/fire` · FIRE tab. Sample: age 40 / ret 55 / surv 90 → corpus **₹21,04,42,136.92**, SIP **₹3,55,210.92**.

---

## `financial-health`

**Input:** `currentCorpus`, `monthlyExpenses`, `monthlyInvestment`, `lifestyleYearly`, ages, `inflationPct`, `returnPct` (entered-value / direct rate), `returnAfterPct`, `taxPct`, optional `retirementBenefit`, `savingsGrowthPct`, `events[]` (max 5) of `{ age, amount, type: Expense|Income }`. Event ages must be after retirement and on/before survival.

**Output:** `corpusAtRetirement`, `yearsLasting` / `monthsLasting`, `remainingAtSurvival`, `remainingPvToday`, `funded`, `message` (surplus / fully funded / insufficient), `gapAtRetirement`, age `schedule[]` with `eventAmount` as net event impact after tax for expenses.

UI `/fire` · Health tab. Sample: ₹25 Cr / age 59→60, event ₹2 Cr expense at 62 → lasting **30 yrs**, remaining **₹81,42,85,941.84**.

---

## Rules

1. UI form → `POST /api/calculate/:id` → `packages/finance` → ResultCard / ScheduleTable / charts from [`docs/charts.md`](charts.md).
2. If you need a new formula (depreciation, corpus assignment, XIRR), ask Yash to add it to `packages/finance`. Then wire the screen.
3. Vehicle Loan and Multi-Goal with Corpus Assignment use **Full Set**; everything else uses **Unprotected**.
