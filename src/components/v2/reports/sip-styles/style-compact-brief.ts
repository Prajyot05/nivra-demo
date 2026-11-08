import { advisoryReading, delaySectionCopy, playbook } from "./copy";
import { formatINR, formatPct, esc } from "./format";
import { renderScheduleTable } from "./schedule";
import { donutSvg, legendRow } from "./svg";
import type { BuiltStyle, SipDossierData } from "./types";

/** Compact but clearer brief. Tight above advisory, stronger hierarchy below. */
export function buildCompactBrief(data: SipDossierData): BuiltStyle {
  const reading = advisoryReading(data);
  const pillars = playbook(data);
  const showDelay = data.delayMonths > 0;
  const scheduleHtml = renderScheduleTable(data);

  const nominalDonut = donutSvg(
    [
      { pct: data.nominalInvestedPct, color: "#0F172A" },
      { pct: data.nominalGainAfterTaxPct, color: "#0B7A5B" },
      { pct: data.nominalCapitalTaxPct, color: "#94A3B8" },
    ],
    {
      size: 128,
      stroke: 16,
      label: "Maturity",
      value: formatINR(data.nominalMaturity),
      holeFill: "#F8FAFC",
    },
  );
  const realDonut = donutSvg(
    [
      { pct: data.realCorpusPct, color: "#0F172A" },
      { pct: data.realCapitalTaxPct, color: "#94A3B8" },
    ],
    {
      size: 128,
      stroke: 16,
      label: "Today Rs",
      value: formatINR(data.inflationAdjusted),
      holeFill: "#F8FAFC",
    },
  );

  const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: #F1F5F9; color: #0F172A; }
.desktop { background: #F1F5F9; padding: 32px 16px; display: flex; justify-content: center; }
.sheet {
  width: 900px; background: #fff; padding: 26px 30px 32px;
  font-family: Inter, Arial, sans-serif; font-size: 12px; line-height: 1.45; color: #0F172A;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.r { text-align: right; } .c { text-align: center; }
.teal { color: #0B7A5B; }
.nums, .r, .hero-val { font-variant-numeric: tabular-nums; }
.top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; padding-bottom: 10px; border-bottom: 2px solid #0F172A; }
.brand-row { display: flex; gap: 10px; align-items: center; }
.mark { width: 30px; height: 30px; background: #0F172A; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }
.brand { font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; margin: 0; color: #64748B; }
.title { font-size: 18px; font-weight: 700; margin: 1px 0 0; letter-spacing: -0.01em; }
.contact { font-size: 10.5px; color: #64748B; text-align: right; margin: 0; }
.line {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 10px;
  background: #F8FAFC; border: 1px solid #E2E8F0;
}
.line > span { padding: 7px 10px; font-size: 11px; color: #475569; }
.line > span + span { border-left: 1px solid #E2E8F0; }
.line strong { color: #0F172A; font-weight: 600; display: block; margin-top: 1px; font-size: 12px; }
.line .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; }
.hero { display: grid; grid-template-columns: 1.2fr 1.2fr 1fr 1fr; gap: 0; margin-top: 10px; border: 1px solid #E2E8F0; }
.hero > div { padding: 10px 12px; }
.hero > div + div { border-left: 1px solid #E2E8F0; }
.hero .accent { background: #F0FDFA; }
.hero-label { font-size: 9px; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px; }
.hero-val { font-size: 16px; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
.section { margin-top: 16px; break-inside: avoid; page-break-inside: avoid; }
.section-h { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #64748B; margin: 0 0 7px; }
.reading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.reading-col { padding-top: 4px; border-top: 1px solid #0F172A; }
.tag { font-size: 8px; color: #64748B; font-weight: 600; margin: 0 0 1px; }
.reading-title { font-size: 10px; font-weight: 700; margin: 0 0 2px; }
.reading-body { margin: 0; font-size: 10px; line-height: 1.35; color: #475569; }
.assumptions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 12px; }
.ass-label { font-size: 9px; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 2px; }
.ass-val { font-size: 12px; font-weight: 600; margin: 0; }
.comp { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.comp-col { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; }
.comp-col .legend { width: 100%; }
.comp-title { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; margin: 0; align-self: stretch; }
.hero-val, .legend-value { word-break: break-word; }
.legend-row { display: grid; grid-template-columns: 8px 1fr auto; gap: 6px; align-items: center; padding: 3px 0; border-bottom: 1px solid #E2E8F0; font-size: 10px; }
.legend-row:last-child { border-bottom: 0; }
.swatch { display: inline-block; }
.legend-value { font-weight: 600; }
.shortfall { font-size: 10px; color: #64748B; margin: 4px 0 0; }
.delay { background: #FBF1F3; border: 1px solid #E8C5CC; padding: 10px 12px; }
.delay h3 { margin: 0 0 4px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #BE5A6B; }
.delay p { margin: 0 0 8px; font-size: 11px; }
.delay-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.delay-label { font-size: 9px; color: #64748B; margin: 0 0 2px; }
.delay-val { font-size: 13px; font-weight: 700; margin: 0; }
.sched-wrap { margin-top: 2px; }
table.sched { width: 100%; border-collapse: collapse; font-size: 11px; }
table.sched thead th { background: #0F172A; color: #fff; font-size: 9.5px; padding: 6px; text-align: right; text-transform: uppercase; letter-spacing: 0.04em; }
table.sched thead th:first-child { text-align: center; }
table.sched td { padding: 5px 6px; border-bottom: 1px solid #E2E8F0; }
table.sched tr { break-inside: avoid; page-break-inside: avoid; }
table.sched .row-mid td { background: #F8FAFC; }
table.sched .row-final td { background: #E7F5F1; font-weight: 600; }
.caption { font-size: 10px; color: #64748B; margin: 5px 0 0; }
.playbook { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.play-num { font-size: 12px; font-weight: 700; color: #CBD5E1; margin: 0 0 1px; }
.play-title { font-size: 10px; font-weight: 700; margin: 0 0 2px; }
.play-body { margin: 0; font-size: 10px; line-height: 1.35; color: #475569; }
.footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #E2E8F0; }
.disclaimer { font-size: 10px; color: #64748B; margin: 0 0 8px; }
.powered { text-align: center; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B; margin: 0; }
@media print { body, .desktop { background: #fff; padding: 0; } }
`;

  const body = `
<article class="sheet" data-style="compact-brief">
  <div class="top" data-pdf-keep-together>
    <div class="brand-row">
      <div class="mark">${esc(data.monogram)}</div>
      <div>
        <p class="brand">NIVRA PRIVATE WEALTH</p>
        <h1 class="title">${esc(data.title)}</h1>
      </div>
    </div>
    <div class="contact">
      <p>${esc(data.contactEmail)}</p>
      <p>${esc(data.contactPhone)}</p>
    </div>
  </div>

  <div class="line" data-pdf-keep-together>
    <span><span class="lbl">Client</span><strong>${esc(data.clientName)} · ${data.age}</strong></span>
    <span><span class="lbl">Timeline</span><strong>Age ${data.age} to ${data.endAge}</strong></span>
    <span><span class="lbl">Monthly SIP</span><strong class="teal">${formatINR(data.monthlySip)}</strong></span>
    <span><span class="lbl">Return CAGR</span><strong class="teal">${formatPct(data.returnCagr)}</strong></span>
  </div>

  <div class="hero" data-pdf-keep-together>
    <div><p class="hero-label">Nominal maturity</p><p class="hero-val">${formatINR(data.nominalMaturity)}</p></div>
    <div class="accent"><p class="hero-label">Inflation-adjusted</p><p class="hero-val teal">${formatINR(data.inflationAdjusted)}</p></div>
    <div><p class="hero-label">Invested</p><p class="hero-val">${formatINR(data.totalInvested)}</p></div>
    <div><p class="hero-label">Net after tax</p><p class="hero-val">${formatINR(data.netAfterTax)}</p></div>
  </div>

  <section class="section" data-pdf-keep-together>
    <h2 class="section-h">Advisory Reading</h2>
    <div class="reading">
      ${reading.map((b, i) => `<div class="reading-col"><p class="tag">0${i + 1}</p><p class="reading-title">${esc(b.title)}</p><p class="reading-body">${esc(b.body)}</p></div>`).join("")}
    </div>
  </section>

  <section class="section" data-pdf-keep-together>
    <h2 class="section-h">Assumptions</h2>
    <div class="assumptions">
      <div><p class="ass-label">Client age</p><p class="ass-val">${data.age} yrs</p></div>
      <div><p class="ass-label">Monthly SIP</p><p class="ass-val">${formatINR(data.monthlySip)}</p></div>
      <div><p class="ass-label">SIP years</p><p class="ass-val">${data.sipYears} yrs</p></div>
      <div><p class="ass-label">Tenure</p><p class="ass-val">${data.tenure} yrs</p></div>
      <div><p class="ass-label">Return CAGR</p><p class="ass-val teal">${formatPct(data.returnCagr)}</p></div>
      <div><p class="ass-label">Inflation</p><p class="ass-val">${formatPct(data.inflation)}</p></div>
      <div><p class="ass-label">Tax on gains</p><p class="ass-val">${formatPct(data.taxOnGains)}</p></div>
      <div><p class="ass-label">Delay</p><p class="ass-val" id="delay-value">${data.delayMonths} mo</p></div>
    </div>
  </section>

  <section class="section" data-pdf-keep-together>
    <h2 class="section-h">Corpus Composition</h2>
    <div class="comp">
      <div class="comp-col">
        <p class="comp-title">Nominal mix</p>
        ${nominalDonut}
        <div class="legend">
          ${legendRow("#0F172A", `Invested ${data.nominalInvestedPct.toFixed(1)}%`, formatINR(data.totalInvested), 8)}
          ${legendRow("#0B7A5B", `Gain after tax ${data.nominalGainAfterTaxPct.toFixed(1)}%`, formatINR(data.gainAfterTax), 8)}
          ${legendRow("#94A3B8", `Capital tax ${data.nominalCapitalTaxPct.toFixed(1)}%`, formatINR(data.taxOnGain), 8)}
        </div>
      </div>
      <div class="comp-col">
        <p class="comp-title">Real purchasing power</p>
        ${realDonut}
        <div class="legend">
          ${legendRow("#0F172A", `Real corpus ${data.realCorpusPct.toFixed(1)}%`, formatINR(data.realCorpusAfterTax), 8)}
          ${legendRow("#94A3B8", `Capital tax ${data.realCapitalTaxPct.toFixed(1)}%`, formatINR(data.capitalTaxToday), 8)}
        </div>
        <p class="shortfall">Real shortfall: ${formatINR(data.realGainShortfall)}</p>
      </div>
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
</article>`;

  return {
    fontLinks: ["https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"],
    css,
    body,
    desktopBg: "#F1F5F9",
  };
}
