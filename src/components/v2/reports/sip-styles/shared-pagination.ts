/**
 * Let long dossiers flow across PDF pages instead of avoiding breaks on whole sections.
 */
export const SHARED_PAGINATION_CSS = `
.section { break-inside: auto; page-break-inside: auto; }
.section-block { break-inside: auto; page-break-inside: auto; }
.playbook-block,
.reading-block,
.comp-block,
.report-footer {
  break-inside: avoid;
  page-break-inside: avoid;
}
table.sched thead {
  break-inside: avoid;
  page-break-inside: avoid;
}
table.sched tbody tr {
  break-inside: auto;
  page-break-inside: auto;
}
.reading-col, .play-item, .playbook > div, .delay, .outcome-card, .hero-card {
  break-inside: avoid;
  page-break-inside: avoid;
}
`;
