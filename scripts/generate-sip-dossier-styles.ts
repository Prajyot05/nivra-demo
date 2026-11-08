/**
 * Emits standalone HTML samples for the five SIP dossier styles.
 * Run: npx tsx scripts/generate-sip-dossier-styles.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSipStyleDocument } from "../src/components/v2/reports/sip-styles/document";
import { SAMPLE_SIP_DOSSIER_DATA } from "../src/components/v2/reports/sip-styles/sample-data";
import { SIP_DOSSIER_STYLES } from "../src/components/v2/reports/sip-styles/types";

const outDir = join(process.cwd(), "docs/Reports/sip-dossier-styles");
mkdirSync(outDir, { recursive: true });

for (const style of SIP_DOSSIER_STYLES) {
  const html = buildSipStyleDocument(style.id, SAMPLE_SIP_DOSSIER_DATA);
  const file = join(outDir, `${style.id}.html`);
  writeFileSync(file, html, "utf8");
  console.log("wrote", file);
}

console.log("Done. Open with ?delay=12 to show Cost of Delay.");
