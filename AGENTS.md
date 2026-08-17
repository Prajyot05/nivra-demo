# Nivra Calculators — Cursor / agent guide

This file is for **Cursor** and for **Prajyot**. Read it before changing calculators.

**Product:** Nivra financial calculators (Excel → web).  
**Stack:** Next.js App Router + TypeScript + Tailwind + workspaces `@nivra/finance` and `@nivra/ui`.  
**Owners:** Yash (engine, UI kit, Goals / Growth / Education / FIRE) · Prajyot (MF vs FD, Loans, Insurance, Multi-Goal).

---

## How to run

```sh
npm i
npm test          # finance unit tests (must stay green)
npm run dev       # http://localhost:3000
```

- Goal SIP Planner (wired): `/`
- Calculate API: `POST /api/calculate/:id` (same origin, no separate server)
- Health: `GET /api/health`

Contract: [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md). Progress / handoff: [`PROGRESS.md`](PROGRESS.md).

---

## Repo map

| Path | Role | Who changes it |
| --- | --- | --- |
| `packages/finance` | Pure math. No UI. **No rounding.** | Yash. Prajyot asks Yash for new formulas. |
| `packages/ui` | `CalculatorPage`, inputs, `ResultCard`, `ScheduleTable`, `GrowthChart`, INR formatters | Yash. Prajyot **reuses**, does not fork. |
| `src/app` | Next.js pages + `src/app/api` | Both — only your product routes. |
| `src/lib/calculate-*.ts` | Zod schemas + dispatch to finance | Both when adding a calculator id. |
| `src/lib/calculate-client.ts` | Browser `fetch` helper | Reuse. |
| `src/components/goal-sip-planner.tsx` | Custom Goal SIP UI | Yash only. **Do not copy this layout.** |
| `src/components/calc/coming-soon.tsx` | Starter page Prajyot clones | Replace with a real page when wiring. |

---

## Hard rules (do not break)

1. **No finance math in the UI.** No `pmt`, EMI, SIP, FV, tax, inflation, or XIRR in React. Form → `calculate(id, input)` → render `result`.
2. **Percents are human numbers** (`12` = 12%), not `0.12`. Dispatch already divides by 100.
3. **Money is INR.** Engine returns unrounded floats. Round **only** in display (`formatINR` / `formatINRCurrency` from `@nivra/ui`).
4. **Show full Indian amounts** on result cards and legends (`₹10,05,434`), not compact `L` / `Cr` (that helper is for chart axes only).
5. **Unprotected Excel is the formula source.** Full Set only for **Vehicle Loan** and **Multiple Goals with Corpus Assignment**.
6. **Loan Extra Payment** = Unprotected **v2**, not Full Set v1.
7. Do **not** implement Vehicle Loan or Multi-Goal corpus assignment unless blocked and Yash agrees.
8. Do **not** add XIRR in the frontend. Insurance IRR waits until Yash adds it to `packages/finance`.
9. Auth / save-calculation is out of scope.
10. Keep pages responsive (phone, tablet, desktop). Tables may scroll horizontally; do not clip charts.

---

## Adding an API id (checklist)

```
packages/finance/src/*.ts     + tests in packages/finance/tests/
src/lib/calculate-schemas.ts  Zod input (percents 0–100)
src/lib/calculate-dispatch.ts parse → finance fn (pct / 100)
docs/API_CONTRACT.md          input + result fields
src/app/<product>/page.tsx    UI via @nivra/ui only
```

Engine rates are **decimals** (`0.12`). API JSON rates are **percents** (`12`).

---

## Display

- Default money: `formatINR` / `formatINRCurrency` (full `en-IN`).
- `formatCompactINR` only for chart ticks / tiny labels.
- Theme tokens for Goal SIP live in `src/lib/color-themes.ts`. New calculators use `@nivra/ui` + Tailwind semantic colors (`bg-card`, `text-foreground`).

---

## Cursor behaviour

- Prefer editing the existing kit over new primitives.
- If a formula is missing, **stop and say so** — do not invent Excel-incompatible math in the page.
- After finance changes, run `npm test`.
- Do not commit `.next/`, `Unprotected/`, or `Nivra Tools - Full Set/`.
