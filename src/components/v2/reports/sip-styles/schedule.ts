import { formatINR, esc } from "./format";
import type { SipDossierData } from "./types";

/**
 * Single schedule table with one header row.
 * (Chunked tables were repeating the header 2–3 times on the same page.)
 */
function scheduleTableClass(data: SipDossierData, tableClass: string): string {
  let maxLen = 0;
  for (const row of data.schedule) {
    for (const v of [row.monthly, row.invested, row.fullReturn, row.inflationAdjusted]) {
      maxLen = Math.max(maxLen, formatINR(v).length);
    }
  }
  const density =
    maxLen >= 17 ? "sched-xdense" : maxLen >= 15 ? "sched-dense" : "";
  return [tableClass, density].filter(Boolean).join(" ");
}

export function renderScheduleTable(
  data: SipDossierData,
  opts: {
    midClass?: string;
    finalClass?: string;
    tableClass?: string;
  } = {},
): string {
  const {
    midClass = "row-mid",
    finalClass = "row-final",
    tableClass = "sched",
  } = opts;

  const tableCls = scheduleTableClass(data, tableClass);

  const body = data.schedule
    .map((row) => {
      const cls =
        row.year === data.investYears
          ? finalClass
          : row.milestone === "Midpoint"
            ? midClass
            : "";
      return `<tr class="${cls}">
        <td class="c yr">${row.year}</td>
        <td class="r num">${formatINR(row.monthly)}</td>
        <td class="r num">${formatINR(row.invested)}</td>
        <td class="r num">${formatINR(row.fullReturn)}</td>
        <td class="r num infl">${formatINR(row.inflationAdjusted)}</td>
        <td class="milestone">${esc(row.milestone)}</td>
      </tr>`;
    })
    .join("");

  return `<div class="sched-wrap">
    <table class="${tableCls}">
      <colgroup>
        <col class="col-yr" />
        <col class="col-num" />
        <col class="col-num" />
        <col class="col-num" />
        <col class="col-infl" />
        <col class="col-milestone" />
      </colgroup>
      <thead>
        <tr>
          <th class="c" scope="col">Yr</th>
          <th class="r" scope="col">SIP / mo</th>
          <th class="r" scope="col">Invested</th>
          <th class="r" scope="col">Full return</th>
          <th class="r infl" scope="col">Infl. adjusted</th>
          <th class="milestone" scope="col">Milestone</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
}

/** @deprecated Use renderScheduleTable. Kept as alias during migration. */
export function renderScheduleChunks(
  data: SipDossierData,
  opts: {
    chunkSize?: number;
    midClass?: string;
    finalClass?: string;
    tableClass?: string;
  } = {},
): string {
  return renderScheduleTable(data, opts);
}
