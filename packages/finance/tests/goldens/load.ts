import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type GoldenScenario = {
  name: string;
  source: string;
  cells?: Record<string, string>;
  engineInput: Record<string, unknown>;
  apiInput: Record<string, unknown>;
  expect: Record<string, number>;
};

export type GoldenFile = {
  id: string;
  scenarios: GoldenScenario[];
};

const dir = dirname(fileURLToPath(import.meta.url));

export function loadGolden(id: string): GoldenFile {
  const raw = readFileSync(join(dir, `${id}.json`), "utf8");
  return JSON.parse(raw) as GoldenFile;
}

export function loadAllGoldens(): GoldenFile[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => loadGolden(f.replace(/\.json$/, "")))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export const CALCULATOR_IDS = [
  "growth-sip",
  "growth-lumpsum",
  "growth-stepup",
  "growth-periodic",
  "goal-sip",
  "goal-current",
  "goal-ls-sip",
  "goal-existing-sip",
  "goal-periodic",
  "goal-compounding",
  "loan-emi",
  "loan-prepay",
  "loan-extra-vs-invest",
  "loan-interest-recovery",
  "vehicle-loan",
  "mf-fd",
  "insurance-irr",
  "insurance-tp",
  "multi-goal-assign",
  "multi-withdrawals",
  "education",
  "fire-planner",
  "financial-health",
] as const;

export type CalculatorId = (typeof CALCULATOR_IDS)[number];
