import type { BuiltStyle, SipDossierData, SipDossierStyleId } from "./types";
import { SAMPLE_SIP_DOSSIER_DATA } from "./sample-data";
import { buildClassicMemo } from "./style-classic-memo";
import { buildCompactBrief } from "./style-compact-brief";
import { buildAdvisorRail } from "./style-advisor-rail";
import { buildFactsheet } from "./style-factsheet";
import { buildPortfolioDesk } from "./style-portfolio-desk";

export type { BuiltStyle };

const BUILDERS: Record<SipDossierStyleId, (data: SipDossierData) => BuiltStyle> = {
  "classic-memo": buildClassicMemo,
  "compact-brief": buildCompactBrief,
  "advisor-rail": buildAdvisorRail,
  factsheet: buildFactsheet,
  "portfolio-desk": buildPortfolioDesk,
};

export function buildSipStyle(styleId: SipDossierStyleId, data: SipDossierData): BuiltStyle {
  return BUILDERS[styleId](data);
}

/** Fragment for React PDF capture (sheet only, with scoped styles). */
export function buildSipStyleFragment(styleId: SipDossierStyleId, data: SipDossierData): string {
  const built = buildSipStyle(styleId, data);
  const imports = built.fontLinks
    .map((href) => `@import url('${href}');`)
    .join("\n");
  return `<style>${imports}\n${built.css}</style>${built.body}`;
}

/** Full standalone HTML document for docs/Reports samples. */
export function buildSipStyleDocument(
  styleId: SipDossierStyleId,
  data: SipDossierData = SAMPLE_SIP_DOSSIER_DATA,
): string {
  const built = buildSipStyle(styleId, data);
  const fontTags = built.fontLinks
    .map(
      (href) => `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${href}" rel="stylesheet" />`,
    )
    .join("\n");

  const dataJson = JSON.stringify(data, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${data.title} · ${styleId}</title>
${fontTags}
<style>
${built.css}
</style>
</head>
<body>
<!-- Toggle delayed scenario: append ?delay=12 to the URL -->
<script id="report-data" type="application/json">
${dataJson}
</script>
<script>
(function () {
  try {
    var raw = document.getElementById("report-data");
    var data = raw ? JSON.parse(raw.textContent || "{}") : {};
    var params = new URLSearchParams(window.location.search);
    if (params.get("delay") === "12") data.delayMonths = 12;
    window.REPORT_DATA = data;
    var delaySection = document.getElementById("cost-of-delay");
    if (delaySection) {
      delaySection.hidden = !(data.delayMonths > 0);
    }
    var delayValue = document.getElementById("delay-value");
    if (delayValue) {
      delayValue.textContent = (data.delayMonths || 0) + " mo";
    }
  } catch (e) {}
})();
</script>
<div class="desktop">
${built.body}
</div>
</body>
</html>`;
}
