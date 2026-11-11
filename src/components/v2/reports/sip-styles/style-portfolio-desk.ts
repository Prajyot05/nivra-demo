import { advisoryReading, delaySectionCopy, playbook } from "./copy";
import { formatINR, formatPct, esc, amountClass, amountScaleCssBlock } from "./format";
import { renderScheduleTable } from "./schedule";
import { SHARED_AMOUNT_CSS } from "./shared-report-css";
import { SHARED_FOOTER_CSS, renderReportFooter } from "./shared-footer";
import { SHARED_PAGINATION_CSS } from "./shared-pagination";
import { donutSvg, legendRow, stackedBarSvg } from "./svg";
import type { BuiltStyle, SipDossierData } from "./types";

/** Polished desk layout: headline outcomes in the main column, reference rail on the left. */
export function buildPortfolioDesk(data: SipDossierData): BuiltStyle {
  const reading = advisoryReading(data);
  const pillars = playbook(data);
  const showDelay = data.delayMonths > 0;
  const scheduleHtml = renderScheduleTable(data);

  const realBar = stackedBarSvg(
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
.nums, .r, .kpi-val, .hero-val, .stat-val { font-variant-numeric: tabular-nums; }
.band {
  background: #1E3A5F; color: #fff; padding: 20px 28px;
  display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;
}
.band-left { display: flex; gap: 12px; align-items: flex-start; min-width: 0; }
.mark {
  width: 34px; height: 34px; border: 1px solid rgba(255,255,255,0.45); color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px;
  flex-shrink: 0;
}
.brand { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 4px; opacity: 0.8; }
.title { font-size: 20px; font-weight: 700; margin: 0 0 3px; letter-spacing: -0.01em; }
.client { font-size: 12px; margin: 0; opacity: 0.9; }
.contact { font-size: 11px; color: #CBD5E1; text-align: right; margin: 0; flex-shrink: 0; }
.context-band {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  border-bottom: 1px solid #D5DBE3; background: #FAFBFC;
}
.ctx { padding: 10px 14px; }
.ctx + .ctx { border-left: 1px solid #E2E8F0; }
.ctx-label {
  font-size: 8px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 2px; font-weight: 600;
}
.ctx-val { font-size: 12px; font-weight: 600; margin: 0; color: #334155; }
.ctx-val.accent { color: #0B7A5B; }
.desk-schedule {
  display: grid; grid-template-columns: 268px 1fr; gap: 20px; margin-top: 18px;
  align-items: stretch;
}
.hero-val, .kpi-val, .legend-value, .stat-val { word-break: break-word; }
.body-stack { display: flex; flex-direction: column; gap: 0; margin-top: 18px; }
.rail {
  display: flex; flex-direction: column; gap: 0; height: 100%; min-height: 100%;
  border: 1px solid #E2E8F0; background: #F8FAFC;
}
.rail-block { padding: 14px 13px; }
.rail-block + .rail-block { border-top: 1px solid #E2E8F0; }
.rail-block.fill {
  flex: 1; display: flex; flex-direction: column; min-height: 0;
}
.rail-block.fill .mix-col { flex: 1; }
.rail-spacer { flex: 1; min-height: 8px; }
.schedule-col {
  min-width: 0; display: flex; flex-direction: column;
  margin-top: 0; padding-top: 0; border-top: none;
}
.rail-h {
  font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: #94A3B8; margin: 0 0 10px;
}
.rail-h-strong {
  font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: #475569; margin: 0 0 10px;
}
.ass-row { display: flex; justify-content: space-between; gap: 8px; padding: 5px 0; border-bottom: 1px solid #E8EDF2; font-size: 10.5px; }
.ass-row:last-child { border-bottom: 0; }
.ass-row .k { color: #64748B; }
.ass-row .v { font-weight: 600; color: #1E293B; text-align: right; }
.mix-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.mix-col .legend { width: 100%; }
.mix-subh { font-size: 9px; font-weight: 600; color: #64748B; margin: 12px 0 6px; align-self: stretch; }
.mix-subh:first-of-type { margin-top: 4px; }
.bar-block { margin-top: 4px; align-self: stretch; }
.bar-h { font-size: 9px; font-weight: 600; color: #475569; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.06em; }
.bar-labels { display: flex; flex-wrap: wrap; gap: 4px 8px; margin-top: 4px; font-size: 9px; color: #64748B; }
.seg { display: inline-flex; align-items: center; gap: 4px; }
.seg i { width: 7px; height: 7px; display: inline-block; }
.shortfall { font-size: 9.5px; color: #64748B; margin: 6px 0 0; align-self: stretch; line-height: 1.4; }
.outcome-band {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;
}
.outcome-card {
  padding: 16px 18px; border: 1px solid #E2E8F0; background: #fff;
  border-top: 3px solid #1E3A5F;
}
.outcome-card.real {
  border-top-color: #0B7A5B; background: linear-gradient(180deg, #F4FBF8 0%, #fff 48%);
}
.outcome-label {
  font-size: 9px; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 6px; font-weight: 600;
}
.outcome-val { font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em; color: #0F172A; line-height: 1.1; }
.outcome-val.teal { color: #0B7A5B; }
.outcome-cap { font-size: 10px; color: #64748B; margin: 6px 0 0; line-height: 1.35; }
.stat-strip {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  border: 1px solid #E2E8F0; border-bottom: 2px solid #1E3A5F; margin-bottom: 18px; background: #fff;
}
.stat-cell { padding: 10px 12px; min-width: 0; }
.stat-cell + .stat-cell { border-left: 1px solid #E2E8F0; }
.stat-label { font-size: 8px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px; font-weight: 600; }
.stat-val { font-size: 14px; font-weight: 700; margin: 0; color: #1E293B; }
.section-block { margin-top: 18px; padding-top: 16px; border-top: 1px solid #E2E8F0; }
.section-block:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
.section-h {
  font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: #1E3A5F; margin: 0 0 10px;
}
.reading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.reading-col { padding: 10px 10px 8px; background: #F8FAFC; border: 1px solid #E8EDF2; border-top: 2px solid #1E3A5F; }
.tag { font-size: 8px; color: #94A3B8; font-weight: 700; margin: 0 0 4px; letter-spacing: 0.08em; }
.reading-title { font-size: 10.5px; font-weight: 700; margin: 0 0 4px; color: #0F172A; }
.reading-body { margin: 0; font-size: 10px; line-height: 1.4; color: #475569; }
.delay { background: #FBF1F3; border: 1px solid #E8C5CC; padding: 12px 14px; }
.delay h3 { margin: 0 0 6px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #BE5A6B; font-weight: 700; }
.delay p { margin: 0 0 10px; font-size: 11px; line-height: 1.4; }
.delay-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.delay-label { font-size: 8px; color: #64748B; margin: 0 0 3px; text-transform: uppercase; letter-spacing: 0.06em; }
.delay-val { font-size: 13px; font-weight: 700; margin: 0; }
.sched-wrap { margin-top: 4px; }
table.sched { width: 100%; border-collapse: collapse; font-size: 10.5px; }
table.sched thead th { background: #1E3A5F; color: #fff; font-size: 9px; padding: 6px 5px; text-align: right; text-transform: uppercase; letter-spacing: 0.04em; }
table.sched thead th:first-child { text-align: center; }
table.sched td { padding: 4px 5px; border-bottom: 1px solid #E2E8F0; }
table.sched tr { break-inside: avoid; page-break-inside: avoid; }
table.sched .row-mid td { background: #F1F5F9; }
table.sched .row-final td { background: #DCEFE6; font-weight: 600; }
.caption { font-size: 10px; color: #64748B; margin: 6px 0 0; }
.playbook { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.play-item { padding: 10px; border: 1px solid #E8EDF2; border-top: 2px solid #CBD5E1; background: #FAFBFC; }
.play-num { font-size: 11px; font-weight: 700; color: #94A3B8; margin: 0 0 3px; }
.play-title { font-size: 10px; font-weight: 700; margin: 0 0 3px; color: #0F172A; }
.play-body { margin: 0; font-size: 10px; line-height: 1.35; color: #475569; }
.legend-row { display: grid; grid-template-columns: 8px 1fr auto; gap: 5px; align-items: center; padding: 3px 0; font-size: 9.5px; border-bottom: 1px solid #E8EDF2; }
.legend-row:last-child { border-bottom: 0; }
.swatch { display: inline-block; }
.legend-value { font-weight: 600; text-align: right; }
@media print { body, .desktop { background: #fff; padding: 0; } }
${amountScaleCssBlock({ hero: 24, stat: 14 })}
${SHARED_AMOUNT_CSS}
${SHARED_FOOTER_CSS}
${SHARED_PAGINATION_CSS}
.outcome-val.amt-hero-md { font-size: 19.7px; }
.outcome-val.amt-hero-sm { font-size: 17.3px; }
.outcome-val.amt-hero-xs { font-size: 14.9px; }
.ctx-val.amt-kpi-md { font-size: 10.5px; }
.ctx-val.amt-kpi-sm { font-size: 9.5px; }
`;

  const body = `
<article class="sheet" data-style="portfolio-desk">
  <header class="band" data-pdf-keep-together>
    <div class="band-left">
      <div class="mark">${esc(data.monogram)}</div>
      <div>
        <p class="brand">NIVRA PRIVATE WEALTH</p>
        <h1 class="title">${esc(data.title)}</h1>
        <p class="client">${esc(data.clientName)} · Age ${data.age} to ${data.endAge} (${data.investYears} yrs)</p>
      </div>
    </div>
    <div class="contact">
      <p>${esc(data.contactEmail)}</p>
      <p>${esc(data.contactPhone)}</p>
    </div>
  </header>

  <div class="context-band" data-pdf-keep-together>
    <div class="ctx"><p class="ctx-label">Monthly SIP</p><p class="${amountClass("ctx-val accent", data.monthlySip, "kpi")}">${formatINR(data.monthlySip)}</p></div>
    <div class="ctx"><p class="ctx-label">Return CAGR</p><p class="ctx-val accent">${formatPct(data.returnCagr)}</p></div>
    <div class="ctx"><p class="ctx-label">Inflation</p><p class="ctx-val">${formatPct(data.inflation)}</p></div>
    <div class="ctx"><p class="ctx-label">Tax on gains</p><p class="ctx-val">${formatPct(data.taxOnGains)}</p></div>
  </div>

  <div class="pad">
    <div class="body-stack">
      <div class="outcome-band" data-pdf-keep-together>
        <div class="outcome-card">
          <p class="outcome-label">Nominal maturity</p>
          <p class="${amountClass("outcome-val", data.nominalMaturity, "hero")}">${formatINR(data.nominalMaturity)}</p>
          <p class="outcome-cap">At ${formatPct(data.returnCagr)} CAGR over ${data.investYears} years</p>
        </div>
        <div class="outcome-card real">
          <p class="outcome-label">Inflation-adjusted corpus</p>
          <p class="${amountClass("outcome-val teal", data.inflationAdjusted, "hero")}">${formatINR(data.inflationAdjusted)}</p>
          <p class="outcome-cap">Today&apos;s rupees at ${formatPct(data.inflation)} inflation</p>
        </div>
      </div>

      <div class="stat-strip" data-pdf-keep-together>
        <div class="stat-cell"><p class="stat-label">Invested</p><p class="${amountClass("stat-val", data.totalInvested, "stat")}">${formatINR(data.totalInvested)}</p></div>
        <div class="stat-cell"><p class="stat-label">Pre-tax gain</p><p class="${amountClass("stat-val", data.preTaxGain, "stat")}">${formatINR(data.preTaxGain)}</p></div>
        <div class="stat-cell"><p class="stat-label">Net after tax</p><p class="${amountClass("stat-val", data.netAfterTax, "stat")}">${formatINR(data.netAfterTax)}</p></div>
        <div class="stat-cell"><p class="stat-label">Tax on gain</p><p class="${amountClass("stat-val", data.taxOnGain, "stat")}">${formatINR(data.taxOnGain)}</p></div>
      </div>

      <section class="section-block">
        <div class="reading-block" data-pdf-keep-together>
          <h2 class="section-h">Advisory reading</h2>
          <div class="reading">
            ${reading.map((b, i) => `<div class="reading-col"><p class="tag">0${i + 1}</p><p class="reading-title">${esc(b.title)}</p><p class="reading-body">${esc(b.body)}</p></div>`).join("")}
          </div>
        </div>
      </section>

      <section class="section-block" id="cost-of-delay" data-pdf-keep-together ${showDelay ? "" : "hidden"}>
        <div class="delay">
          <h3>Cost of delay</h3>
          <p>${esc(delaySectionCopy(data))}</p>
          <div class="delay-grid">
            <div><p class="delay-label">On-time maturity</p><p class="${amountClass("delay-val", data.delayedOnTime, "delay")}">${formatINR(data.delayedOnTime)}</p></div>
            <div><p class="delay-label">Delayed maturity</p><p class="${amountClass("delay-val", data.delayedMaturity, "delay")}">${formatINR(data.delayedMaturity)}</p></div>
            <div><p class="delay-label">Capital penalty</p><p class="${amountClass("delay-val", data.capitalPenalty, "delay")}">${formatINR(data.capitalPenalty)}</p></div>
          </div>
        </div>
      </section>

      <div class="desk-schedule">
        <aside class="rail">
          <div class="rail-block" data-pdf-keep-together>
            <p class="rail-h">Plan assumptions</p>
            <div class="ass-row"><span class="k">Client age</span><span class="v">${data.age} yrs</span></div>
            <div class="ass-row"><span class="k">SIP years</span><span class="v">${data.sipYears} yrs</span></div>
            <div class="ass-row"><span class="k">Tenure</span><span class="v">${data.tenure} yrs</span></div>
            <div class="ass-row"><span class="k">Delay</span><span class="v" id="delay-value">${data.delayMonths} mo</span></div>
          </div>

          <div class="rail-block fill">
            <p class="rail-h-strong">Corpus composition</p>
            <div class="mix-col">
              <p class="mix-subh">Nominal maturity mix</p>
              ${nominalDonut}
              <div class="legend">
                ${legendRow("#1E3A5F", `Invested ${data.nominalInvestedPct.toFixed(1)}%`, formatINR(data.totalInvested), 8)}
                ${legendRow("#0B7A5B", `Gain after tax ${data.nominalGainAfterTaxPct.toFixed(1)}%`, formatINR(data.gainAfterTax), 8)}
                ${legendRow("#94A3B8", `Tax ${data.nominalCapitalTaxPct.toFixed(1)}%`, formatINR(data.taxOnGain), 8)}
              </div>
              <p class="mix-subh">Real purchasing power</p>
              <div class="bar-block">
                <p class="${amountClass("bar-h", data.inflationAdjusted, "bar")}">Today&apos;s rupees · ${formatINR(data.inflationAdjusted)}</p>
                ${realBar}
                <div class="bar-labels">
                  <span class="seg"><i style="background:#1E3A5F"></i>${data.realCorpusPct.toFixed(1)}% corpus</span>
                  <span class="seg"><i style="background:#94A3B8"></i>${data.realCapitalTaxPct.toFixed(1)}% tax</span>
                </div>
              </div>
              <p class="shortfall">Real shortfall versus invested: ${formatINR(data.realGainShortfall)}</p>
              <div class="rail-spacer" aria-hidden="true"></div>
            </div>
          </div>
        </aside>

        <div class="schedule-col">
          <div class="sched-head" data-pdf-keep-together>
            <h2 class="section-h">Yearly accumulation schedule</h2>
          </div>
          ${scheduleHtml}
          <p class="caption">${data.investYears} cycles · full return vs inflation-adjusted</p>
        </div>
      </div>
    </div>

    <section class="section-block">
      <div class="playbook-block" data-pdf-keep-together>
        <h2 class="section-h">Advisory playbook</h2>
        <div class="playbook">
          ${pillars.map((p) => `<div class="play-item"><p class="play-num">${p.id}</p><p class="play-title">${esc(p.title)}</p><p class="play-body">${esc(p.body)}</p></div>`).join("")}
        </div>
      </div>
    </section>

    ${renderReportFooter(data.disclaimer)}
  </div>
</article>`;

  return {
    fontLinks: ["https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"],
    css,
    body,
    desktopBg: "#E9EEF4",
  };
}
