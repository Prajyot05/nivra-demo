import { formatINR, esc } from "./format";
import type { SipDossierData } from "./types";

/**
 * Single schedule table with one header row.
 * (Chunked tables were repeating the header 2–3 times on the same page.)
 */
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

  const body = data.schedule
    .map((row) => {
      const cls =
        row.year === data.investYears
          ? finalClass
          : row.milestone === "Midpoint"
            ? midClass
            : "";
      return `<tr class="${cls}">
        <td class="c">${row.year}</td>
        <td class="r">${formatINR(row.monthly)}</td>
        <td class="r">${formatINR(row.invested)}</td>
        <td class="r">${formatINR(row.fullReturn)}</td>
        <td class="r">${formatINR(row.inflationAdjusted)}</td>
        <td class="r">${esc(row.milestone)}</td>
      </tr>`;
    })
    .join("");

  return `<div class="sched-wrap">
    <table class="${tableClass}">
      <thead>
        <tr>
          <th class="c">Yr</th>
          <th>SIP (Mo)</th>
          <th>Invested</th>
          <th>Full return (end)</th>
          <th>Inflation-adjusted</th>
          <th>Milestone</th>
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
