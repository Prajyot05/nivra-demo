# Progress — Days 1–5 shared kit + Goal SIP wiring

**Stack update:** the app is Next.js (App Router). Calculate lives at `POST /api/calculate/:id` in `src/app/api`. TanStack Start, Vite, and the separate Express server were removed. Finance math in `packages/finance` is unchanged.

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
npm test          # finance unit tests
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
| Capital-gains tax            | `tax * max(0, maturity − invested)`                                 |
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

XIRR is **not** in the engine yet (wait until those screens).

---

## 4. UI kit + page template (Days 3–5)

`packages/ui` (clone this, do not invent a new layout):

- `CalculatorPage` — title, client header, form, results, disclaimer
- `MoneyInput`, `PercentInput`, `YearInput` / `AgeInput`
- `ClientHeader`, `ModeTabs`
- `ResultCard`, `ScheduleTable`, `GrowthChart`
- INR / % formatters (display only)

App shell + sidebar lists every product. Empty routes (Growth, Education, FIRE, MF vs FD, Loans, Insurance, Multi-Goal) use the same template and tell Prajyot which `calculator id` to call.

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

Copy `/growth` (Investment Growth page) and call `POST /api/calculate/:id`. No new inputs/tables/math.

He can start **MF vs FD**, then **Loan EMI** (`loan-emi` is already implemented in the engine).

Do **not** implement Vehicle Loan or Multi-Goal corpus assignment unless he is blocked.

---

## 7. Not done yet (later days)


| When       | What                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| Days 6–8   | Wire Investment Growth four modes (SIP / Lumpsum / Step-up / Periodic) for real |
| Days 9–14  | Rest of Unified Goal Planner modes                                              |
| Days 15–16 | Child Education                                                                 |
| Days 17–20 | FIRE + Financial Health                                                         |
| Days 21–22 | Remaining Excel fixture tests + review Prajyot PRs                              |


