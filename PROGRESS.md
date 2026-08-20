# Progress — Days 1–8 kit + Growth + Unified Goal Planner

**Stack update:** the app is Next.js (App Router). Calculate lives at `POST /api/calculate/:id` in `src/app/api`. TanStack Start, Vite, and the separate Express server were removed. Finance math in `packages/finance` is unchanged.

End-to-end = engine + unit tests + Zod schema + `dispatch` + UI on a live route. Unchecked rows are not started (or only partially present, e.g. `loan-emi` engine without a real Loans page).

## Tracker (23 Excel files + platform)


| Done | #   | Item                                                | Owner   | Live route / id                                |
| ---- | --- | --------------------------------------------------- | ------- | ---------------------------------------------- |
| [x]  | —   | Shared kit (engine, UI, `POST /api/calculate/:id`)  | Yash    | —                                              |
| [x]  | 1   | SIP Calculator v3                                   | Yash    | `/growth` · `growth-sip`                       |
| [x]  | 2   | SIP Step-Up v1                                      | Yash    | `/growth` · `growth-stepup`                    |
| [x]  | 3   | One-Time Investment v2                              | Yash    | `/growth` · `growth-lumpsum`                   |
| [x]  | 4   | Periodic Investment v1                              | Yash    | `/growth` · `growth-periodic`                  |
| [x]  | 5   | MF vs FD v1                                         | Prajyot | `/mf-fd` · `mf-fd`                             |
| [x]  | 6   | Loan EMI v1                                         | Prajyot | `/loans` · `loan-emi`                          |
| [x]  | 7   | Loan with Periodic Extra Payments v1                | Prajyot | `/loans` · `loan-prepay`                       |
| [x]  | 8   | Loan Extra Payment vs Investment **v2**             | Prajyot | `/loans` · `loan-extra-vs-invest`              |
| [x]  | 9   | Loan Interest Recovery v7                           | Prajyot | `/loans` · `loan-interest-recovery`            |
| [x]  | 10  | Vehicle Loan Benefit Analysis-v2 (Full Set)         | Prajyot | `/loans` · `vehicle-loan`                      |
| [x]  | 11  | Insurance IRR v1                                    | Prajyot | `/insurance` · `insurance-irr`                 |
| [x]  | 12  | Insurance Convert to TP v3                          | Prajyot | `/insurance` · `insurance-tp`                  |
| [x]  | 13  | Child Education Planner v4                          | Yash    | `/education` · `education`                     |
| [x]  | 14  | Goal SIP vs Step-up v3                              | Yash    | `/` and `/goals` · `goal-sip`                  |
| [x]  | 15  | Goal with Current Investment LS/SIP/SU              | Yash    | `/goals` · `goal-current`                      |
| [x]  | 16  | Goal LS–SIP Options v3                              | Yash    | `/goals` · `goal-ls-sip`                       |
| [x]  | 17  | Goal Existing SIP v3                                | Yash    | `/goals` · `goal-existing-sip`                 |
| [x]  | 18  | Goal Periodic Lumpsum v2                            | Yash    | `/goals` · `goal-periodic`                     |
| [x]  | 19  | Goal Power of Compounding / Growth Steps            | Yash    | `/goals` · `goal-compounding`                  |
| [x]  | 20  | Multiple Goals with Corpus Assignment v2 (Full Set) | Prajyot | `/multi-goal` · `multi-goal-assign`            |
| [x]  | 21  | SIP for Multiple Withdrawals v2                     | Prajyot | `/multi-goal` · `multi-withdrawals`            |
| [x]  | 22  | FIRE Planner v10                                    | Yash    | `/fire` · `fire-planner`                       |
| [x]  | 23  | Financial Health Analysis v4                        | Yash    | `/fire` · `financial-health`                   |
| [ ]  | —   | Excel parity QA / review                            | Both    | Days 21–22                                     |


**Checked now: 24 / 24 product rows** (kit + all Excel calculators). Excel parity QA still open.

Charts are **not** one line chart for every product. Spec: `[docs/charts.md](docs/charts.md)` (from Unprotected / Full Set Excel). `AGENTS.md` requires that file for all future UI.

---

## 1. Git ignore

These are local formula sources / SOW, not part of the app:

- `work-division.md` (and the `work-divison.md` typo)
- `Nivra SOW_V1.0-2.docx`
- `Unprotected/`
- `Nivra Tools - Full Set/`

---

## 2. Repo shape (Day 1 scaffold)

Kept the existing Goal SIP UI and moved it onto Next.js App Router (`src/app`). Finance stays in `packages/finance`.

Added npm workspaces:


| Path               | Role                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `packages/finance` | Pure math. No UI. No rounding.                                                                           |
| `packages/ui`      | Calculator kit: inputs, `CalculatorPage`, `ResultCard`, `ScheduleTable`, `GrowthChart`, INR/% formatters |
| `src/app/api`      | Next.js `POST /api/calculate/:id`                                                                        |
| `src/app`          | Shell, Goal SIP Planner, empty calculator routes                                                         |


Run:

```sh
npm install
npm test          # finance unit tests + growth dispatch fixtures
npm run dev       # Next.js on :3000 (pages + API)
```

Auth and “save calculation” were skipped on purpose.

---

## 3. Finance engine (Days 1–3)

Built and unit-tested against Unprotected SIP / One-Time / Loan EMI / Goal numbers.


| Helper                       | Excel behaviour                                                     |
| ---------------------------- | ------------------------------------------------------------------- |
| `fv` / `pv` / `pmt` / `rate` | Excel signatures, including type=1 (beginning of period)            |
| `monthlyRate`                | `(1 + r)^(1/12) - 1` for SIP / goals / periodic                     |
| `nominalMonthlyRate`         | `r / 12` for **loans only**                                         |
| Inflation                    | `present * (1+inf)^years` and the inverse                           |
| Capital-gains tax            | `tax * max(0, maturity − invested)` for growth/goals. Education taxes **fees**. |
| Education plan               | Multi-withdrawal PV (lumpsum) + GoalSeek SIP so last-year balance is 0 |
| Flat SIP                     | Maturity, invested, delay cost, optional extra invest-horizon years |
| Step-up SIP                  | Yearly step-up, start/end SIP, invested                             |
| Periodic                     | n times per year (`timesPerYear` divides 12)                        |
| Loan amort                   | EMI + month schedule                                                |
| Goal solver                  | Required SIP / lumpsum / step-up SIP so **net after tax = target**  |


Tests live in `packages/finance/tests/`. Fixtures include:

- SIP v3: ₹1,500 / 5y / 12% → maturity **121,655.42**
- One-time v2: ₹50L / 16y / 12% → maturity **3,06,51,968.25**
- Loan EMI v1: ₹75L / 20y / 9.2% → EMI **68,447.15**
- Goal v3: ₹1Cr / 15y / infl. 5.25% / tax 12.5% → SIP **49,082.47**, step-up start **27,918.05**
- Education v4: child age 5 / 12% / 12.5% tax / sample grid → lumpsum **32,31,850.69**, total withdrawal **1,67,51,587.50**

XIRR is in the engine (`irr` / `xirr` in `packages/finance`) for insurance.

---

## 4. UI kit + page template (Days 3–5)

`packages/ui` (clone this, do not invent a new layout):

- `CalculatorPage` — title, client header, form, results, disclaimer
- `MoneyInput`, `PercentInput`, `YearInput` / `AgeInput`, `SelectInput`
- `ClientHeader`, `ModeTabs`
- `ResultCard`, `ScheduleTable`, `GrowthChart`
- INR / % formatters (display only)

App shell + sidebar lists every product. **Investment Growth** (`/growth`), **Unified Goal Planner** (`/goals`), **Child Education** (`/education`), **MF vs FD** (`/mf-fd`), **Loans** (`/loans`), **Insurance** (`/insurance`), **Multi-Goal** (`/multi-goal`), and **FIRE / Health** (`/fire`) are live.

---

## 5. Goal SIP Planner (existing frontend, now wired)

The screen you already built on `/` no longer does SIP / step-up / tax / delay math in the browser.

Flow: form → `POST /api/calculate/goal-sip` → `packages/finance` → same Result cards, charts, yearly table, cost of delay, PDF.

Numbers will differ slightly from the old client-side version because Unprotected uses:

- effective monthly rate `(1+r)^(1/12)-1`, not `r/12`
- beginning-of-month SIP (Excel FV type=1)
- SIP grossed up so **net after capital-gains tax** hits the goal

---

## 6. Handoff for Prajyot

Contract: `[docs/API_CONTRACT.md](docs/API_CONTRACT.md)`

Copy **Investment Growth** (`/growth`) — the live four-mode page — and call `POST /api/calculate/:id`. No new inputs/tables/math. Do not copy `ComingSoonCalculator` zeros or the Goal SIP custom layout.

He can start **MF vs FD**, then **Loan EMI** (`loan-emi` is already implemented in the engine).

Do **not** implement Vehicle Loan or Multi-Goal corpus assignment unless he is blocked.

---

## 7. Investment Growth (Days 6–8, wired)

`/growth` is the reference calculator. Form → `calculate(id)` → `@nivra/ui` results. Defaults match Unprotected samples.


| Mode     | API id            | Default sample                                                                         |
| -------- | ----------------- | -------------------------------------------------------------------------------------- |
| SIP      | `growth-sip`      | ₹1,500 / 5y SIP / 5y horizon / 12% / infl. 5.75% / delay 6m → maturity **1,21,655.42** |
| Step-up  | `growth-stepup`   | ₹5,000 start / 10% step / 10y / 12% → maturity **16,34,449.24**                        |
| Lumpsum  | `growth-lumpsum`  | ₹50L / 16y / 12% → maturity **3,06,51,968.25**                                         |
| Periodic | `growth-periodic` | ₹1L × 2 / year / 1y / 12% / tax 12% → maturity **2,17,830.05**                         |


- Percents stay human in the form (`12` = 12%). Dispatch divides by 100.
- Result cards use full `en-IN` amounts. Chart axes may use compact `L`/`Cr`.
- `timesPerYear` must be 1, 2, 3, 4, 6, or 12. SIP `investYears` must be ≥ `sipYears`.
- Finance + dispatch fixture tests cover these four ids (`npm test`).

---

## 8. Unified Goal Planner (Days 9–14, wired)

`/goals` is the six-mode planner (clone `/growth`, not the custom `/` layout). `/` stays the existing Goal SIP vs Step-up screen (`goal-sip`).

Defaults match Goal v3: ₹1 Cr / 15y / 12% / infl. 5.25% / tax 12.5% / step-up 10%, inflation-adjusted goal on.


| Mode               | API id              | What it solves                                              |
| ------------------ | ------------------- | ----------------------------------------------------------- |
| SIP vs Step-up     | `goal-sip`          | Required SIP and step-up so net after tax = target          |
| Current investment | `goal-current`      | Existing corpus + SIP; remaining LS / SIP / step-up         |
| LS + SIP options   | `goal-ls-sip`       | All-LS vs all-SIP vs extra lumpsum + remaining SIP          |
| Existing SIP       | `goal-existing-sip` | Additional SIP = full required − current SIP                |
| Periodic lumpsum   | `goal-periodic`     | Periodic contributions first; remaining SIP / step-up       |
| Growth steps       | `goal-compounding`  | Required SIP vs lumpsum year path + extra compounding years |


Combined existing + additional uses linear net-credit `(1 − t)×FV + t×invested`, so additional SIP/LS still hits **net after tax ≈ target**. Overfunded current corpus returns 0 additional.

---

## 9. Child Education Planner (Days 15–16, wired)

`/education` clones `CalculatorPage` (not the custom Goal SIP layout). Form → `POST /api/calculate/education` → `@nivra/ui`. Defaults match Unprotected Child Education Planner v4: child age **5**, return **12%**, tax **12.5%**, Nursery–College cost grid (College-4 = ₹70L).

- Withdrawal = future fee × (1 + tax). Tax is on **fees**, not investment gain.
- Lumpsum required = backward PV of those withdrawals (Excel Q10 = **₹32,31,850.69**).
- Monthly SIP GoalSeeks last fee-year SIP balance to 0 (Excel’s cached ₹32,012 is stale vs College-4 = 70L).
- Charts: required **CompareChart** (lumpsum vs SIP: invested / tax / peak corpus). Extra **StackedBarChart** of the cost grid. No `GrowthChart`.

---

## 10. Not done yet (later days)


| When       | What                                               |
| ---------- | -------------------------------------------------- |
| Days 21–22 | Remaining Excel fixture tests + review             |


---

## 11. FIRE + Financial Health (Days 17–20, wired)

`/fire` has two modes via `CalculatorPage` + `calculate()`:

| Mode   | API id             | Defaults (Unprotected) |
| ------ | ------------------ | ---------------------- |
| FIRE   | `fire-planner`     | Age 40 / ret 55 / surv 90 · exp ₹1.5L/mo + ₹15L lifestyle · 12% / 8% post · tax 12.5% · corpus sleeves + ₹10k SIP |
| Health | `financial-health` | ₹25 Cr corpus · age 59→60 · sample ₹2 Cr expense at 62 |

Charts: FIRE line + stacked area + donut; Health `ComboChart` + donut. `ComboChart` lives in `@nivra/ui`.


