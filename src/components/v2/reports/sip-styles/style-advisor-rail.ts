import { advisoryReading, delaySectionCopy, playbook } from "./copy";
import { formatINR, formatPct, esc, amountClass, amountScaleCssBlock } from "./format";
import { renderScheduleTable } from "./schedule";
import { SHARED_AMOUNT_CSS } from "./shared-report-css";
import { SHARED_FOOTER_CSS, renderReportFooter } from "./shared-footer";
import { SHARED_PAGINATION_CSS } from "./shared-pagination";
import { donutSvg, factsheetColumnsSvg, legendRow } from "./svg";
import type { BuiltStyle, SipDossierData } from "./types";

/** Dark left KPI rail + light main column. Composition sits in the rail, no white cards. */
export function buildAdvisorRail(data: SipDossierData): BuiltStyle {
  const reading = advisoryReading(data);
  const pillars = playbook(data);
  const showDelay = data.delayMonths > 0;
  const scheduleHtml = renderScheduleTable(data);
  const chart = factsheetColumnsSvg(data.schedule, 560, 110);

  // Dark-rail palette: teal / mist / slate rings, light centre text.
  const nominalDonut = donutSvg(
    [
      { pct: data.nominalInvestedPct, color: "#5EEAD4" },
      { pct: data.nominalGainAfterTaxPct, color: "#94A3B8" },
      { pct: data.nominalCapitalTaxPct, color: "#475569" },
    ],
    {
      size: 132,
      stroke: 14,
      value: formatINR(data.nominalMaturity),
      textFill: "#F8FAFC",
      holeFill: "#0B1C2C",
    },
  );
  const realDonut = donutSvg(
    [
      { pct: data.realCorpusPct, color: "#5EEAD4" },
      { pct: data.realCapitalTaxPct, color: "#475569" },
    ],
    {
      size: 132,
      stroke: 14,
      value: formatINR(data.inflationAdjusted),
      textFill: "#F8FAFC",
      holeFill: "#0B1C2C",
    },
  );

  const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: #E8EEF4; color: #0F172A; }
.desktop { background: #E8EEF4; padding: 32px 16px; display: flex; justify-content: center; }
.sheet {
  width: 900px; background: #fff; padding: 0;
  font-family: "IBM Plex Sans", Inter, Arial, sans-serif; font-size: 12px; line-height: 1.45; color: #0F172A;
  display: grid; grid-template-columns: 300px 1fr;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.r { text-align: right; } .c { text-align: center; }
.teal { color: #0EA5A0; }
.nums, .r, .kpi-val, .hero-val, .legend-value { font-variant-numeric: tabular-nums; }
.rail {
  background: #0B1C2C; color: #E2E8F0; padding: 18px 16px 22px;
  display: flex; flex-direction: column; gap: 0; min-height: 100%;
}
.rail .mark {
  width: 30px; height: 30px; border: 1px solid rgba(255,255,255,0.35); color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; margin-bottom: 8px;
}
.rail .brand { font-size: 8.5px; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 4px; color: #94A3B8; }
.rail .title { font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 3px; line-height: 1.25; }
.rail .client { font-size: 11px; margin: 0 0 8px; color: #CBD5E1; }
.rail .contact { font-size: 10px; color: #94A3B8; margin: 0 0 10px; line-height: 1.4; }
.kpi { padding: 7px 0; border-top: 1px solid rgba(148,163,184,0.2); }
.kpi-label { font-size: 8.5px; letter-spacing: 0.1em; text-transform: uppercase; color: #94A3B8; margin: 0 0 2px; }
.kpi-val { font-size: 13.5px; font-weight: 700; color: #fff; margin: 0; word-break: break-word; }
.kpi-val.accent { color: #5EEAD4; }
.rail-block { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(148,163,184,0.22); }
.rail-h { font-size: 8.5px; letter-spacing: 0.12em; text-transform: uppercase; color: #94A3B8; margin: 0 0 8px; }
.ass-row { display: flex; justify-content: space-between; gap: 8px; padding: 4px 0; border-bottom: 1px solid rgba(148,163,184,0.16); font-size: 10.5px; }
.ass-row:last-child { border-bottom: 0; }
.ass-row .k { color: #94A3B8; }
.ass-row .v { color: #F8FAFC; font-weight: 600; }
.comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 8px; }
.comp-block { display: flex; flex-direction: column; align-items: center; gap: 5px; min-width: 0; }
.comp-title { font-size: 8px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94A3B8; margin: 0; align-self: stretch; text-align: center; }
.legend { width: 100%; }
.legend-row {
  display: grid; grid-template-columns: 6px minmax(0, 1fr) auto; gap: 4px; align-items: start;
  padding: 2px 0; border-bottom: 1px solid rgba(148,163,184,0.16); font-size: 8.5px; color: #E2E8F0;
}
.legend-row:last-child { border-bottom: 0; }
.swatch { display: inline-block; border-radius: 1px; margin-top: 3px; }
.legend-label { color: #CBD5E1; line-height: 1.25; }
.legend-value { font-weight: 600; color: #F8FAFC; text-align: right; word-break: break-word; }
.shortfall { font-size: 8.5px; color: #94A3B8; margin: 4px 0 0; grid-column: 1 / -1; }
.kpi-strip {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px; padding-top: 10px;
  border-top: 1px solid rgba(148,163,184,0.22);
}
.kpi-chip { background: rgba(148,163,184,0.08); padding: 7px 8px; }
.kpi-chip .kpi-label { margin: 0 0 2px; }
.kpi-chip .kpi-val { font-size: 11.5px; }
.rail-foot {
  margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(148,163,184,0.22);
}
.rail-foot p { margin: 0 0 6px; font-size: 9.5px; line-height: 1.4; color: #94A3B8; }
.rail-foot .rail-h { margin-bottom: 6px; }
.rail-stat { display: flex; justify-content: space-between; gap: 8px; padding: 5px 0; border-bottom: 1px solid rgba(148,163,184,0.14); font-size: 10px; }
.rail-stat:last-child { border-bottom: 0; }
.rail-stat .k { color: #94A3B8; }
.rail-stat .v { color: #F8FAFC; font-weight: 600; text-align: right; word-break: break-word; }
.main { padding: 22px 26px 28px; }
.hero { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.hero-card { padding: 12px; background: #F8FAFC; border-left: 3px solid #0B1C2C; }
.hero-card.right { border-left-color: #0EA5A0; background: #F0FDFA; }
.hero-label { font-size: 9px; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px; font-weight: 600; }
.hero-val { font-size: 20px; font-weight: 700; margin: 0; word-break: break-word; }
.section { margin-top: 14px; }
.section-h { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #64748B; margin: 0 0 7px; }
.reading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.reading-col { padding-top: 4px; border-top: 1px solid #0B1C2C; }
.tag { font-size: 8px; color: #64748B; font-weight: 600; margin: 0 0 1px; }
.reading-title { font-size: 10px; font-weight: 700; margin: 0 0 2px; }
.reading-body { margin: 0; font-size: 10px; line-height: 1.35; color: #475569; }
.delay { background: #FBF1F3; border: 1px solid #E8C5CC; padding: 10px; }
.delay h3 { margin: 0 0 4px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #BE5A6B; }
.delay p { margin: 0 0 8px; font-size: 11px; }
.delay-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.delay-label { font-size: 9px; color: #64748B; margin: 0 0 2px; }
.delay-val { font-size: 13px; font-weight: 700; margin: 0; word-break: break-word; }
.chart-wrap { margin-bottom: 8px; }
.sched-wrap { margin-top: 2px; }
table.sched { width: 100%; border-collapse: collapse; font-size: 10.5px; }
table.sched thead th { background: #0B1C2C; color: #fff; font-size: 9px; padding: 5px; text-align: right; text-transform: uppercase; }
table.sched thead th:first-child { text-align: center; }
table.sched td { padding: 4px 5px; border-bottom: 1px solid #E2E8F0; }
table.sched tr { break-inside: avoid; page-break-inside: avoid; }
table.sched .row-mid td { background: #F1F5F9; }
table.sched .row-final td { background: #CCFBF1; font-weight: 600; }
.caption { font-size: 10px; color: #64748B; margin: 5px 0 0; }
.playbook { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.play-num { font-size: 12px; font-weight: 700; color: #CBD5E1; margin: 0 0 1px; }
.play-title { font-size: 10px; font-weight: 700; margin: 0 0 2px; }
.play-body { margin: 0; font-size: 10px; line-height: 1.35; color: #475569; }
@media print { body, .desktop { background: #fff; padding: 0; } }
${amountScaleCssBlock({ hero: 20, kpi: 13.5 })}
${SHARED_AMOUNT_CSS}
${SHARED_FOOTER_CSS}
${SHARED_PAGINATION_CSS}
`;

  const body = `
<article class="sheet" data-style="advisor-rail">
  <aside class="rail">
    <div data-pdf-keep-together>
      <div class="mark">${esc(data.monogram)}</div>
      <p class="brand">NIVRA PRIVATE WEALTH</p>
      <h1 class="title">${esc(data.title)}</h1>
      <p class="client">${esc(data.clientName)} · Age ${data.age}</p>
      <div class="contact">
        <p>${esc(data.contactEmail)}</p>
        <p>${esc(data.contactPhone)}</p>
      </div>
      <div class="kpi-strip">
        <div class="kpi-chip"><p class="kpi-label">Monthly SIP</p><p class="${amountClass("kpi-val accent", data.monthlySip, "kpi")}">${formatINR(data.monthlySip)}</p></div>
        <div class="kpi-chip"><p class="kpi-label">Net after tax</p><p class="${amountClass("kpi-val", data.netAfterTax, "kpi")}">${formatINR(data.netAfterTax)}</p></div>
        <div class="kpi-chip"><p class="kpi-label">Nominal maturity</p><p class="${amountClass("kpi-val", data.nominalMaturity, "kpi")}">${formatINR(data.nominalMaturity)}</p></div>
        <div class="kpi-chip"><p class="kpi-label">Inflation-adjusted</p><p class="${amountClass("kpi-val accent", data.inflationAdjusted, "kpi")}">${formatINR(data.inflationAdjusted)}</p></div>
      </div>
    </div>

    <div class="rail-block" data-pdf-keep-together>
      <p class="rail-h">Assumptions</p>
      <div class="ass-row"><span class="k">SIP years</span><span class="v">${data.sipYears} yrs</span></div>
      <div class="ass-row"><span class="k">Tenure</span><span class="v">${data.tenure} yrs</span></div>
      <div class="ass-row"><span class="k">Return CAGR</span><span class="v">${formatPct(data.returnCagr)}</span></div>
      <div class="ass-row"><span class="k">Inflation</span><span class="v">${formatPct(data.inflation)}</span></div>
      <div class="ass-row"><span class="k">Tax on gains</span><span class="v">${formatPct(data.taxOnGains)}</span></div>
      <div class="ass-row"><span class="k">Delay</span><span class="v" id="delay-value">${data.delayMonths} mo</span></div>
    </div>

    <div class="rail-block" data-pdf-keep-together>
      <p class="rail-h">Corpus Composition</p>
      <div class="comp-grid">
        <div class="comp-block">
          <p class="comp-title">Nominal mix</p>
          ${nominalDonut}
          <div class="legend">
            ${legendRow("#5EEAD4", `Invested ${data.nominalInvestedPct.toFixed(1)}%`, formatINR(data.totalInvested), 6)}
            ${legendRow("#94A3B8", `Gain ${data.nominalGainAfterTaxPct.toFixed(1)}%`, formatINR(data.gainAfterTax), 6)}
            ${legendRow("#475569", `Tax ${data.nominalCapitalTaxPct.toFixed(1)}%`, formatINR(data.taxOnGain), 6)}
          </div>
        </div>
        <div class="comp-block">
          <p class="comp-title">Today Rs</p>
          ${realDonut}
          <div class="legend">
            ${legendRow("#5EEAD4", `Real ${data.realCorpusPct.toFixed(1)}%`, formatINR(data.realCorpusAfterTax), 6)}
            ${legendRow("#475569", `Tax ${data.realCapitalTaxPct.toFixed(1)}%`, formatINR(data.capitalTaxToday), 6)}
          </div>
        </div>
        <p class="shortfall">Real shortfall: ${formatINR(data.realGainShortfall)}</p>
      </div>
    </div>

    <div class="rail-foot" data-pdf-keep-together>
      <p class="rail-h">Outcome Snapshot</p>
      <div class="rail-stat"><span class="k">Total invested</span><span class="${amountClass("v", data.totalInvested, "ass")}">${formatINR(data.totalInvested)}</span></div>
      <div class="rail-stat"><span class="k">Pre-tax gain</span><span class="${amountClass("v", data.preTaxGain, "ass")}">${formatINR(data.preTaxGain)}</span></div>
      <div class="rail-stat"><span class="k">Tax on gain</span><span class="${amountClass("v", data.taxOnGain, "ass")}">${formatINR(data.taxOnGain)}</span></div>
      <div class="rail-stat"><span class="k">Real shortfall</span><span class="${amountClass("v", data.realGainShortfall, "ass")}">${formatINR(data.realGainShortfall)}</span></div>
      <p>Lead reviews with purchasing power (${formatINR(data.inflationAdjusted)}), not the headline maturity.</p>
    </div>
  </aside>

  <div class="main">
    <div class="hero" data-pdf-keep-together>
      <div class="hero-card">
        <p class="hero-label">Nominal maturity</p>
        <p class="${amountClass("hero-val", data.nominalMaturity, "hero")}">${formatINR(data.nominalMaturity)}</p>
      </div>
      <div class="hero-card right">
        <p class="hero-label">Inflation-adjusted, today's rupees</p>
        <p class="${amountClass("hero-val teal", data.inflationAdjusted, "hero")}">${formatINR(data.inflationAdjusted)}</p>
      </div>
    </div>

    <section class="section">
      <div class="reading-block" data-pdf-keep-together>
        <h2 class="section-h">Advisory Reading</h2>
        <div class="reading">
          ${reading.map((b, i) => `<div class="reading-col"><p class="tag">0${i + 1}</p><p class="reading-title">${esc(b.title)}</p><p class="reading-body">${esc(b.body)}</p></div>`).join("")}
        </div>
      </div>
    </section>

    <section class="section" id="cost-of-delay" data-pdf-keep-together ${showDelay ? "" : "hidden"}>
      <div class="delay">
        <h3>Cost of Delay</h3>
        <p>${esc(delaySectionCopy(data))}</p>
        <div class="delay-grid">
          <div><p class="delay-label">On-time maturity</p><p class="${amountClass("delay-val", data.delayedOnTime, "delay")}">${formatINR(data.delayedOnTime)}</p></div>
          <div><p class="delay-label">Delayed maturity</p><p class="${amountClass("delay-val", data.delayedMaturity, "delay")}">${formatINR(data.delayedMaturity)}</p></div>
          <div><p class="delay-label">Capital penalty</p><p class="${amountClass("delay-val", data.capitalPenalty, "delay")}">${formatINR(data.capitalPenalty)}</p></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="sched-head" data-pdf-keep-together>
        <h2 class="section-h">Yearly Accumulation Schedule</h2>
      </div>
      <div class="chart-wrap">${chart}</div>
      ${scheduleHtml}
      <p class="caption">${data.investYears} cycles · full return vs inflation-adjusted</p>
    </section>

    <section class="section">
      <div class="playbook-block" data-pdf-keep-together>
        <h2 class="section-h">Advisory Playbook</h2>
        <div class="playbook">
          ${pillars.map((p) => `<div><p class="play-num">${p.id}</p><p class="play-title">${esc(p.title)}</p><p class="play-body">${esc(p.body)}</p></div>`).join("")}
        </div>
      </div>
    </section>

    ${renderReportFooter(data.disclaimer)}
  </div>
</article>`;

  return {
    fontLinks: ["https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"],
    css,
    body,
    desktopBg: "#E8EEF4",
  };
}
