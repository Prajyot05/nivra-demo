#!/usr/bin/env node
/**
 * Dev helper: print cached cell values from local Excel (.xlsx/.xlsm).
 * Does NOT recalculate formulas — open Excel and save first for GoalSeek sheets.
 *
 * Usage:
 *   npm i -D xlsx   # once
 *   node scripts/read-excel-cached.mjs "Unprotected/Nivra SIP Calculator v3.xlsm" Sheet1 A1 B2
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const [, , file, sheetName, ...cells] = process.argv;
  if (!file || !sheetName || cells.length === 0) {
    console.error(
      'Usage: node scripts/read-excel-cached.mjs <file.xlsx|xlsm> <sheet> <cell> [cell...]',
    );
    process.exit(1);
  }
  const path = resolve(file);
  if (!existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
  }
  let XLSX;
  try {
    XLSX = await import("xlsx");
  } catch {
    console.error("Install SheetJS first: npm i -D xlsx");
    process.exit(1);
  }
  const wb = XLSX.read(readFileSync(path), { type: "buffer", cellFormula: false });
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    console.error(`Sheet not found: ${sheetName}`);
    console.error("Available:", wb.SheetNames.join(", "));
    process.exit(1);
  }
  for (const addr of cells) {
    const cell = sheet[addr];
    console.log(`${addr}=${cell == null ? "(empty)" : cell.v}`);
  }
}

main();
