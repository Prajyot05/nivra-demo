import { advisoryReading, delaySectionCopy, playbook } from "./copy";
import { formatINR, formatPct, esc } from "./format";
import { renderScheduleTable } from "./schedule";
import { donutSvg, factsheetColumnsSvg, legendRow } from "./svg";
import type { BuiltStyle, SipDossierData } from "./types";

export function buildFactsheet(data: SipDossierData): BuiltStyle {
  const reading = advisoryReading(data);
  const pillars = playbook(data);
  const showDelay = data.delayMonths > 0;
  const scheduleHtml = renderScheduleTable(data);
  const chart = factsheetColumnsSvg(data.schedule, 560, 110);

  const nominalDonut = donutSvg(
    [
      { pct: data.nominalInvestedPct, color: "#12223F" },
      { pct: data.nominalGainAfterTaxPct, color: "#0B7A5B" },
      { pct: data.nominalCapitalTaxPct, color: "#64748B" },
    ],
    {
      size: 118,
      stroke: 14,
      label: "Maturity",
      value: formatINR(data.nominalMaturity),
      holeFill: "#F5F7FA",
    },
  );
  const realDonut = donutSvg(
    [
      { pct: data.realCorpusPct, color: "#12223F" },
      { pct: data.realCapitalTaxPct, color: "#64748B" },
    ],
    {
      size: 118,
      stroke: 14,
      label: "Today Rs",
      value: formatINR(data.inflationAdjusted),
      holeFill: "#F5F7FA",
    },
  );

  const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: #F1F3F6; color: #0F172A; }
.desktop { background: #F1F3F6; padding: 32px 16px; display: flex; justify-content: center; }
.sheet {
  width: 900px; background: #FFFFFF; padding: 32px;
  font-family: "IBM Plex Sans", Inter, Arial, sans-serif;
  font-size: 12px; line-height: 1.45; color: #0F172A;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.r { text-align: right; } .c { text-align: center; }
.emerald { color: #0B7A5B; }
.nums, .r, .stat-val, .hero-val, .side-val { font-variant-numeric: tabular-nums; }
.section { margin-top: 14px; break-inside: avoid; page-break-inside: avoid; }
.section-h {
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
  color: #12223F; margin: 0 0 7px; padding-bottom: 4px;
  border-bottom: 2px solid #12223F; display: inline-block; min-width: 36px;
}
.band {
  background: #12223F; color: #fff; padding: 20px 24px; display: flex; justify-content: space-between;
  align-items: flex-start; gap: 16px; margin: -32px -32px 16px;
}
.band-left { display: flex; gap: 10px; align-items: flex-start; }
.mark {
  width: 32px; height: 32px; border: 1px solid #fff; color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;
}
.brand { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 3px; opacity: 0.9; }
.title { font-size: 18px; font-weight: 600; margin: 0 0 2px; }
.client { font-size: 12px; margin: 0; opacity: 0.9; }
.band-contact { text-align: right; font-size: 11px; color: #CBD5E1; }
.layout { display: grid; grid-template-columns: 248px 1fr; gap: 16px; align-items: start; }
.sidebar { background: #F5F7FA; padding: 14px 12px; }
.sidebar .hero-val, .sidebar .side-val, .legend-value { word-break: break-word; }
.side-block + .side-block { margin-top: 12px; padding-top: 12px; border-top: 1px solid #D5DBE3; }
.side-row { padding: 6px 0; border-bottom: 1px solid #D5DBE3; }
.side-row:last-child { border-bottom: 0; }
.side-label { font-size: 9px; color: #64748B; margin: 0 0 2px; }
.side-val { font-size: 12px; font-weight: 600; margin: 0; }
.ass-row { display: flex; justify-content: space-between; gap: 6px; padding: 5px 0; border-bottom: 1px solid #D5DBE3; font-size: 11px; }
.ass-row:last-child { border-bottom: 0; }
.ass-row .k { color: #64748B; }
.ass-row .v { font-weight: 600; text-align: right; }
.donut-stack { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 8px; }
.donut-stack + .donut-stack { margin-top: 12px; }
.comp-title { font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #12223F; align-self: flex-start; margin: 0; }
.legend { width: 100%; }
.legend-row { display: grid; grid-template-columns: 8px 1fr auto; gap: 5px; align-items: center; padding: 2px 0; border-bottom: 1px solid #D5DBE3; font-size: 10px; }
.legend-row:last-child { border-bottom: 0; }
.swatch { display: inline-block; }
.legend-value { font-weight: 600; }
.shortfall { font-size: 10px; color: #64748B; margin: 4px 0 0; align-self: flex-start; }
.delay { background: #FBF1F3; border: 1px solid #E8C5CC; padding: 8px; }
.delay h3 { margin: 0 0 4px; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #BE5A6B; }
.delay p { margin: 0 0 6px; font-size: 10.5px; }
.delay-item { padding: 4px 0; border-bottom: 1px solid #E8C5CC; }
.delay-item:last-child { border-bottom: 0; }
.delay-label { font-size: 9px; color: #64748B; margin: 0; }
.delay-val { font-size: 12px; font-weight: 600; margin: 1px 0 0; }
.main { min-width: 0; }
.hero { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.hero-card { padding: 10px; }
.hero-left { background: #F5F7FA; }
.hero-right { background: #EAF4EE; }
.hero-label { font-size: 9px; color: #64748B; margin: 0 0 3px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
.hero-val { font-size: 22px; font-weight: 600; margin: 0; }
.hero-cap { font-size: 10px; color: #64748B; margin: 3px 0 0; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 10px; border-top: 1px solid #D5DBE3; border-bottom: 1px solid #D5DBE3; }
.stat { padding: 8px; }
.stat + .stat { border-left: 1px solid #D5DBE3; }
.stat-label { font-size: 9px; color: #64748B; margin: 0 0 2px; }
.stat-val { font-size: 13px; font-weight: 600; margin: 0; }
.reading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.reading-col { padding-top: 4px; border-top: 1px solid #12223F; }
.reading-num { font-size: 8px; color: #64748B; font-weight: 600; margin: 0 0 1px; }
.reading-title { font-size: 10px; font-weight: 600; margin: 0 0 2px; color: #12223F; }
.reading-body { margin: 0; font-size: 10px; line-height: 1.35; color: #334155; }
.chart-wrap { margin-bottom: 6px; }
.sched-wrap { margin-top: 2px; }
table.sched { width: 100%; border-collapse: collapse; font-size: 10.5px; }
table.sched thead th { background: #12223F; color: #fff; font-weight: 600; font-size: 9px; padding: 0 5px; height: 20px; text-align: right; }
table.sched thead th:first-child { text-align: center; }
table.sched td { padding: 0 5px; height: 20px; border-bottom: 1px solid #D5DBE3; }
table.sched tr { break-inside: avoid; page-break-inside: avoid; }
table.sched .row-mid td { background: #F1F5F9; }
table.sched .row-final td { background: #DCEFE6; font-weight: 600; }
.caption { font-size: 10px; color: #64748B; margin: 4px 0 0; }
.playbook { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.play-num { font-size: 12px; font-weight: 600; color: #64748B; margin: 0 0 1px; }
.play-title { font-size: 10px; font-weight: 600; margin: 0 0 2px; color: #12223F; }
.play-body { margin: 0; font-size: 10px; line-height: 1.35; }
.footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid #D5DBE3; grid-column: 1 / -1; }
.disclaimer { font-size: 10px; color: #64748B; margin: 0 0 8px; }
.powered { text-align: center; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B; margin: 0; }
@media print { body, .desktop { background: #fff; padding: 0; } .layout { grid-template-columns: 248px 1fr; } }
`;

  const body = `
<article class="sheet" data-style="factsheet">
  <header class="band" data-pdf-keep-together>
    <div class="band-left">
      <div class="mark">${esc(data.monogram)}</div>
      <div>
        <p class="brand">NIVRA PRIVATE WEALTH</p>
        <h1 class="title">${esc(data.title)}</h1>
        <p class="client">${esc(data.clientName)} · Age ${data.age}</p>
      </div>
    </div>
    <div class="band-contact">
      <p>${esc(data.contactEmail)}</p>
      <p>${esc(data.contactPhone)}</p>
    </div>
  </header>

  <div class="layout">
    <aside class="sidebar">
      <div class="side-block" data-pdf-keep-together>
        <h2 class="section-h">Key Meta</h2>
        <div class="side-row"><p class="side-label">Client</p><p class="side-val">${esc(data.clientName)}</p></div>
        <div class="side-row"><p class="side-label">Timeline</p><p class="side-val">Age ${data.age} to ${data.endAge} (${data.investYears} yrs)</p></div>
        <div class="side-row"><p class="side-label">Monthly SIP</p><p class="side-val emerald">${formatINR(data.monthlySip)}</p></div>
      </div>

      <div class="side-block" data-pdf-keep-together>
        <h2 class="section-h">Assumptions</h2>
        <div class="ass-row"><span class="k">Client age</span><span class="v">${data.age} yrs</span></div>
        <div class="ass-row"><span class="k">Monthly SIP</span><span class="v">${formatINR(data.monthlySip)}</span></div>
        <div class="ass-row"><span class="k">SIP years</span><span class="v">${data.sipYears} yrs</span></div>
        <div class="ass-row"><span class="k">Tenure</span><span class="v">${data.tenure} yrs</span></div>
        <div class="ass-row"><span class="k">Return CAGR</span><span class="v emerald">${formatPct(data.returnCagr)}</span></div>
        <div class="ass-row"><span class="k">Inflation</span><span class="v">${formatPct(data.inflation)}</span></div>
        <div class="ass-row"><span class="k">Tax on gains</span><span class="v">${formatPct(data.taxOnGains)}</span></div>
        <div class="ass-row"><span class="k">Delay</span><span class="v" id="delay-value">${data.delayMonths} mo</span></div>
      </div>

      <div class="side-block" data-pdf-keep-together>
        <h2 class="section-h">Corpus Composition</h2>
        <div class="donut-stack">
          <p class="comp-title">Nominal mix</p>
          ${nominalDonut}
          <div class="legend">
            ${legendRow("#12223F", `Invested ${data.nominalInvestedPct.toFixed(1)}%`, formatINR(data.totalInvested), 8)}
            ${legendRow("#0B7A5B", `Gain after tax ${data.nominalGainAfterTaxPct.toFixed(1)}%`, formatINR(data.gainAfterTax), 8)}
            ${legendRow("#64748B", `Capital tax ${data.nominalCapitalTaxPct.toFixed(1)}%`, formatINR(data.taxOnGain), 8)}
          </div>
        </div>
        <div class="donut-stack">
          <p class="comp-title">Real purchasing power</p>
          ${realDonut}
          <div class="legend">
            ${legendRow("#12223F", `Real corpus ${data.realCorpusPct.toFixed(1)}%`, formatINR(data.realCorpusAfterTax), 8)}
            ${legendRow("#64748B", `Capital tax ${data.realCapitalTaxPct.toFixed(1)}%`, formatINR(data.capitalTaxToday), 8)}
          </div>
          <p class="shortfall">Real shortfall: ${formatINR(data.realGainShortfall)}</p>
        </div>
      </div>

      <div class="side-block" id="cost-of-delay" data-pdf-keep-together ${showDelay ? "" : "hidden"}>
        <div class="delay">
          <h3>Cost of Delay</h3>
          <p>${esc(delaySectionCopy(data))}</p>
          <div class="delay-item"><p class="delay-label">On-time maturity</p><p class="delay-val">${formatINR(data.delayedOnTime)}</p></div>
          <div class="delay-item"><p class="delay-label">Delayed maturity</p><p class="delay-val">${formatINR(data.delayedMaturity)}</p></div>
          <div class="delay-item"><p class="delay-label">Capital penalty</p><p class="delay-val">${formatINR(data.capitalPenalty)}</p></div>
        </div>
      </div>
    </aside>

    <div class="main">
      <div class="hero" data-pdf-keep-together>
        <div class="hero-card hero-left">
          <p class="hero-label">Nominal maturity</p>
          <p class="hero-val">${formatINR(data.nominalMaturity)}</p>
          <p class="hero-cap">${formatPct(data.returnCagr)} CAGR over ${data.investYears} years</p>
        </div>
        <div class="hero-card hero-right">
          <p class="hero-label">Inflation-adjusted</p>
          <p class="hero-val emerald">${formatINR(data.inflationAdjusted)}</p>
          <p class="hero-cap">Today's rupees at ${formatPct(data.inflation)} inflation</p>
        </div>
      </div>

      <div class="stats" data-pdf-keep-together>
        <div class="stat"><p class="stat-label">Invested</p><p class="stat-val">${formatINR(data.totalInvested)}</p></div>
        <div class="stat"><p class="stat-label">Pre-tax gain</p><p class="stat-val">${formatINR(data.preTaxGain)}</p></div>
        <div class="stat"><p class="stat-label">Net after tax</p><p class="stat-val">${formatINR(data.netAfterTax)}</p></div>
        <div class="stat"><p class="stat-label">Monthly SIP</p><p class="stat-val">${formatINR(data.monthlySip)}</p></div>
      </div>

      <section class="section" data-pdf-keep-together>
        <h2 class="section-h">Advisory Reading</h2>
        <div class="reading">
          ${reading.map((b, i) => `<div class="reading-col"><p class="reading-num">0${i + 1}</p><p class="reading-title">${esc(b.title)}</p><p class="reading-body">${esc(b.body)}</p></div>`).join("")}
        </div>
      </section>

      <section class="section" data-pdf-keep-together>
        <h2 class="section-h">Yearly Accumulation Schedule</h2>
        <div class="chart-wrap">${chart}</div>
        ${scheduleHtml}
        <p class="caption">${data.investYears} cycles · full return vs inflation-adjusted</p>
      </section>

      <section class="section" data-pdf-keep-together>
        <h2 class="section-h">Advisory Playbook</h2>
        <div class="playbook">
          ${pillars.map((p) => `<div><p class="play-num">${p.id}</p><p class="play-title">${esc(p.title)}</p><p class="play-body">${esc(p.body)}</p></div>`).join("")}
        </div>
      </section>
    </div>

    <footer class="footer" data-pdf-keep-together>
      <p class="disclaimer">${esc(data.disclaimer)}</p>
      <p class="powered">${esc(data.footer)}</p>
    </footer>
  </div>
</article>`;

  return {
    fontLinks: ["https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"],
    css,
    body,
    desktopBg: "#F1F3F6",
  };
}
