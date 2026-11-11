import { esc } from "./format";

/** Consistent disclaimer + Powered by Nivra across all five SIP dossier styles. */
export const SHARED_FOOTER_CSS = `
.report-footer {
  margin-top: 24px;
  padding-top: 14px;
  border-top: 1px solid #E2E8F0;
}
.report-footer .disclaimer {
  font-size: 10px;
  color: #64748B;
  margin: 0 0 16px;
  line-height: 1.55;
}
.powered-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}
.powered-mark {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #0B7A5B 20%, #0B7A5B 80%, transparent);
  border-radius: 1px;
}
.powered-line {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #94A3B8;
  font-weight: 500;
}
.powered-line .brand-name {
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.06em;
  text-transform: none;
  font-size: 11px;
}
`;

export function renderReportFooter(
  disclaimer: string,
  opts?: { extraClass?: string; keepTogether?: boolean },
): string {
  const extra = opts?.extraClass ? ` ${opts.extraClass}` : "";
  const keep = opts?.keepTogether !== false ? ' data-pdf-keep-together' : "";
  return `<footer class="report-footer${extra}"${keep}>
  <p class="disclaimer">${esc(disclaimer)}</p>
  <div class="powered-wrap">
    <span class="powered-mark" aria-hidden="true"></span>
    <p class="powered-line">Powered by <span class="brand-name">Nivra</span></p>
  </div>
</footer>`;
}
