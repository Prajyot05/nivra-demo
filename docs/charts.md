# Calculator charts

Read this file before adding or changing a chart. Do **not** put the same line `GrowthChart` on every calculator.

**Required** = Excel chart (or inferred if Excel has none). **Recommended extra** = web-only views that make the same `result` easier to read. Ship **required** first. Add extras only from this list (desktop: required + one extra; phone: required, extra below or behind a tab).

Source: Unprotected workbooks. Full Set only for **Vehicle Loan** and **Multiple Goals**. Excel 3D pie → **2D donut** on the web.

`formatCompactINR` is for axis ticks only. Legends and result cards use full `en-IN` (`formatINRCurrency`).

---

## Kit primitives (`@nivra/ui`)

Add to the kit when a page needs them. Do not paste one-off Recharts into `src/app`.

| Component | Excel type | Use for |
| --- | --- | --- |
| `GrowthChart` | `lineChart` | Value over **time** (month / year / age). |
| `CompositionChart` | `pieChart` / `pie3DChart` | Mix of invested / gain / tax. Donut, not 3D. |
| `CompareChart` | `barChart` `barDir=col` clustered | Side-by-side **options** (SIP vs step-up, MF vs FD). |
| `ComboChart` | column + line | Financial Health: corpus columns + overlay vs **age**. **Shipped** in `@nivra/ui`. |
| `StackedBarChart` | (web extra) | Two parts of one total: principal vs interest, existing vs additional. |
| `StackedAreaChart` | (web extra) | Mix **over time**: remaining principal vs interest paid; FIRE save vs withdraw. |
| `WaterfallChart` | (web extra) | How a goal is funded: existing → additional → target (or shortfall). |

`/` (Goal SIP Planner) already has donut + clustered compare. That is the reference for composition + compare. Do not clone `goal-sip-planner.tsx`.

---

## How to pick

1. Excel has a chart → that is **required**.
2. Excel has no chart → **required** is the inferred primary below. Do not default to a line.
3. Then add **at most one** recommended extra from the same row (or a tab: “Mix” / “Over time” / “Compare”).
4. A pie and a time series are not interchangeable. A delay-cost table does not replace a delay **bar**.

---

## Per calculator

| # | Product | Route / id | Required (Excel or inferred) | Recommended extra (ours) |
| --- | --- | --- | --- | --- |
| 1 | SIP v3 | `/growth` · `growth-sip` | **Line** `GrowthChart`: Investment, Delayed, Inflation-adjusted, Full return (x = months) | **Donut** invested / gain / tax. Optional small **compare**: on-time vs delayed maturity (cost of delay). |
| 2 | SIP Step-Up v1 | `/growth` · `growth-stepup` | **Line** `GrowthChart`: same four series as SIP | **Donut** invested / gain / tax. Optional **compare**: start SIP vs end SIP (two columns). |
| 3 | One-Time v2 | `/growth` · `growth-lumpsum` | **Line** `GrowthChart`: Full return, Inflation-adjusted | **Donut** invested / gain / tax. Optional **compare**: on-time vs delayed maturity. |
| 4 | Periodic v1 | `/growth` · `growth-periodic` | **Pie** `CompositionChart`: Periodic invested, gain, tax | **Line** of each contribution’s FV (payment # on x) — Excel pie hides timing. |
| 5 | MF vs FD v1 | `/mf-fd` | **Inferred compare** `CompareChart`: MF vs FD — invested, gain, tax, net | **Two donuts** (MF mix \| FD mix). If API returns a schedule: **line** of both corpuses vs years. |
| 6 | Loan EMI v1 | `/loans` · `loan-emi` | **Line** `GrowthChart`: Principal payment, Interest payment by month | **Donut** lifetime principal vs lifetime interest. **Stacked area** of remaining principal vs interest paid to date (better than two lines for “what’s left”). |
| 7 | Loan extra prepay v1 | `/loans` | **Inferred line**: outstanding balance scheduled vs with extra | **Compare**: total interest original vs prepaid; tenure (months) original vs prepaid. |
| 8 | Extra pay vs invest v2 | `/loans` | **Inferred compare**: prepay vs invest (interest saved, corpus, net) | **Line** of both paths over years (loan outstanding falling vs investment rising). |
| 9 | Interest recovery v7 | `/loans` | **Line**: Baseline, SIP value, Proposed / loan+SIP | **Compare** at horizon: loan-only wealth vs loan+SIP wealth. |
| 10 | Vehicle loan (Full Set) | Vehicle | **Clustered columns**: No loan, FD, MF debt, conservative, equity | **Stacked bar** per option: tax shield vs opportunity cost vs net benefit (Excel only shows one net bar). |
| 11 | Insurance IRR v1 | `/insurance` | **Pie**: Premium paid, gain, tax | **Compare** cash in vs cash out (premiums vs maturity). Optional **waterfall** of IRR build if XIRR exists. |
| 12 | Convert to TP v3 | `/insurance` | **Inferred compare**: keep policy vs surrender + term + invest | **Line** of switched corpus vs years. **Donut** of new mix (term cost vs invested). |
| 13 | Child Education v4 | `/education` | **Inferred compare**: lumpsum vs SIP (invested, tax, corpus) | **Stacked columns** of year-wise education cost (the cost grid as a chart). Optional **line** of corpus vs year until each fee year. |
| 14 | Goal SIP vs Step-up v3 | `/` · `/goals` · `goal-sip` | **Clustered columns**: Invested / tax / corpus for SIP vs Step-up. `/` already also has **donuts**. | Keep delay as table **or** small **compare** of extra invested at 3/6/9/12 months. `/goals` must not use a line as the primary. |
| 15 | Goal + current LS/SIP/SU | `/goals` · `goal-current` | **Inferred compare**: extra LS vs extra SIP vs extra step-up (invested / tax / corpus) | **Waterfall**: existing net credit → additional → target. **Donut** existing vs additional. |
| 16 | Goal LS–SIP options v3 | `/goals` · `goal-ls-sip` | **Pie**: current corpus, corpus gain, lumpsum, lumpsum gain, SIP invested, SIP gain | **Compare** the three **options**: all-LS vs all-SIP vs mix (monthly SIP + extra LS). That is the point of the sheet; the pie only shows mix. |
| 17 | Goal existing SIP v3 | `/goals` · `goal-existing-sip` | **Donut** (Excel 3D pie): SIP1 invested, SIP2 invested, SIP1 gain, SIP2 gain | **Compare** existing SIP vs additional SIP (monthly + corpus). |
| 18 | Goal periodic lumpsum v2 | `/goals` · `goal-periodic` | **Pie/donut**: periodic invested, periodic gain. **Waterfall**: periodic credit → additional → target | **Compare** remaining SIP vs remaining step-up (invested / corpus). Monthly SIP as hero KPIs, not on the same bar scale. |
| 19 | Power of compounding | `/goals` · `goal-compounding` | **Inferred:** clustered **columns or line** of SIP year-end vs lumpsum year-end (growth **steps**) | **Donut** SIP invested vs gain at goal year. **Compare** delay extra invested (3/6/9/12 mo). **Line** of extra years after goal (`sipAfterExtra` vs `lumpsumAfterExtra`). |
| 20 | Multi-goal corpus assign | `/multi-goal` (blocked) | **Inferred compare / stacked**: corpus assigned per goal | **Stacked bar**: assigned vs remaining. Optional **timeline** (goal year on x, one bar per goal) — closer to Excel’s roadmap than a pie. |
| 21 | SIP multiple withdrawals v2 | `/multi-goal` | **Clustered columns**: corpus by **age** at withdrawals | **Line / area** of corpus over age with **drops** at withdrawal years (columns hide the path). |
| 22 | FIRE Planner v10 | `/fire` | **Inferred line**: corpus vs **age**, mark retirement | **Stacked area**: contributions vs withdrawals after FIRE. **Donut** at retirement: invested vs gain. Optional **compare**: delay 0 vs 5 years to FIRE age. |
| 23 | Financial Health v4 | `/fire` | **Combo** columns + line vs age (Excel) | **Donut** of current savings vs retirement gap. Optional **compare** “with events” vs “no events” if the API returns both. |

---

## Why the extras

- **Donut on growth/loans/insurance:** Excel lines never show invested vs gain vs tax in one glance; `/` already proved this pair works.
- **Waterfall on goals with existing money:** the question is “how much is still needed?”, not another time series.
- **Compare of options** on LS–SIP (#16) and extra-vs-invest (#8): the product is a **choice**, so columns beat a pie.
- **Stacked area on EMI / FIRE:** mix over time (interest vs principal, save vs spend) is the story.
- **Line on withdrawals / delay:** columns by age miss the drop; a line with gaps matches how people think about corpus.

Do **not** add extras that need new math. Only plot fields already on `result`.

---

## Live pages vs this spec (fix when touching the UI)

| Page | Today | Required | Extra when you next edit |
| --- | --- | --- | --- |
| `/` Goal SIP | Donut + clustered compare | **OK** | Optional delay bars |
| `/growth` SIP / step-up / lumpsum | Line + donut | **OK** | Donut shipped |
| `/growth` Periodic | Pie + contribution-FV line | **OK** | — |
| `/goals` SIP vs Step-up | Clustered compare + delay table | **OK** | — |
| `/goals` Current | Compare extra LS/SIP/SU + waterfall | **OK** | — |
| `/goals` LS–SIP | Mix pie + options compare | **OK** | — |
| `/goals` Existing SIP | Donut + existing vs additional compare | **OK** | — |
| `/goals` Periodic | Waterfall + donut (invested/gain) + remaining SIP vs step-up compare | **OK** | Monthly SIP shown as KPI cards, not on compare scale |
| `/goals` Compounding | Line of growth steps + SIP donut | **OK** | — |
| `/education` | Compare + stacked cost bars | **OK** | Optional corpus-vs-year line |
| `/mf-fd` | Clustered compare + two donuts | **OK** | — |
| `/loans` EMI | Line + donut + stacked area | **OK** | — |
| `/loans` Prepay | Line outstanding + compare | **OK** | — |
| `/loans` Extra vs invest | Compare + path line | **OK** | — |
| `/loans` Recovery | Three-line + compare | **OK** | — |
| `/loans` Vehicle | Clustered benefit + stacked bar | **OK** | — |
| `/insurance` IRR | Pie + cash compare | **OK** | — |
| `/insurance` TP | Keep vs switch compare | **OK** | — |
| `/multi-goal` Assign | Compare / stacked assigned | **OK** | — |
| `/multi-goal` Withdrawals | Columns by age + line | **OK** | — |
| `/multi-goal` Withdrawals | Columns by age + line | **OK** | — |
| `/fire` FIRE | Line + stacked area + donut | **OK** | Optional delay compare shipped |
| `/fire` Health | Combo + donut | **OK** | — |

---

## Implementation rules

1. **No finance math in the chart.** Plot `result` fields only.
2. **Theme:** `var(--app-chart-invested|gain|tax)` (hex from `COLOR_THEMES.chart` if needed).
3. **Pie/donut:** 2–6 slices, never 3D, hole ~60–70%.
4. **Compare:** clustered **vertical** columns. **Stacked bar** only when the row says stacked.
5. **Line:** x = month, year, or age as specified. Not payment index unless the extra for Periodic says so.
6. **Responsive:** do not clip charts. Phone: one chart visible; extra under a tab or below.
7. Missing kit component → add it in `@nivra/ui`, then use it. No Recharts in `src/app`.
8. Required always ships. Extra is optional but, if you add a second chart, it **must** be one listed in **Recommended extra** for that id.

---

## Inventory method

Required types come from `xl/charts/chart*.xml` (`pie3DChart` → donut, `barDir=col` → clustered columns, Financial Health = `barChart` + `scatterChart`). Files with drawings but no chart XML are **inferred**. Recommended extras are web-only and must not replace the required chart.
