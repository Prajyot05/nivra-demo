# UI polish handoff (Yash → Prajyot)

Dev sidebar checkboxes track **UI polish**, not Excel QA.

- Locked ticks (`uiPolished: true` in `src/lib/calculator-nav.ts`) = Yash finished the wealth redesign for that calculator.
- Open rows = Prajyot can own the same wealth chrome (page title, no mode tabs, Analytics / Milestones / Schedule shell, charts per `docs/charts.md`).

Switch calculator via the **sidebar only**. In-page FIRE / Health / SIP / Step-up mode pills are removed.

## Done by Yash

- [x] Goal – SIP & Step-Up SIP (`goal-sip`)
- [x] Goal with Current Investments (`goal-current`)
- [x] Goal with Current Lumpsum (`goal-ls-sip`)
- [x] Goal with Existing SIP (`goal-existing`)
- [x] Goal with Periodic Lumpsum (`goal-periodic`)
- [x] Goal – Power of Compounding (`goal-compounding`)
- [x] SIP Calculator (`growth-sip`)
- [x] SIP Step-Up Calculator (`growth-stepup`)
- [x] One-Time Investment (`growth-lumpsum`)
- [x] Periodic Lumpsum Investment (`growth-periodic`)
- [x] Financial Health Analysis (`financial-health`)
- [x] FIRE Planner (`fire-planner`)
- Shared kit: `src/components/wealth/*` (chrome, growth line, waterfall, sections)

## Open for Prajyot

- [ ] Mutual Fund vs Fixed Deposit (`mf-fd`)
- [ ] SIP Required for Multiple Withdrawals (`multi-withdrawals`)
- [ ] Multiple Goals – Corpus Assignment (`multi-goal-assign`)
- [ ] Loan EMI with Interest Recovery (`loan-emi`)
- [ ] Loan – One Extra Payment vs Investment (`loan-extra-vs-invest`)
- [ ] Loan Restructuring with Interest Recovery (`loan-recovery`)
- [ ] Loan with Extra Yearly Payments (`loan-prepay`)
- [ ] Child Education Planner (`education`)
- [ ] Vehicle Loan Benefit Analysis (`vehicle-loan`)
- [ ] Insurance IRR Calculator (`insurance-irr`)
- [ ] Insurance – Convert to Term Plan + Investment (`insurance-tp`)

## When Prajyot finishes a page

1. Match Goals / Growth / FIRE page shell (header title + description from nav, no mode tabs).
2. Set `uiPolished: true` on that item in `src/lib/calculator-nav.ts`.
3. Tick the matching box above.
