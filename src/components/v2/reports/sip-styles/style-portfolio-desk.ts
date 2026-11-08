import { advisoryReading, delaySectionCopy, playbook } from "./copy";
import { formatINR, formatPct, esc } from "./format";
import { renderScheduleTable } from "./schedule";
import { donutSvg, legendRow, stackedBarSvg } from "./svg";
import type { BuiltStyle, SipDossierData } from "./types";

/** Polished desk layout: KPI band, outcomes panel, clear schedule column. */
export function buildPortfolioDesk(data: SipDossierData): BuiltStyle {
  const reading = advisoryReading(data);
  const pillars = playbook(data);
  const showDelay = data.delayMonths > 0;
  const scheduleHtml = renderScheduleTable(data);

  const bar1 = stackedBarSvg(
    [
      { pct: data.nominalInvestedPct, color: "#1E3A5F", label: "Invested" },
      { pct: data.nominalGainAfterTaxPct, color: "#0B7A5B", label: "Gain after tax" },
      { pct: data.nominalCapitalTaxPct, color: "#94A3B8", label: "Capital tax" },
    ],
    280,
    10,
  );
  const bar2 = stackedBarSvg(
    [
      { pct: data.realCorpusPct, color: "#1E3A5F", label: "Real corpus" },
      { pct: data.realCapitalTaxPct, color: "#94A3B8", label: "Capital tax" },
    ],
    280,
    10,
  );

  const nominalDonut = donutSvg(
    [
      { pct: data.nominalInvestedPct, color: "#1E3A5F" },
      { pct: data.nominalGainAfterTaxPct, color: "#0B7A5B" },
      { pct: data.nominalCapitalTaxPct, color: "#94A3B8" },
    ],
    {
      size: 120,
      stroke: 14,
      label: "Maturity",
      value: formatINR(data.nominalMaturity),
      holeFill: "#F7F9FC",
    },
  );

  const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: #E9EEF4; color: #0F172A; }
.desktop { background: #E9EEF4; padding: 32px 16px; display: flex; justify-content: center; }
.sheet {
  width: 900px; background: #fff; padding: 0 0 30px;
  font-family: Inter, Arial, sans-serif; font-size: 12px; line-height: 1.45; color: #0F172A;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.pad { padding: 0 28px; }
.r { text-align: right; } .c { text-align: center; }
.teal { color: #0B7A5B; }
.nums, .r, .kpi-val, .hero-val { font-variant-numeric: tabular-nums; }
.band {
  background: #1E3A5F; color: #fff; padding: 20px 28px;
  display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;
}
.band-left { display: flex; gap: 12px; align-items: flex-start; }
.mark {
  width: 34px; height: 34px; border: 1px solid rgba(255,255,255,0.45); color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px;
}
.brand { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 4px; opacity: 0.8; }
.title { font-size: 20px; font-weight: 700; margin: 0 0 3px; letter-spacing: -0.01em; }
.client { font-size: 12px; margin: 0; opacity: 0.9; }
.contact { font-size: 11px; color: #CBD5E1; text-align: right; margin: 0; }
.kpi-band {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 0;
  border-bottom: 1px solid #D5DBE3; background: #F7F9FC;
}
.kpi { padding: 11px 14px; }
.kpi + .kpi { border-left: 1px solid #D5DBE3; }
.kpi-label { font-size: 9px; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 3px; }
.kpi-val { font-size: 14px; font-weight: 700; margin: 0; }
.desk { display: grid; grid-template-columns: 300px 1fr; gap: 16px; margin-top: 16px; align-items: start; }
.hero-val, .kpi-val, .legend-value { word-break: break-word; }
.panel { background: #F7F9FC; border: 1px solid #E2E8F0; padding: 14px 13px; }
.panel-h { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748B; margin: 0 0 9px; }
.hero-stack { display: grid; gap: 9px; margin-bottom: 14px; }
.hero-card { padding: 11px 12px; background: #fff; border: 1px solid #E2E8F0; border-left: 3px solid #1E3A5F; }
.hero-card.real { border-left-color: #0B7A5B; background: #F3FAF7; border-color: #C6E7D8; }
.hero-label { font-size: 9px; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 3px; }
.hero-val { font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
.ass-row { display: flex; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px solid #E2E8F0; font-size: 11px; }
.ass-row:last-child { border-bottom: 0; }
.ass-row .k { color: #64748B; }
.ass-row .v { font-weight: 600; }
.mix { margin-top: 14px; padding-top: 12px; border-top: 1px solid #E2E8F0; }
.mix-row { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 12px; }
.mix-row .legend { width: 100%; }
.bar-block { margin-top: 10px; }
.bar-h { font-size: 10px; font-weight: 700; margin: 0 0 4px; }
.bar-labels { display: flex; flex-wrap: wrap; gap: 4px 8px; margin-top: 4px; font-size: 9.5px; color: #475569; }
.seg { display: inline-flex; align-items: center; gap: 4px; }
.seg i { width: 7px; height: 7px; display: inline-block; }
.shortfall { font-size: 10px; color: #64748B; margin: 4px 0 0; }
.section { margin-top: 14px; break-inside: avoid; page-break-inside: avoid; }
.section-h { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #64748B; margin: 0 0 7px; }
.reading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.reading-col { padding-top: 4px; border-top: 1px solid #1E3A5F; }
.tag { font-size: 8px; color: #64748B; font-weight: 600; margin: 0 0 1px; }
.reading-title { font-size: 10px; font-weight: 700; margin: 0 0 2px; }
.reading-body { margin: 0; font-size: 10px; line-height: 1.35; color: #475569; }
.delay { background: #FBF1F3; border: 1px solid #E8C5CC; padding: 10px; }
.delay h3 { margin: 0 0 4px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #BE5A6B; }
.delay p { margin: 0 0 8px; font-size: 11px; }
.delay-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.delay-label { font-size: 9px; color: #64748B; margin: 0 0 2px; }
.delay-val { font-size: 13px; font-weight: 700; margin: 0; }
.sched-wrap { margin-top: 2px; }
table.sched { width: 100%; border-collapse: collapse; font-size: 10.5px; }
table.sched thead th { background: #1E3A5F; color: #fff; font-size: 9px; padding: 6px 5px; text-align: right; text-transform: uppercase; letter-spacing: 0.04em; }
table.sched thead th:first-child { text-align: center; }
table.sched td { padding: 4px 5px; border-bottom: 1px solid #E2E8F0; }
table.sched tr { break-inside: avoid; page-break-inside: avoid; }
table.sched .row-mid td { background: #F1F5F9; }
table.sched .row-final td { background: #DCEFE6; font-weight: 600; }
.caption { font-size: 10px; color: #64748B; margin: 5px 0 0; }
.playbook { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.play-num { font-size: 12px; font-weight: 700; color: #CBD5E1; margin: 0 0 1px; }
.play-title { font-size: 10px; font-weight: 700; margin: 0 0 2px; }
.play-body { margin: 0; font-size: 10px; line-height: 1.35; color: #475569; }
.footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #E2E8F0; }
.disclaimer { font-size: 10px; color: #64748B; margin: 0 0 8px; }
.powered { text-align: center; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B; margin: 0; }
.legend-row { display: grid; grid-template-columns: 8px 1fr auto; gap: 5px; align-items: center; padding: 2px 0; font-size: 9.5px; }
.swatch { display: inline-block; }
.legend-value { font-weight: 600; }
@media print { body, .desktop { background: #fff; padding: 0; } }
`;

  const body = `
<article class="sheet" data-style="portfolio-desk">
  <header class="band" data-pdf-keep-together>
    <div class="band-left">
      <div class="mark">${esc(data.monogram)}</div>
      <div>
        <p class="brand">NIVRA PRIVATE WEALTH</p>
        <h1 class="title">${esc(data.title)}</h1>
        <p class="client">${esc(data.clientName)} · Age ${data.age} · Age ${data.age} to ${data.endAge}</p>
      </div>
    </div>
    <div class="contact">
      <p>${esc(data.contactEmail)}</p>
      <p>${esc(data.contactPhone)}</p>
    </div>
  </header>

  <div class="kpi-band" data-pdf-keep-together>
    <div class="kpi"><p class="kpi-label">Monthly SIP</p><p class="kpi-val teal">${formatINR(data.monthlySip)}</p></div>
    <div class="kpi"><p class="kpi-label">Invested</p><p class="kpi-val">${formatINR(data.totalInvested)}</p></div>
    <div class="kpi"><p class="kpi-label">Pre-tax gain</p><p class="kpi-val">${formatINR(data.preTaxGain)}</p></div>
    <div class="kpi"><p class="kpi-label">Net after tax</p><p class="kpi-val">${formatINR(data.netAfterTax)}</p></div>
    <div class="kpi"><p class="kpi-label">Return CAGR</p><p class="kpi-val teal">${formatPct(data.returnCagr)}</p></div>
  </div>

  <div class="pad">
    <div class="desk">
      <aside class="panel" data-pdf-keep-together>
        <p class="panel-h">Key outcomes</p>
        <div class="hero-stack">
          <div class="hero-card">
            <p class="hero-label">Nominal maturity</p>
            <p class="hero-val">${formatINR(data.nominalMaturity)}</p>
          </div>
          <div class="hero-card real">
            <p class="hero-label">Inflation-adjusted</p>
            <p class="hero-val teal">${formatINR(data.inflationAdjusted)}</p>
          </div>
        </div>

        <p class="panel-h">Assumptions</p>
        <div class="ass-row"><span class="k">Client age</span><span class="v">${data.age} yrs</span></div>
        <div class="ass-row"><span class="k">SIP years</span><span class="v">${data.sipYears} yrs</span></div>
        <div class="ass-row"><span class="k">Tenure</span><span class="v">${data.tenure} yrs</span></div>
        <div class="ass-row"><span class="k">Inflation</span><span class="v">${formatPct(data.inflation)}</span></div>
        <div class="ass-row"><span class="k">Tax on gains</span><span class="v">${formatPct(data.taxOnGains)}</span></div>
        <div class="ass-row"><span class="k">Delay</span><span class="v" id="delay-value">${data.delayMonths} mo</span></div>

        <div class="mix">
          <p class="panel-h">Corpus composition</p>
          <div class="mix-row">
            ${nominalDonut}
            <div class="legend">
              ${legendRow("#1E3A5F", `Invested ${data.nominalInvestedPct.toFixed(1)}%`, formatINR(data.totalInvested), 8)}
              ${legendRow("#0B7A5B", `Gain ${data.nominalGainAfterTaxPct.toFixed(1)}%`, formatINR(data.gainAfterTax), 8)}
              ${legendRow("#94A3B8", `Tax ${data.nominalCapitalTaxPct.toFixed(1)}%`, formatINR(data.taxOnGain), 8)}
            </div>
          </div>
          <div class="bar-block">
            <p class="bar-h">Today Rs ${formatINR(data.inflationAdjusted)}</p>
            ${bar2}
            <div class="bar-labels">
              <span class="seg"><i style="background:#1E3A5F"></i>${data.realCorpusPct.toFixed(1)}% real</span>
              <span class="seg"><i style="background:#94A3B8"></i>${data.realCapitalTaxPct.toFixed(1)}% tax</span>
            </div>
            <p class="shortfall">Real shortfall: ${formatINR(data.realGainShortfall)}</p>
          </div>
          <div class="bar-block">
            <p class="bar-h">Nominal mix bar</p>
            ${bar1}
          </div>
        </div>
      </aside>

      <div>
        <section data-pdf-keep-together>
          <h2 class="section-h">Advisory Reading</h2>
          <div class="reading">
            ${reading.map((b, i) => `<div class="reading-col"><p class="tag">0${i + 1}</p><p class="reading-title">${esc(b.title)}</p><p class="reading-body">${esc(b.body)}</p></div>`).join("")}
          </div>
        </section>

        <section class="section" id="cost-of-delay" data-pdf-keep-together ${showDelay ? "" : "hidden"}>
          <div class="delay">
            <h3>Cost of Delay</h3>
            <p>${esc(delaySectionCopy(data))}</p>
            <div class="delay-grid">
              <div><p class="delay-label">On-time maturity</p><p class="delay-val">${formatINR(data.delayedOnTime)}</p></div>
              <div><p class="delay-label">Delayed maturity</p><p class="delay-val">${formatINR(data.delayedMaturity)}</p></div>
              <div><p class="delay-label">Capital penalty</p><p class="delay-val">${formatINR(data.capitalPenalty)}</p></div>
            </div>
          </div>
        </section>

        <section class="section" data-pdf-keep-together>
          <h2 class="section-h">Yearly Accumulation Schedule</h2>
          ${scheduleHtml}
          <p class="caption">${data.investYears} cycles · full return vs inflation-adjusted</p>
        </section>
      </div>
    </div>

    <section class="section" data-pdf-keep-together>
      <h2 class="section-h">Advisory Playbook</h2>
      <div class="playbook">
        ${pillars.map((p) => `<div><p class="play-num">${p.id}</p><p class="play-title">${esc(p.title)}</p><p class="play-body">${esc(p.body)}</p></div>`).join("")}
      </div>
    </section>

    <footer class="footer" data-pdf-keep-together>
      <p class="disclaimer">${esc(data.disclaimer)}</p>
      <p class="powered">${esc(data.footer)}</p>
    </footer>
  </div>
</article>`;

  return {
    fontLinks: ["https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"],
    css,
    body,
    desktopBg: "#E9EEF4",
  };
}
