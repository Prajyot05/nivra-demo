import { advisoryReading, delaySectionCopy, playbook } from "./copy";
import { formatINR, formatPct, esc, amountClass, amountScaleCssBlock } from "./format";
import { renderScheduleTable } from "./schedule";
import { SHARED_AMOUNT_CSS } from "./shared-report-css";
import { SHARED_FOOTER_CSS, renderReportFooter } from "./shared-footer";
import { SHARED_PAGINATION_CSS } from "./shared-pagination";
import { donutSvg, legendRow } from "./svg";
import type { BuiltStyle, SipDossierData } from "./types";

export function buildClassicMemo(data: SipDossierData): BuiltStyle {
  const reading = advisoryReading(data);
  const pillars = playbook(data);
  const showDelay = data.delayMonths > 0;

  const nominalDonut = donutSvg(
    [
      { pct: data.nominalInvestedPct, color: "#1E293B" },
      { pct: data.nominalGainAfterTaxPct, color: "#047857" },
      { pct: data.nominalCapitalTaxPct, color: "#94A3B8" },
    ],
    {
      size: 168,
      stroke: 20,
      label: "Maturity",
      value: formatINR(data.nominalMaturity),
      holeFill: "#FFFFFF",
    },
  );

  const realDonut = donutSvg(
    [
      { pct: data.realCorpusPct, color: "#1E293B" },
      { pct: data.realCapitalTaxPct, color: "#94A3B8" },
    ],
    {
      size: 168,
      stroke: 20,
      label: "Today Rs",
      value: formatINR(data.inflationAdjusted),
      holeFill: "#FFFFFF",
    },
  );

  const scheduleHtml = renderScheduleTable(data);

  const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: #F4F5F7; color: #0F172A; }
.desktop { background: #F4F5F7; padding: 32px 16px; display: flex; justify-content: center; }
.sheet {
  width: 900px; background: #FFFFFF; padding: 40px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  font-family: "IBM Plex Sans", Inter, Arial, sans-serif;
  font-size: 13px; line-height: 1.6; color: #0F172A;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.nums, .r, .stat-val, .hero-val, .legend-value { font-variant-numeric: tabular-nums; }
.r { text-align: right; }
.c { text-align: center; }
.muted { color: #64748B; }
.navy { color: #1E293B; }
.emerald { color: #047857; }
.deep-emerald { color: #065F46; }
.section { margin-top: 28px; }
.section-h {
  font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
  color: #1E293B; margin: 0 0 12px;
}
.hdr { display: flex; align-items: flex-start; gap: 14px; }
.mark {
  width: 42px; height: 42px; background: #1E293B; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-family: Georgia, "Times New Roman", serif; font-size: 22px; flex-shrink: 0;
}
.brand { font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #1E293B; margin: 0; }
.title { font-size: 20px; font-weight: 600; margin: 4px 0 2px; }
.client { font-size: 13px; color: #0F172A; margin: 0; }
.rule { height: 1px; background: #1E293B; margin: 14px 0 8px; border: 0; }
.contact { font-size: 11px; color: #64748B; margin: 0; }
.meta {
  display: grid; grid-template-columns: 1fr 1fr 1fr; background: #F4F5F7; margin-top: 18px;
}
.meta-item { padding: 12px 14px; }
.meta-item + .meta-item { border-left: 1px solid #D5DBE3; }
.meta-label { font-size: 11px; color: #64748B; margin: 0 0 4px; }
.meta-val { font-size: 13px; font-weight: 600; margin: 0; }
.hero { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
.hero-card { padding: 18px 16px; }
.hero-left { background: #F4F5F7; }
.hero-right { background: #EAF4EE; }
.hero-label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #64748B; margin: 0 0 8px; font-weight: 600; }
.hero-val { font-size: 28px; font-weight: 600; margin: 0; word-break: break-word; }
.legend-value { word-break: break-word; }
.stats {
  display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 22px;
  border-top: 1px solid #D5DBE3; border-bottom: 1px solid #D5DBE3;
}
.stat { padding: 14px 12px; }
.stat + .stat { border-left: 1px solid #D5DBE3; }
.stat-label { font-size: 11px; color: #64748B; margin: 0 0 6px; }
.stat-val { font-size: 17px; font-weight: 600; margin: 0; }
.reading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.reading-col { padding-top: 4px; border-top: 1px solid #1E293B; }
.reading-num { font-size: 8px; color: #64748B; font-weight: 600; margin: 0 0 1px; }
.reading-title { font-size: 10px; font-weight: 600; margin: 0 0 2px; color: #1E293B; }
.reading-body { margin: 0; color: #475569; font-size: 10px; line-height: 1.35; }
.assumptions {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 18px;
}
.ass-label { font-size: 11px; color: #64748B; margin: 0 0 4px; }
.ass-val { font-size: 13px; font-weight: 600; margin: 0; }
.comp { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.comp-col { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.comp-title { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #1E293B; align-self: flex-start; margin: 0; }
.legend { width: 100%; }
.legend-row {
  display: grid; grid-template-columns: 10px 1fr auto; gap: 10px; align-items: center;
  padding: 7px 0; border-bottom: 1px solid #D5DBE3; font-size: 12px;
}
.legend-row:last-child { border-bottom: 0; }
.swatch { display: inline-block; border-radius: 1px; }
.legend-label { color: #0F172A; }
.legend-value { font-weight: 600; }
.shortfall { font-size: 12px; color: #64748B; margin: 8px 0 0; align-self: flex-start; }
.delay {
  background: #FBF1F3; border: 1px solid #E8C5CC; padding: 16px 18px; border-radius: 2px;
}
.delay h3 { margin: 0 0 8px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #BE5A6B; }
.delay p { margin: 0 0 12px; color: #0F172A; }
.delay-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.delay-label { font-size: 11px; color: #64748B; margin: 0 0 4px; }
.delay-val { font-size: 17px; font-weight: 600; margin: 0; color: #0F172A; }
.schedule-block { margin-top: 20px; }
.sched-frame {
  border: 1px solid #D5DBE3;
  background: #fff;
}
.sched-frame .sched-wrap { margin: 0; }
.sched-frame table.sched {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  line-height: 1.35;
  table-layout: fixed;
}
.sched-frame table.sched .col-yr { width: 7%; }
.sched-frame table.sched .col-num { width: 13.5%; }
.sched-frame table.sched .col-infl { width: 18%; }
.sched-frame table.sched .col-milestone { width: 20%; }
.sched-frame table.sched thead th {
  background: #1E293B;
  color: #f8fafc;
  font-size: 9px;
  padding: 10px 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  vertical-align: middle;
  white-space: normal;
  line-height: 1.3;
}
.sched-frame table.sched thead th.c { padding-left: 12px; }
.sched-frame table.sched thead th.infl { padding-right: 20px; }
.sched-frame table.sched thead th.milestone {
  padding-left: 20px;
  padding-right: 14px;
  text-align: left;
}
.sched-frame table.sched tbody td {
  padding: 8px 8px;
  border-bottom: 1px solid #E8ECF0;
  color: #0f172a;
  vertical-align: middle;
}
.sched-frame table.sched tbody td.yr { padding-left: 12px; font-weight: 600; }
.sched-frame table.sched tbody td.num.infl { padding-right: 20px; }
.sched-frame table.sched tbody td.milestone {
  padding-left: 20px;
  padding-right: 14px;
}
.sched-frame table.sched tbody tr:last-child td { border-bottom: none; }
.sched-frame table.sched .row-mid td { background: #F8FAFC; }
.sched-frame table.sched .row-mid td.milestone { color: #1e293b; font-weight: 600; }
.sched-frame table.sched .row-final td {
  background: #E7F5F0;
  font-weight: 600;
  color: #065f46;
}
.sched-frame table.sched .row-final td.milestone { color: #047857; }
.sched-frame table.sched.sched-dense thead th { padding: 8px 6px; font-size: 8.5px; }
.sched-frame table.sched.sched-dense tbody td { padding: 7px 6px; }
.sched-frame table.sched.sched-xdense thead th { padding: 7px 5px; font-size: 8px; }
.sched-frame table.sched.sched-xdense tbody td { padding: 6px 5px; font-size: 9.5px; }
.sched-head .section-h { margin-bottom: 8px; }
.sched-hint { font-size: 10.5px; color: #64748B; margin: 0 0 12px; line-height: 1.45; max-width: 52em; }
.caption { font-size: 11px; color: #64748B; margin: 12px 0 0; }
.playbook { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.play-num { font-size: 12px; font-weight: 600; color: #D5DBE3; margin: 0 0 1px; }
.play-title { font-size: 10px; font-weight: 600; margin: 0 0 2px; color: #1E293B; }
.play-body { margin: 0; font-size: 10px; line-height: 1.35; color: #475569; }
@media print {
  body, .desktop { background: #fff; padding: 0; }
  .sheet { box-shadow: none; }
}
${amountScaleCssBlock({ hero: 28, stat: 17 })}
${SHARED_AMOUNT_CSS}
${SHARED_FOOTER_CSS}
${SHARED_PAGINATION_CSS}
`;

  const body = `
<article class="sheet" data-style="classic-memo">
  <header class="hdr" data-pdf-keep-together>
    <div class="mark">${esc(data.monogram)}</div>
    <div>
      <p class="brand">NIVRA PRIVATE WEALTH</p>
      <h1 class="title">${esc(data.title)}</h1>
      <p class="client">${esc(data.clientName)} · Age ${data.age}</p>
    </div>
  </header>
  <hr class="rule" />
  <p class="contact">${esc(data.contactEmail)} · ${esc(data.contactPhone)}</p>

  <div class="meta" data-pdf-keep-together>
    <div class="meta-item">
      <p class="meta-label">Client</p>
      <p class="meta-val">${esc(data.clientName)}</p>
    </div>
    <div class="meta-item">
      <p class="meta-label">Timeline</p>
      <p class="meta-val">Age ${data.age} to ${data.endAge} (${data.investYears} yrs)</p>
    </div>
    <div class="meta-item">
      <p class="meta-label">Monthly SIP</p>
      <p class="${amountClass("meta-val emerald", data.monthlySip, "meta")}">${formatINR(data.monthlySip)}</p>
    </div>
  </div>

  <div class="hero" data-pdf-keep-together>
    <div class="hero-card hero-left">
      <p class="hero-label">Nominal maturity</p>
      <p class="${amountClass("hero-val", data.nominalMaturity, "hero")}">${formatINR(data.nominalMaturity)}</p>
    </div>
    <div class="hero-card hero-right">
      <p class="hero-label">Inflation-adjusted, today's rupees</p>
      <p class="${amountClass("hero-val deep-emerald", data.inflationAdjusted, "hero")}">${formatINR(data.inflationAdjusted)}</p>
    </div>
  </div>

  <div class="stats" data-pdf-keep-together>
    <div class="stat"><p class="stat-label">Invested</p><p class="${amountClass("stat-val", data.totalInvested, "stat")}">${formatINR(data.totalInvested)}</p></div>
    <div class="stat"><p class="stat-label">Pre-tax gain</p><p class="${amountClass("stat-val", data.preTaxGain, "stat")}">${formatINR(data.preTaxGain)}</p></div>
    <div class="stat"><p class="stat-label">Net after tax</p><p class="${amountClass("stat-val", data.netAfterTax, "stat")}">${formatINR(data.netAfterTax)}</p></div>
    <div class="stat"><p class="stat-label">Monthly SIP</p><p class="${amountClass("stat-val", data.monthlySip, "stat")}">${formatINR(data.monthlySip)}</p></div>
  </div>

  <section class="section">
    <div class="reading-block" data-pdf-keep-together>
      <h2 class="section-h">Advisory Reading</h2>
      <div class="reading">
      ${reading
        .map(
          (block, i) => `
        <div class="reading-col">
          <p class="reading-num">0${i + 1}</p>
          <p class="reading-title">${esc(block.title)}</p>
          <p class="reading-body">${esc(block.body)}</p>
        </div>`,
        )
        .join("")}
      </div>
    </div>
  </section>

  <section class="section" data-pdf-keep-together>
    <h2 class="section-h">Assumptions</h2>
    <div class="assumptions">
      <div><p class="ass-label">Client age</p><p class="ass-val">${data.age} yrs</p></div>
      <div><p class="ass-label">Monthly SIP</p><p class="${amountClass("ass-val", data.monthlySip, "ass")}">${formatINR(data.monthlySip)}</p></div>
      <div><p class="ass-label">SIP years</p><p class="ass-val">${data.sipYears} yrs</p></div>
      <div><p class="ass-label">Tenure</p><p class="ass-val">${data.tenure} yrs</p></div>
      <div><p class="ass-label">Return CAGR</p><p class="ass-val emerald">${formatPct(data.returnCagr)}</p></div>
      <div><p class="ass-label">Inflation</p><p class="ass-val">${formatPct(data.inflation)}</p></div>
      <div><p class="ass-label">Tax on gains</p><p class="ass-val">${formatPct(data.taxOnGains)}</p></div>
      <div><p class="ass-label">Delay</p><p class="ass-val" id="delay-value">${data.delayMonths} mo</p></div>
    </div>
  </section>

  <section class="section">
    <div class="comp-block" data-pdf-keep-together>
      <h2 class="section-h">Corpus Composition</h2>
      <div class="comp">
      <div class="comp-col">
        <p class="comp-title">Nominal mix</p>
        ${nominalDonut}
        <div class="legend">
          ${legendRow("#1E293B", `Invested ${data.nominalInvestedPct.toFixed(1)}%`, formatINR(data.totalInvested))}
          ${legendRow("#047857", `Gain after tax ${data.nominalGainAfterTaxPct.toFixed(1)}%`, formatINR(data.gainAfterTax))}
          ${legendRow("#94A3B8", `Capital tax ${data.nominalCapitalTaxPct.toFixed(1)}%`, formatINR(data.taxOnGain))}
        </div>
      </div>
      <div class="comp-col">
        <p class="comp-title">Real purchasing power</p>
        ${realDonut}
        <div class="legend">
          ${legendRow("#1E293B", `Real corpus after tax ${data.realCorpusPct.toFixed(1)}%`, formatINR(data.realCorpusAfterTax))}
          ${legendRow("#94A3B8", `Capital tax ${data.realCapitalTaxPct.toFixed(1)}%`, formatINR(data.capitalTaxToday))}
        </div>
        <p class="shortfall">Real shortfall versus invested capital: ${formatINR(data.realGainShortfall)}</p>
      </div>
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

  <section class="section schedule-block">
    <div class="sched-head" data-pdf-keep-together>
      <h2 class="section-h">Yearly accumulation schedule</h2>
      <p class="sched-hint">Year-by-year SIP, invested capital, nominal return, and inflation-adjusted value (full INR).</p>
    </div>
    <div class="sched-frame">
      ${scheduleHtml}
    </div>
    <p class="caption">${data.investYears} years · nominal return vs inflation-adjusted</p>
  </section>

  <section class="section">
    <div class="playbook-block" data-pdf-keep-together>
      <h2 class="section-h">Advisory Playbook</h2>
      <div class="playbook">
      ${pillars
        .map(
          (p) => `
        <div>
          <p class="play-num">${p.id}</p>
          <p class="play-title">${esc(p.title)}</p>
          <p class="play-body">${esc(p.body)}</p>
        </div>`,
        )
        .join("")}
      </div>
    </div>
  </section>

  ${renderReportFooter(data.disclaimer)}
</article>`;

  return {
    fontLinks: [
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
    ],
    css,
    body,
    desktopBg: "#F4F5F7",
  };
}
