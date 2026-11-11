/**
 * Shared PDF-safe rules for all five SIP dossier HTML styles.
 * Full INR display up to ₹99,990,00,00,000 (₹9999 Cr); scales type instead of clipping.
 */
export const SHARED_AMOUNT_CSS = `
.sheet { max-width: 100%; overflow-x: hidden; }
.minw0 { min-width: 0; }
.hero-val, .stat-val, .kpi-val, .side-val, .delay-val, .meta-val, .ass-val, .legend-value {
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: none;
}
.legend-value.amt-legend-md { font-size: 0.92em; }
.legend-value.amt-legend-sm { font-size: 0.84em; }
.delay-val.amt-delay-md { font-size: 0.88em; }
.delay-val.amt-delay-sm { font-size: 0.8em; }
.ass-val.amt-ass-md { font-size: 0.92em; }
.ass-val.amt-ass-sm { font-size: 0.84em; }
.ass-row .v.amt-ass-md { font-size: 0.9em; }
.ass-row .v.amt-ass-sm { font-size: 0.82em; }
.side-val.amt-side-md { font-size: 0.92em; }
.side-val.amt-side-sm { font-size: 0.84em; }
.bar-h.amt-bar-md { font-size: 0.9em; }
.bar-h.amt-bar-sm { font-size: 0.82em; }
.line strong.amt-meta-md { font-size: 0.92em; }
.line strong.amt-meta-sm { font-size: 0.84em; }
.meta-val.amt-meta-md { font-size: 0.92em; }
.meta-val.amt-meta-sm { font-size: 0.84em; }
table.sched { table-layout: fixed; width: 100%; }
table.sched .col-yr { width: 7%; }
table.sched .col-num { width: 14%; }
table.sched .col-infl { width: 18%; }
table.sched .col-milestone { width: 20%; }
table.sched th, table.sched td { overflow-wrap: anywhere; word-break: break-word; }
table.sched thead th {
  white-space: normal;
  line-height: 1.25;
  vertical-align: bottom;
  font-weight: 600;
  letter-spacing: 0.02em;
}
table.sched td.num, table.sched th.r { text-align: right; }
table.sched td.num { white-space: nowrap; }
table.sched td.yr, table.sched th.c { text-align: center; }
table.sched td.num.infl, table.sched th.infl {
  padding-right: 18px;
}
table.sched td.milestone, table.sched th.milestone {
  text-align: left;
  font-weight: 500;
  color: #475569;
  font-size: 0.92em;
  padding-left: 18px;
  white-space: nowrap;
}
table.sched.sched-dense { font-size: 10px; }
table.sched.sched-dense thead th { font-size: 8.5px; padding: 4px 3px; }
table.sched.sched-dense td { padding: 4px 3px; }
table.sched.sched-xdense { font-size: 9px; }
table.sched.sched-xdense thead th { font-size: 7.5px; padding: 3px 2px; }
table.sched.sched-xdense td { padding: 3px 2px; letter-spacing: -0.02em; }
.sched-head { break-inside: avoid; page-break-inside: avoid; }
`;
