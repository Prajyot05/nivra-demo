# Excel parity coverage matrix

| id | Finance golden | Dispatch golden | HNW | Excel source |
| --- | --- | --- | --- | --- |
| growth-sip | yes | yes | yes | Unprotected SIP Calculator v3 |
| growth-lumpsum | yes | yes | yes | Unprotected One-Time Investment v2 |
| growth-stepup | yes | yes | yes | Unprotected SIP Step-Up v1 |
| growth-periodic | yes | yes | yes | Unprotected Periodic Investment v1 |
| goal-sip | yes | yes | yes | Unprotected Goal SIP vs Step-up v3 |
| goal-current | yes | yes | yes | Unprotected Goal with Current Investment |
| goal-ls-sip | yes | yes | yes | Unprotected Goal LS–SIP Options v3 |
| goal-existing-sip | yes | yes | yes | Unprotected Goal Existing SIP v3 |
| goal-periodic | yes | yes | yes | Unprotected Goal Periodic Lumpsum v2 |
| goal-compounding | yes | yes | yes | Unprotected Goal Power of Compounding |
| loan-emi | yes | yes | yes | Unprotected Loan EMI v1 |
| loan-prepay | yes | yes | yes | Unprotected Loan Periodic Extra v1 |
| loan-extra-vs-invest | yes | yes | yes | Unprotected Loan Extra vs Invest v2 |
| loan-interest-recovery | yes | yes | yes | Unprotected Loan Interest Recovery v7 |
| vehicle-loan | yes | yes | yes | Full Set Vehicle Loan Benefit v2 |
| mf-fd | yes | yes | yes | Unprotected MF vs FD v1 |
| insurance-irr | yes | yes | yes | Unprotected Insurance IRR v1 |
| insurance-tp | yes | yes | yes | Unprotected Insurance Convert to TP v3 |
| multi-goal-assign | yes | yes | yes | Full Set Multiple Goals Corpus Assignment v2 |
| multi-withdrawals | yes | yes | yes | Unprotected SIP for Multiple Withdrawals v2 |
| education | yes | yes | yes | Unprotected Child Education Planner v4 |
| fire-planner | yes | yes | yes | Unprotected FIRE Planner v10 |
| financial-health | yes | yes | yes | Unprotected Financial Health Analysis v4 |

**Unprotected-sample** expects are locked to Excel cell outputs (or documented Unprotected caches).

**HNW** expects are locked regression values at affluent scale on the same engine path already verified by Unprotected samples, plus invariant tests (`netAfterTax ≈ target`, schedule integrity, tax identity).
