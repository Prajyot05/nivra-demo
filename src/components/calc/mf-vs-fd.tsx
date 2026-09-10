"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ClientHeader,
  CompareChart,
  CompositionChart,
  formatPercent,
  MoneyInput,
  PercentInput,
  ResultCard,
  StatCard,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import {
  MfVsFdDossier,
  MF_VS_FD_REPORT_ID,
} from "@/components/reports/mf-vs-fd-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import { generatePdfFromElement } from "@/lib/pdf-generator";

const FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] items-start gap-x-3 gap-y-3";

const DAY_PRESETS = [7, 15, 30, 90, 180, 365] as const;
// tax rates: PercentInput only

type Leg = {
  invested: number;
  gain: number;
  tax: number;
  net: number;
  preTax: number;
  postTax: number;
  annualizedReturn: number;
  returnPerDay: number;
};

type MfFdResult = {
  mf: Leg;
  fd: Leg;
  difference: number;
  mfAdvantage: number;
  fdAdvantage: number;
  compare: Array<{ category: string; mf: number; fd: number }>;
};

function interestError(value: number, label: string): string | undefined {
  if (value > 100) return `${label} cannot exceed 100%.`;
  if (value < 0) return `${label} cannot be negative.`;
  return undefined;
}

function legItems(leg: Leg, advantage: number) {
  return [
    {
      label: "Annualized return",
      value: leg.annualizedReturn,
    },
    {
      label: "Return per day",
      value: leg.returnPerDay,
    },
    {
      label: "Expected pre-tax return",
      value: leg.preTax,
    },
    {
      label: "Tax on profit",
      value: leg.tax,
    },
    {
      label: "Post-tax return",
      value: leg.postTax,
    },
    {
      label: "Difference in return",
      value: advantage,
    },
    {
      label: "Final maturity amount",
      value: leg.net,
      highlight: true,
    },
  ];
}

export function MfVsFd() {
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(30);
  const [amount, setAmount] = useState(10_000_000);
  const [days, setDays] = useState(15);
  const [mfReturn, setMfReturn] = useState(5);
  const [fdReturn, setFdReturn] = useState(3);
  const [mfTax, setMfTax] = useState(20);
  const [fdTax, setFdTax] = useState(25);

  const amountError =
    amount < 1
      ? amount <= 0
        ? "Investment amount is required."
        : "Amount must be at least ₹1."
      : undefined;
  const daysError = days < 1 ? "Investment period must be at least 1 day." : undefined;
  const daysWarning =
    !daysError && days > 3650 ? "Unusually long duration (over 10 years)." : undefined;
  const mfInterestErr = interestError(mfReturn, "MF interest");
  const fdInterestErr = interestError(fdReturn, "FD interest");
  const mfTaxErr = interestError(mfTax, "MF tax rate");
  const fdTaxErr = interestError(fdTax, "FD tax rate");

  const canCalculate =
    !amountError &&
    !daysError &&
    !mfInterestErr &&
    !fdInterestErr &&
    !mfTaxErr &&
    !fdTaxErr &&
    days <= 36500;

  const input = useMemo(
    () => ({
      clientName: name,
      age,
      amount,
      days,
      mfReturnPct: mfReturn,
      fdReturnPct: fdReturn,
      mfTaxPct: mfTax,
      fdTaxPct: fdTax,
    }),
    [name, age, amount, days, mfReturn, fdReturn, mfTax, fdTax],
  );

  const { result, error, loading } = useCalculate<MfFdResult>("mf-fd", input, canCalculate);
  const [isDownloading, setIsDownloading] = useState(false);

  const insight = useMemo(() => {
    if (!result) return null;
    const mfWins = result.mfAdvantage > result.fdAdvantage;
    const fdWins = result.fdAdvantage > result.mfAdvantage;
    const advantage = mfWins ? result.mfAdvantage : result.fdAdvantage;
    const base = mfWins ? result.fd.postTax : result.mf.postTax;
    const relativePct = base > 0 ? (advantage / base) * 100 : 0;
    return { advantage, relativePct, mfWins, fdWins };
  }, [result]);

  const handleDownload = async () => {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    try {
      const safe = (name || "client")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      await generatePdfFromElement(
        MF_VS_FD_REPORT_ID,
        `mf-vs-fd-${safe || "report"}`,
      );
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
    <CalculatorPage
      title="Mutual Fund vs Fixed Deposit"
      description="Short-horizon post-tax compare of mutual funds vs fixed deposits (365-day count)."
      actions={
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)] transition-colors"
          onClick={handleDownload}
          title={isDownloading ? "Preparing PDF…" : "Download Report"}
          disabled={!result || isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
        </Button>
      }
      form={
        <div className="flex flex-col gap-3">
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput
              label="Investment amount"
              value={amount}
              onChange={setAmount}
              error={amountError}
            />
            <YearInput
              label="Investment period"
              value={days}
              min={1}
              max={36500}
              suffix="Days"
              onChange={setDays}
              error={daysError}
              hint={daysWarning}
            />
            <PercentInput
              label="MF interest"
              value={mfReturn}
              onChange={setMfReturn}
              error={mfInterestErr}
            />
            <PercentInput
              label="FD interest"
              value={fdReturn}
              onChange={setFdReturn}
              error={fdInterestErr}
            />
            <PercentInput
              label="MF tax rate"
              value={mfTax}
              onChange={setMfTax}
              error={mfTaxErr}
            />
            <PercentInput
              label="FD tax rate"
              value={fdTax}
              onChange={setFdTax}
              error={fdTaxErr}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]">
              Quick period
            </span>
            {DAY_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDays(preset)}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium tabular-nums transition-colors ${
                  days === preset
                    ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-text)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:border-[var(--app-primary)]"
                }`}
              >
                {preset} Days
              </button>
            ))}
          </div>
        </div>
      }
      results={
        <div className="flex flex-col gap-3">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {!canCalculate ? (
            <div className="rounded-lg border border-[var(--app-danger)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--app-danger)]">
              Fix the inputs above to refresh the calculation. Showing the last valid result.
            </div>
          ) : null}
          {loading && !result && canCalculate ? (
            <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p>
          ) : null}
          {result && insight ? (
            <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
              <div className="flex flex-col gap-3 lg:col-span-7">
                <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-3">
                  <StatCard
                    title="MF post-tax return"
                    value={result.mf.postTax}
                    hint={insight.mfWins ? "Higher return" : "After tax"}
                  />
                  <StatCard
                    title="FD post-tax return"
                    value={result.fd.postTax}
                    variant="soft"
                    hint={insight.fdWins ? "Higher return" : "After tax"}
                  />
                  <StatCard
                    title={insight.mfWins ? "MF advantage" : insight.fdWins ? "FD advantage" : "Advantage"}
                    value={insight.advantage}
                    variant={insight.mfWins ? "primary" : "soft"}
                    hint={
                      insight.advantage > 0 && insight.relativePct > 0
                        ? `${formatPercent(insight.relativePct, 1)} more than ${insight.mfWins ? "FD" : "MF"}`
                        : "Tied"
                    }
                  />
                </div>
                <CompareChart
                  title="MF vs FD"
                  showBarLabels
                  data={result.compare}
                  series={[
                    { key: "mf", label: "Mutual fund", color: "var(--app-chart-gain)" },
                    { key: "fd", label: "Fixed deposit", color: "var(--app-chart-invested)" },
                  ]}
                />
                <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                  <CompositionChart
                    title="MF mix"
                    showPercentages
                    slices={[
                      {
                        name: "Invested",
                        value: result.mf.invested,
                        color: "var(--app-chart-invested)",
                      },
                      { name: "Gain", value: result.mf.gain, color: "var(--app-chart-gain)" },
                      { name: "Tax", value: result.mf.tax, color: "var(--app-chart-tax)" },
                    ]}
                    centerLabel="Maturity"
                    centerValue={result.mf.net}
                  />
                  <CompositionChart
                    title="FD mix"
                    showPercentages
                    slices={[
                      {
                        name: "Invested",
                        value: result.fd.invested,
                        color: "var(--app-chart-invested)",
                      },
                      { name: "Gain", value: result.fd.gain, color: "var(--app-chart-gain)" },
                      { name: "Tax", value: result.fd.tax, color: "var(--app-chart-tax)" },
                    ]}
                    centerLabel="Maturity"
                    centerValue={result.fd.net}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:col-span-5">
                <ResultCard title="Mutual funds" items={legItems(result.mf, result.mfAdvantage)} />
                <ResultCard title="Fixed deposit" items={legItems(result.fd, result.fdAdvantage)} />
              </div>
              <div className="rounded-xl border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] p-3 sm:p-4 lg:col-span-12">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-warn-text-strong)]">
                  Important investment notes
                </div>
                <ul className="mt-2 list-disc space-y-2 pl-4 text-xs leading-relaxed text-[var(--app-warn-text)] sm:columns-2 sm:gap-x-8">
                  <li>
                    Fixed Deposits may charge a premature withdrawal penalty, even for partial
                    withdrawals.
                  </li>
                  <li>
                    Debt/Arbitrage Mutual Funds provide flexibility in investment duration, unlike
                    FDs where tenure is fixed at the start.
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      }
    />
    {result ? (
      <MfVsFdDossier
        data={{
          clientName: name,
          age,
          amount,
          days,
          mfReturnPct: mfReturn,
          fdReturnPct: fdReturn,
          mfTaxPct: mfTax,
          fdTaxPct: fdTax,
          mf: result.mf,
          fd: result.fd,
          mfAdvantage: result.mfAdvantage,
          fdAdvantage: result.fdAdvantage,
          difference: result.difference,
        }}
      />
    ) : null}
    </>
  );
}
