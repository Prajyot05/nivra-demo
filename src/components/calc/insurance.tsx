"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Download, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  INSURANCE_IRR_REPORT_ID,
  InsuranceIrrDossier,
} from "@/components/reports/insurance-irr-dossier";
import {
  INSURANCE_TP_REPORT_ID,
  InsuranceTpDossier,
} from "@/components/reports/insurance-tp-dossier";
import {
  ClientHeader,
  CompareChart,
  CompositionChart,
  formatINRCurrency,
  formatPercent,
  GrowthChart,
  META_TEXT,
  MoneyInput,
  PercentInput,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  StatCard,
  StatusNote,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";

const FORM_GRID =
  "grid grid-cols-2 items-start gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
const FORM_GRID_DENSE =
  "grid grid-cols-2 items-start gap-x-3 gap-y-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6";

const MODES = [
  { id: "irr", label: "IRR" },
  { id: "switch", label: "Term + invest" },
] as const;

type Mode = (typeof MODES)[number]["id"];
const MODE_IDS = MODES.map((m) => m.id);

type IrrResult = {
  totalPremium: number;
  maturity: number;
  gain: number;
  tax: number;
  net: number;
  xirr: number;
  payTermRate: number;
};

type TpResult = {
  remainingPremiums: number;
  investmentPeriodYears: number;
  additionalWealth: number;
  termCover: number;
  keep: { totalPremium: number; maturity: number; tax: number; net: number; irr: number };
  switch: {
    surrenderValue: number;
    termCost: number;
    investMaturity: number;
    irr: number;
    surrenderIrr: number;
    totalPaidToDate: number;
    sipRedirectAnnual: number;
    corpusPath: Array<{ year: number; corpus: number }>;
  };
  compare: Array<{ category: string; keep: number; switch: number }>;
};

export function InsuranceCalculator() {
  const [mode] = useCalculatorMode(MODE_IDS, "irr");
  const [name, setName] = useState("Mr. John Doe");
  const [age, setAge] = useState(42);

  const [premium, setPremium] = useState(200_000);
  const [payTerm, setPayTerm] = useState(5);
  const [corpusAtPayEnd, setCorpusAtPayEnd] = useState(1_160_000);
  const [policyTerm, setPolicyTerm] = useState(20);
  const [ret, setRet] = useState(11);
  const [tax, setTax] = useState(12.5);

  const [tpName, setTpName] = useState("Lucky Singh");
  const [tpAge, setTpAge] = useState(51);
  const [tpPremium, setTpPremium] = useState(300_000);
  const [tpPay, setTpPay] = useState(5);
  const [yearsPaid, setYearsPaid] = useState(3);
  const [tpPol, setTpPol] = useState(20);
  const [yearsLeft, setYearsLeft] = useState(11);
  const [maturity, setMaturity] = useState(5_000_000);
  const [tpTax, setTpTax] = useState(20);
  const [surrender, setSurrender] = useState(3_000_000);
  const [termPrem, setTermPrem] = useState(10_000);
  const [termYears, setTermYears] = useState(11);
  const [termCover, setTermCover] = useState(10_000_000);
  const [tpRet, setTpRet] = useState(11.88);

  const irrPremiumError =
    !(premium > 0) ? "Annual premium must be greater than 0." : undefined;
  const irrPayTermError =
    !(payTerm > 0)
      ? "Premium payment term must be greater than 0."
      : payTerm > policyTerm
        ? "Premium payment term cannot exceed the policy term."
        : undefined;
  const irrCorpusError =
    !(corpusAtPayEnd > 0)
      ? "Corpus at payment end must be greater than 0."
      : undefined;
  const irrPolicyTermError =
    !(policyTerm > 0)
      ? "Policy term must be greater than 0."
      : policyTerm > 50
        ? "Policy term cannot exceed 50 years."
        : undefined;
  const irrReturnError =
    !(ret > 0)
      ? "Expected return must be above 0%."
      : ret > 100
        ? "Expected return cannot exceed 100%."
        : undefined;
  const irrTaxError =
    tax < 0
      ? "Capital gains tax cannot be negative."
      : tax > 100
        ? "Capital gains tax cannot exceed 100%."
        : undefined;
  const irrCanCalculate =
    !irrPremiumError &&
    !irrPayTermError &&
    !irrCorpusError &&
    !irrPolicyTermError &&
    !irrReturnError &&
    !irrTaxError;

  const tpPremiumError =
    !(tpPremium > 0) ? "Annual premium must be greater than 0." : undefined;
  const tpPayError =
    !(tpPay > 0)
      ? "Premium payment term must be greater than 0."
      : tpPay > tpPol
        ? "Premium payment term cannot exceed the policy term."
        : undefined;
  const tpYearsPaidError =
    yearsPaid < 0
      ? "Years paid cannot be negative."
      : yearsPaid > tpPay
        ? "Years paid cannot exceed the premium payment term."
        : undefined;
  const tpPolError =
    !(tpPol > 0)
      ? "Policy term must be greater than 0."
      : tpPol > 50
        ? "Policy term cannot exceed 50 years."
        : undefined;
  const tpYearsLeftError =
    !(yearsLeft > 0)
      ? "Years to maturity must be greater than 0."
      : yearsLeft > tpPol
        ? "Years to maturity cannot exceed the policy term."
        : undefined;
  const tpMaturityError =
    !(maturity > 0) ? "Maturity value must be greater than 0." : undefined;
  const tpSurrenderError =
    surrender < 0 ? "Surrender value cannot be negative." : undefined;
  const tpSurrenderWarn =
    surrender > maturity && maturity > 0
      ? "Surrender value is higher than maturity value. Confirm this matches the insurer quote."
      : undefined;
  const tpTermPremError =
    termPrem < 0 ? "Term premium cannot be negative." : undefined;
  const tpTermYearsError =
    !(termYears > 0) ? "Term years must be greater than 0." : undefined;
  const tpRetError =
    !(tpRet > 0)
      ? "Expected investment return must be above 0%."
      : tpRet > 100
        ? "Expected investment return cannot exceed 100%."
        : undefined;
  const tpTaxError =
    tpTax < 0
      ? "Tax on gain cannot be negative."
      : tpTax > 100
        ? "Tax on gain cannot exceed 100%."
        : undefined;
  const tpCanCalculate =
    !tpPremiumError &&
    !tpPayError &&
    !tpYearsPaidError &&
    !tpPolError &&
    !tpYearsLeftError &&
    !tpMaturityError &&
    !tpSurrenderError &&
    !tpTermPremError &&
    !tpTermYearsError &&
    !tpRetError &&
    !tpTaxError;

  const input = useMemo(() => {
    if (mode === "irr") {
      return {
        clientName: name,
        age,
        premium,
        payTerm,
        corpusAtPayEnd,
        policyTerm,
        returnPct: ret,
        taxPct: tax,
      };
    }
    return {
      clientName: tpName,
      age: tpAge,
      premium: tpPremium,
      payTerm: tpPay,
      yearsPaid,
      policyTerm: tpPol,
      yearsToMaturity: yearsLeft,
      maturityValue: maturity,
      taxPct: tpTax,
      surrenderValue: surrender,
      termPremium: termPrem,
      termYears,
      termCover,
      returnPct: tpRet,
    };
  }, [
    mode,
    name,
    age,
    premium,
    payTerm,
    corpusAtPayEnd,
    policyTerm,
    ret,
    tax,
    tpName,
    tpAge,
    tpPremium,
    tpPay,
    yearsPaid,
    tpPol,
    yearsLeft,
    maturity,
    tpTax,
    surrender,
    termPrem,
    termYears,
    termCover,
    tpRet,
  ]);

  const calculatorId = mode === "irr" ? "insurance-irr" : "insurance-tp";
  const { result, error, loading } = useCalculate<IrrResult & Partial<TpResult>>(
    calculatorId,
    input,
    mode === "irr" ? irrCanCalculate : tpCanCalculate,
  );

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!result || isDownloading) return;

    if (mode === "irr") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          INSURANCE_IRR_REPORT_ID,
          `insurance-irr-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "switch") {
      setIsDownloading(true);
      try {
        const safe = (tpName || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          INSURANCE_TP_REPORT_ID,
          `insurance-tp-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/insurance", mode)}
      description={
        mode === "irr"
          ? "Compare policy maturity, net returns after tax, and full-term XIRR."
          : "Compare keeping the policy versus surrendering into term cover plus investment."
      }
      actions={
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)] transition-colors disabled:opacity-50"
          onClick={handleDownload}
          disabled={isDownloading || !result}
          title="Download Executive Dossier"
        >
          {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        </Button>
      }
      form={
        mode === "irr" ? (
          <div className="flex flex-col gap-3">
            <div className={FORM_GRID}>
              <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
              <MoneyInput
                label="Annual premium"
                value={premium}
                onChange={setPremium}
                error={irrPremiumError}
              />
              <YearInput
                label="Pay term"
                value={payTerm}
                min={1}
                max={50}
                onChange={setPayTerm}
                error={irrPayTermError}
                hint="Premium years"
              />
              <MoneyInput
                label="Corpus at pay end"
                value={corpusAtPayEnd}
                onChange={setCorpusAtPayEnd}
                error={irrCorpusError}
                wrapLabel
              />
              <YearInput
                label="Policy term"
                value={policyTerm}
                min={1}
                max={50}
                onChange={setPolicyTerm}
                error={irrPolicyTermError}
              />
              <PercentInput
                label="Expected return (%)"
                value={ret}
                onChange={setRet}
                error={irrReturnError}
                wrapLabel
              />
              <PercentInput
                label="Tax on gain (%)"
                value={tax}
                onChange={setTax}
                error={irrTaxError}
              />
            </div>
            <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-[12px] leading-snug text-[var(--app-text)]">
              Premiums for{" "}
              <span className="font-semibold tabular-nums">{payTerm}</span> year
              {payTerm === 1 ? "" : "s"}
              <span className="text-[var(--app-text-muted)]"> · </span>
              Policy matures in year{" "}
              <span className="font-semibold tabular-nums">{policyTerm}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-0.5 rounded-full bg-[var(--app-text-muted)]" />
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                  Current policy
                </div>
              </div>
              <div className={FORM_GRID}>
                <ClientHeader
                  name={tpName}
                  age={tpAge}
                  onNameChange={setTpName}
                  onAgeChange={setTpAge}
                />
                <MoneyInput
                  label="Annual premium"
                  value={tpPremium}
                  onChange={setTpPremium}
                  error={tpPremiumError}
                />
                <YearInput
                  label="Pay term"
                  value={tpPay}
                  min={1}
                  max={50}
                  onChange={setTpPay}
                  error={tpPayError}
                  hint="Original premium years"
                />
                <YearInput
                  label="Years paid"
                  value={yearsPaid}
                  min={0}
                  max={50}
                  onChange={setYearsPaid}
                  error={tpYearsPaidError}
                  hint="Already paid"
                />
                <YearInput
                  label="Policy term"
                  value={tpPol}
                  min={1}
                  max={50}
                  onChange={setTpPol}
                  error={tpPolError}
                />
                <YearInput
                  label="Yrs to maturity"
                  value={yearsLeft}
                  min={1}
                  max={50}
                  onChange={setYearsLeft}
                  error={tpYearsLeftError}
                  hint={`${yearsLeft}y remaining`}
                  wrapLabel
                />
                <MoneyInput
                  label="Maturity value"
                  value={maturity}
                  onChange={setMaturity}
                  error={tpMaturityError}
                />
                <MoneyInput
                  label="Surrender value"
                  value={surrender}
                  onChange={setSurrender}
                  error={tpSurrenderError}
                />
                <PercentInput
                  label="Tax on gain (%)"
                  value={tpTax}
                  onChange={setTpTax}
                  error={tpTaxError}
                />
              </div>
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5 sm:px-3.5">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                  Policy snapshot
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-medium text-[var(--app-text)]">
                        Premium years paid
                      </span>
                      <span className="text-[12px] font-semibold tabular-nums text-[var(--app-text)]">
                        {yearsPaid}
                        <span className="font-medium text-[var(--app-text-muted)]">/{tpPay}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--app-border)]">
                      <div
                        className="h-full rounded-full bg-[var(--app-chart-invested)]"
                        style={{
                          width: `${tpPay > 0 ? Math.min(100, (yearsPaid / tpPay) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-[var(--app-text-muted)]">
                      {Math.max(0, tpPay - yearsPaid)} premium year
                      {Math.max(0, tpPay - yearsPaid) === 1 ? "" : "s"} still due if you keep
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-medium text-[var(--app-text)]">
                        Years to maturity
                      </span>
                      <span className="text-[12px] font-semibold tabular-nums text-[var(--app-text)]">
                        {yearsLeft}
                        <span className="font-medium text-[var(--app-text-muted)]">
                          /{tpPol} term
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--app-border)]">
                      <div
                        className="h-full rounded-full bg-[var(--app-step-text)]"
                        style={{
                          width: `${tpPol > 0 ? Math.min(100, ((tpPol - yearsLeft) / tpPol) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-[var(--app-text-muted)]">
                      {yearsLeft} year{yearsLeft === 1 ? "" : "s"} remaining on a {tpPol}-year
                      policy
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-0.5 rounded-full bg-[var(--app-step-text)]" />
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
                  Switch strategy
                </div>
              </div>
              <div className={FORM_GRID_DENSE}>
                <MoneyInput
                  label="Term premium"
                  value={termPrem}
                  onChange={setTermPrem}
                  error={tpTermPremError}
                />
                <YearInput
                  label="Term years"
                  value={termYears}
                  min={1}
                  max={50}
                  onChange={setTermYears}
                  error={tpTermYearsError}
                />
                <MoneyInput
                  label="Term cover"
                  value={termCover}
                  onChange={setTermCover}
                  hint="Sum assured"
                />
                <PercentInput
                  label="Expected return (%)"
                  value={tpRet}
                  onChange={setTpRet}
                  error={tpRetError}
                  wrapLabel
                  hint="Assumed investment rate"
                />
              </div>
            </div>
          </div>
        )
      }
      results={
        <div className="flex flex-col gap-3">
          {mode === "irr" && !irrCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted premium, term, corpus, return, or tax fields before calculating.
              Premium payment term cannot exceed policy term.
            </StatusNote>
          ) : null}
          {mode === "switch" && !tpCanCalculate ? (
            <StatusNote tone="error">
              Fix the highlighted policy, surrender, term, or investment fields before calculating.
              Premium payment term cannot exceed policy term, and years paid cannot exceed the
              payment term.
            </StatusNote>
          ) : null}
          {mode === "switch" && tpCanCalculate && tpSurrenderWarn ? (
            <StatusNote tone="warn">{tpSurrenderWarn}</StatusNote>
          ) : null}
          {error ? <StatusNote tone="error">{error}</StatusNote> : null}
          {loading && !result ? (
            <StatusNote tone="pending">Calculating…</StatusNote>
          ) : null}
          {mode === "irr" && result && "maturity" in result && "xirr" in result ? (
            <IrrResults
              result={result as IrrResult}
              payTerm={payTerm}
              policyTerm={policyTerm}
              expectedReturnPct={ret}
              annualPremium={premium}
            />
          ) : null}
          {mode === "switch" && result && "keep" in result ? (
            <TpResults
              result={result as TpResult}
              yearsToMaturity={yearsLeft}
              expectedReturnPct={tpRet}
              termPremium={termPrem}
            />
          ) : null}
        </div>
      }
    />
    {mode === "irr" && result && "maturity" in result && "xirr" in result ? (
      <InsuranceIrrDossier
        data={{
          clientName: name,
          age,
          premium,
          payTerm,
          corpusAtPayEnd,
          policyTerm,
          returnPct: ret,
          taxPct: tax,
          totalPremium: result.totalPremium,
          maturity: result.maturity,
          gain: result.gain,
          tax: result.tax,
          net: result.net,
          xirr: result.xirr,
          payTermRate: result.payTermRate,
        }}
      />
    ) : null}
    {mode === "switch" && result && "keep" in result ? (
      <InsuranceTpDossier
        data={{
          clientName: tpName,
          age: tpAge,
          premium: tpPremium,
          payTerm: tpPay,
          yearsPaid,
          policyTerm: tpPol,
          yearsToMaturity: yearsLeft,
          maturityValue: maturity,
          taxPct: tpTax,
          surrenderValue: surrender,
          termPremium: termPrem,
          termYears,
          termCover,
          returnPct: tpRet,
          remainingPremiums: result.remainingPremiums ?? 0,
          investmentPeriodYears: result.investmentPeriodYears ?? yearsLeft,
          additionalWealth: result.additionalWealth ?? 0,
          keep: result.keep!,
          switch: result.switch!,
          compare: result.compare ?? [],
        }}
      />
    ) : null}
    </>
  );
}

function IrrResults({
  result,
  payTerm,
  policyTerm,
  expectedReturnPct,
  annualPremium,
}: {
  result: IrrResult;
  payTerm: number;
  policyTerm: number;
  expectedReturnPct: number;
  annualPremium: number;
}) {
  const xirrPct = Number.isFinite(result.xirr) ? result.xirr * 100 : null;
  const growthYears = Math.max(0, policyTerm - payTerm);
  const returnScale = Math.max(expectedReturnPct, xirrPct ?? 0, 1);
  const assumedBar = Math.min(100, (expectedReturnPct / returnScale) * 100);
  const xirrBar =
    xirrPct == null ? 0 : Math.min(100, (xirrPct / returnScale) * 100);
  const xirrGap =
    xirrPct == null ? null : Math.abs(expectedReturnPct - xirrPct);

  const moneySteps = [
    {
      key: "premium",
      label: "You pay in premiums",
      value: result.totalPremium,
      sign: null as "+" | "−" | "=" | null,
      tone: "muted" as const,
    },
    {
      key: "gain",
      label: "Investment gain",
      value: result.gain,
      sign: "+" as const,
      tone: "gain" as const,
    },
    {
      key: "gross",
      label: "Gross maturity",
      value: result.maturity,
      sign: "=" as const,
      tone: "strong" as const,
    },
    {
      key: "tax",
      label: "Capital gains tax",
      value: result.tax,
      sign: "−" as const,
      tone: "tax" as const,
    },
    {
      key: "net",
      label: "You keep after tax",
      value: result.net,
      sign: "=" as const,
      tone: "net" as const,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid w-full grid-cols-1 gap-2 min-[640px]:grid-cols-3">
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Gross maturity"
            value={result.maturity}
            hint={`From ${formatINRCurrency(result.totalPremium)} premiums`}
          />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Net after tax"
            value={result.net}
            hint={`Tax ${formatINRCurrency(result.tax)}`}
            variant="soft"
          />
        </div>
        <div className="flex min-h-[5.25rem] min-w-0 flex-col justify-center rounded-xl bg-[var(--app-primary)] px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-primary-fg-muted)] sm:text-[11px]">
            Policy XIRR
          </div>
          <div className="mt-1 text-lg font-semibold leading-tight tabular-nums text-[var(--app-primary-fg)] sm:text-xl">
            {xirrPct == null ? "—" : formatPercent(xirrPct, 2)}
          </div>
          <div className="mt-1 text-[11px] leading-snug text-[var(--app-primary-fg-muted)]">
            {xirrPct == null
              ? "Could not compute for these inputs"
              : xirrGap == null
                ? `Assumed ${formatPercent(expectedReturnPct, 1)}`
                : `${formatPercent(xirrGap, 2)} ${
                    xirrPct < expectedReturnPct ? "below" : "above"
                  } assumed ${formatPercent(expectedReturnPct, 1)}`}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 sm:px-4">
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
            Premium to maturity
          </div>
          <div className={META_TEXT}>
            {formatINRCurrency(annualPremium)}/year for {payTerm}y · matures in year{" "}
            {policyTerm}
          </div>
        </div>
        <div className="relative w-full overflow-x-auto pt-1">
          <div
            className="pointer-events-none absolute left-6 right-6 top-[0.95rem] h-0.5 bg-[var(--app-border)]"
            aria-hidden
          />
          <div className="relative z-[1] flex min-w-[28rem] items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] text-[var(--app-warn-text-strong)]">
                <span className="text-[10px] font-bold">1-{payTerm}</span>
              </div>
              <div className="mt-1.5 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
                  Pay premiums
                </div>
                <div className="text-[11px] font-semibold tabular-nums text-[var(--app-warn-text)]">
                  {formatINRCurrency(result.totalPremium)}
                </div>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                <span className="text-[10px] font-bold">
                  {growthYears > 0 ? `${payTerm + 1}-${policyTerm}` : "—"}
                </span>
              </div>
              <div className="mt-1.5 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
                  No premiums
                </div>
                <div className={`text-[11px] font-semibold tabular-nums ${META_TEXT}`}>
                  Growth phase
                </div>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--app-step-text)] bg-[var(--app-step-bg)] text-[var(--app-step-text-strong)]">
                <span className="text-[10px] font-bold">Y{policyTerm}</span>
              </div>
              <div className="mt-1.5 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                  Gross maturity
                </div>
                <div className="text-[11px] font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                  {formatINRCurrency(result.maturity)}
                </div>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--app-step-text)] bg-[var(--app-primary)] text-[var(--app-primary-fg)]">
                <span className="text-[10px] font-bold">Net</span>
              </div>
              <div className="mt-1.5 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-step-text)]">
                  After tax
                </div>
                <div className="text-[11px] font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                  {formatINRCurrency(result.net)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${RESULTS_SPLIT} gap-3 lg:items-start`}>
        <div className={`${RESULTS_LEFT} gap-3`}>
          <CompositionChart
            title="Gross maturity mix"
            showPercentages
            slices={[
              {
                name: "Premium paid",
                value: result.totalPremium,
                color: "var(--app-chart-invested)",
              },
              {
                name: "Gain",
                value: result.gain,
                color: "var(--app-chart-gain)",
              },
            ]}
            centerLabel="Gross maturity"
            centerValue={result.maturity}
            footer={
              <div className="grid grid-cols-1 gap-1.5">
                <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-2.5 py-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-warn-text)]">
                    Capital gains tax
                  </div>
                  <div className="text-xs font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
                    {formatINRCurrency(result.tax)}
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)] px-2.5 py-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
                    Net after tax
                  </div>
                  <div className="text-xs font-semibold tabular-nums text-[var(--app-text)]">
                    {formatINRCurrency(result.net)}
                  </div>
                </div>
              </div>
            }
          />

          <CompareChart
            title="Premiums vs gross & net maturity"
            className="min-h-[280px] flex-none sm:min-h-[300px]"
            showBarLabels
            showLegend={false}
            data={[
              {
                category: "Premiums",
                value: result.totalPremium,
                fill: "var(--app-chart-invested)",
              },
              {
                category: "Gross maturity",
                value: result.maturity,
                fill: "var(--app-chart-gain)",
              },
              {
                category: "Net after tax",
                value: result.net,
                fill: "var(--app-chart-tax)",
              },
            ]}
            series={[{ key: "value", label: "Amount", color: "var(--app-chart-gain)" }]}
          />
          <div className={`-mt-1 px-0.5 ${META_TEXT}`}>
            Tax of {formatINRCurrency(result.tax)} sits between gross and net maturity.
          </div>
        </div>

        <div className={`${RESULTS_RIGHT} gap-3`}>
          <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
            <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                How your money moves
              </div>
              <div className={`mt-0.5 ${META_TEXT}`}>
                From premiums paid to what you keep after tax
              </div>
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              {moneySteps.map((step) => {
                const rowClass =
                  step.tone === "net"
                    ? "border border-[var(--app-step-text)]/35 bg-[var(--app-step-bg)]"
                    : step.tone === "tax"
                      ? "border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)]"
                      : step.tone === "strong"
                        ? "border border-[var(--app-border)] bg-[var(--app-surface-muted)]"
                        : "border border-transparent bg-transparent";
                const valueClass =
                  step.tone === "net" || step.tone === "gain"
                    ? "text-[var(--app-step-text-strong)]"
                    : step.tone === "tax"
                      ? "text-[var(--app-warn-text-strong)]"
                      : "text-[var(--app-text)]";
                return (
                  <div
                    key={step.key}
                    className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 ${rowClass}`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {step.sign ? (
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            step.sign === "−"
                              ? "bg-[var(--app-warn-bg)] text-[var(--app-warn-text-strong)]"
                              : step.sign === "+"
                                ? "bg-[var(--app-step-bg)] text-[var(--app-step-text-strong)]"
                                : "bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]"
                          }`}
                        >
                          {step.sign}
                        </span>
                      ) : (
                        <span className="size-5 shrink-0" aria-hidden />
                      )}
                      <span
                        className={`text-[13px] leading-snug ${
                          step.tone === "net" || step.tone === "strong"
                            ? "font-semibold text-[var(--app-text)]"
                            : "font-medium text-[var(--app-text-muted)]"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    <div
                      className={`shrink-0 text-right text-[13px] font-semibold tabular-nums sm:text-[14px] ${valueClass}`}
                    >
                      {formatINRCurrency(step.value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Assumed return vs policy XIRR
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-[var(--app-text-muted)]">
                    Assumed investment return
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-[var(--app-text)]">
                    {formatPercent(expectedReturnPct, 1)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--app-chart-invested)]"
                    style={{ width: `${assumedBar}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-[var(--app-step-text)]">
                    Your policy XIRR
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                    {xirrPct == null ? "—" : formatPercent(xirrPct, 2)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--app-step-text)]"
                    style={{ width: `${xirrBar}%` }}
                  />
                </div>
              </div>
            </div>
            <div className={`mt-2.5 ${META_TEXT}`}>
              {xirrPct == null
                ? "XIRR could not be calculated for this cash-flow pattern."
                : xirrPct < expectedReturnPct
                  ? "Premium timing and tax pull the effective return below the assumed rate."
                  : "Effective policy return meets or exceeds the assumed investment return."}
            </div>
            <div className="mt-2 border-t border-[var(--app-border)] pt-2 text-[12px] text-[var(--app-text-muted)]">
              Pay-term rate{" "}
              <span className="font-semibold tabular-nums text-[var(--app-text)]">
                {formatPercent(result.payTermRate * 100, 2)}
              </span>
              <span className="ml-1">over the {payTerm} premium years</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TpResults({
  result,
  yearsToMaturity,
  expectedReturnPct,
  termPremium,
}: {
  result: TpResult;
  yearsToMaturity: number;
  expectedReturnPct: number;
  termPremium: number;
}) {
  const keepIrrPct = Number.isFinite(result.keep.irr) ? result.keep.irr * 100 : null;
  const switchIrrPct = Number.isFinite(result.switch.irr) ? result.switch.irr * 100 : null;
  const surrenderIrrPct = Number.isFinite(result.switch.surrenderIrr)
    ? result.switch.surrenderIrr * 100
    : null;
  const additionalWealth =
    result.additionalWealth ?? result.switch.investMaturity - result.keep.net;
  const initialFunding = result.switch.surrenderValue + result.switch.termCost;
  const corpusPath =
    result.switch.corpusPath?.length > 0
      ? result.switch.corpusPath
      : [
          { year: 0, corpus: result.switch.surrenderValue },
          { year: yearsToMaturity, corpus: result.switch.investMaturity },
        ];
  const termCover = result.termCover ?? 0;
  const formatIrr = (pct: number | null) =>
    pct == null ? "—" : formatPercent(pct, 2);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid w-full grid-cols-2 gap-2 min-[720px]:grid-cols-5">
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Keep (net)"
            value={result.keep.net}
            hint={keepIrrPct == null ? undefined : `IRR ${formatIrr(keepIrrPct)}`}
          />
        </div>
        <div className="min-h-[5.25rem] min-w-0 [&>div]:h-full">
          <StatCard
            title="Switch corpus"
            value={result.switch.investMaturity}
            hint={
              switchIrrPct == null ? undefined : `IRR ${formatIrr(switchIrrPct)}`
            }
            variant="soft"
          />
        </div>
        <div className="col-span-2 min-h-[5.25rem] min-w-0 min-[720px]:col-span-1 [&>div]:h-full">
          <StatCard
            title="Additional wealth"
            value={additionalWealth}
            hint="What switching adds"
          />
        </div>
        <div className="flex min-h-[5.25rem] min-w-0 flex-col justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
            Keep IRR
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--app-text)] sm:text-xl">
            {formatIrr(keepIrrPct)}
          </div>
          <div className={`mt-1 ${META_TEXT}`}>Policy path</div>
        </div>
        <div className="flex min-h-[5.25rem] min-w-0 flex-col justify-center rounded-xl border border-[var(--app-step-text)]/30 bg-[var(--app-step-bg)] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
            Switch IRR
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--app-step-text-strong)] sm:text-xl">
            {formatIrr(switchIrrPct)}
          </div>
          <div className={`mt-1 text-[var(--app-step-text)] ${META_TEXT}`}>
            Investment
            {surrenderIrrPct != null ? ` · Surr. ${formatIrr(surrenderIrrPct)}` : null}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[var(--app-step-text)]/35 bg-[var(--app-primary)] px-3 py-3.5 sm:px-4">
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-[var(--app-primary-fg)]/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/3 size-40 rounded-full bg-[var(--app-primary-fg)]/5"
          aria-hidden
        />
        <div className="relative z-[1] flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-primary-fg-muted)]">
                <TrendingUp className="size-3.5 shrink-0" aria-hidden />
                Switch advantage
              </div>
              <div className="mt-1 text-base font-semibold leading-snug text-[var(--app-primary-fg)] sm:text-lg">
                Switching could add {formatINRCurrency(additionalWealth)}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <div className="rounded-lg bg-[var(--app-primary-fg)]/12 px-2.5 py-1 text-[11px] text-[var(--app-primary-fg)]">
                <span className="text-[var(--app-primary-fg-muted)]">Horizon</span>{" "}
                <span className="font-semibold tabular-nums">{yearsToMaturity}y</span>
              </div>
              <div className="rounded-lg bg-[var(--app-primary-fg)]/12 px-2.5 py-1 text-[11px] text-[var(--app-primary-fg)]">
                <span className="text-[var(--app-primary-fg-muted)]">Assumed</span>{" "}
                <span className="font-semibold tabular-nums">
                  {formatPercent(expectedReturnPct, 2)}
                </span>
              </div>
              {termCover > 0 ? (
                <div className="rounded-lg bg-[var(--app-primary-fg)]/12 px-2.5 py-1 text-[11px] text-[var(--app-primary-fg)]">
                  <span className="text-[var(--app-primary-fg-muted)]">Cover</span>{" "}
                  <span className="font-semibold tabular-nums">
                    {formatINRCurrency(termCover)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-xl bg-[var(--app-primary-fg)]/10 px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-primary-fg-muted)]">
                Keep net
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--app-primary-fg)] sm:text-base">
                {formatINRCurrency(result.keep.net)}
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--app-primary-fg-muted)]">
                IRR {formatIrr(keepIrrPct)}
              </div>
            </div>
            <div className="hidden items-center justify-center sm:flex">
              <div className="flex size-8 items-center justify-center rounded-full bg-[var(--app-primary-fg)]/15 text-[var(--app-primary-fg)]">
                <ArrowRight className="size-4" aria-hidden />
              </div>
            </div>
            <div className="rounded-xl bg-[var(--app-primary-fg)]/15 px-3 py-2.5 ring-1 ring-[var(--app-primary-fg)]/20">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-primary-fg-muted)]">
                Switch corpus
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--app-primary-fg)] sm:text-base">
                {formatINRCurrency(result.switch.investMaturity)}
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--app-primary-fg-muted)]">
                IRR {formatIrr(switchIrrPct)}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-[var(--app-primary-fg-muted)]">
              <span>Keep share of switch corpus</span>
              <span className="font-semibold tabular-nums text-[var(--app-primary-fg)]">
                {result.switch.investMaturity > 0
                  ? formatPercent((result.keep.net / result.switch.investMaturity) * 100, 0)
                  : "—"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--app-primary-fg)]/15">
              <div
                className="h-full rounded-full bg-[var(--app-primary-fg)]/70"
                style={{
                  width: `${
                    result.switch.investMaturity > 0
                      ? Math.min(100, (result.keep.net / result.switch.investMaturity) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 sm:px-4">
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
            How the switch works
          </div>
          <div className="text-[11px] text-[var(--app-text-muted)]">
            Surrender → term cover → invest → grow
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2 xl:grid-cols-4">
          {[
            {
              n: "1",
              label: "Surrender",
              value: formatINRCurrency(result.switch.surrenderValue),
              sub: "Invested today",
              box: "border-[var(--app-warn-border)] bg-[var(--app-warn-bg)]",
              badge: "border-[var(--app-warn-border)] bg-[var(--app-surface)] text-[var(--app-warn-text-strong)]",
              labelTone: "text-[var(--app-warn-text)]",
              valueTone: "text-[var(--app-warn-text-strong)]",
            },
            {
              n: "2",
              label: "Buy term",
              value: `${formatINRCurrency(termPremium)}/yr`,
              sub: termCover > 0 ? `Cover ${formatINRCurrency(termCover)}` : "Life cover",
              box: "border-[var(--app-border)] bg-[var(--app-surface-muted)]",
              badge: "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]",
              labelTone: "text-[var(--app-text-muted)]",
              valueTone: "text-[var(--app-text)]",
            },
            {
              n: "3",
              label: "Invest rest",
              value: `${formatINRCurrency(result.switch.sipRedirectAnnual)}/yr`,
              sub: "Premium redirected",
              box: "border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)]",
              badge: "border-[var(--app-step-text)]/35 bg-[var(--app-surface)] text-[var(--app-step-text)]",
              labelTone: "text-[var(--app-step-text)]",
              valueTone: "text-[var(--app-step-text-strong)]",
            },
            {
              n: "4",
              label: "Projected corpus",
              value: formatINRCurrency(result.switch.investMaturity),
              sub: `In year ${yearsToMaturity}`,
              box: "border-[var(--app-step-text)]/35 bg-[var(--app-step-bg)]",
              badge: "border-[var(--app-step-text)] bg-[var(--app-primary)] text-[var(--app-primary-fg)]",
              labelTone: "text-[var(--app-step-text)]",
              valueTone: "text-[var(--app-step-text-strong)]",
            },
          ].map((step) => (
            <div
              key={step.n}
              className={`flex items-start gap-2.5 rounded-xl border px-2.5 py-2.5 ${step.box}`}
            >
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${step.badge}`}
              >
                {step.n}
              </div>
              <div className="min-w-0">
                <div className={`text-[10px] font-semibold uppercase tracking-wide ${step.labelTone}`}>
                  {step.label}
                </div>
                <div className={`mt-0.5 text-[13px] font-semibold tabular-nums leading-snug ${step.valueTone}`}>
                  {step.value}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--app-text-muted)]">{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
            Keep policy
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 text-[12px]">
            <div>
              <div className="text-[10px] text-[var(--app-text-muted)]">Gross maturity</div>
              <div className="font-semibold tabular-nums">
                {formatINRCurrency(result.keep.maturity)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--app-text-muted)]">Tax on gain</div>
              <div className="font-semibold tabular-nums text-[var(--app-warn-text)]">
                {formatINRCurrency(result.keep.tax)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--app-surface-muted)] px-2 py-1.5">
              <div className="text-[10px] text-[var(--app-text-muted)]">Net value</div>
              <div className="font-semibold tabular-nums">
                {formatINRCurrency(result.keep.net)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--app-surface-muted)] px-2 py-1.5">
              <div className="text-[10px] text-[var(--app-text-muted)]">Keep IRR</div>
              <div className="font-semibold tabular-nums">{formatIrr(keepIrrPct)}</div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--app-step-text)]/30 bg-[var(--app-surface)]">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--app-step-text)]/20 bg-[var(--app-step-bg)] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
              Surrender + term + invest
            </div>
            {termCover > 0 ? (
              <div className="rounded-md bg-[var(--app-surface)]/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                {formatINRCurrency(termCover)} cover
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 text-[12px]">
            <div>
              <div className="text-[10px] text-[var(--app-text-muted)]">Surrender in</div>
              <div className="font-semibold tabular-nums">
                {formatINRCurrency(result.switch.surrenderValue)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--app-text-muted)]">Term cost</div>
              <div className="font-semibold tabular-nums">
                {formatINRCurrency(result.switch.termCost)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--app-step-bg)] px-2 py-1.5">
              <div className="text-[10px] text-[var(--app-step-text)]">Projected corpus</div>
              <div className="font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                {formatINRCurrency(result.switch.investMaturity)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--app-step-bg)] px-2 py-1.5">
              <div className="text-[10px] text-[var(--app-step-text)]">Investment IRR</div>
              <div className="font-semibold tabular-nums text-[var(--app-step-text-strong)]">
                {formatIrr(switchIrrPct)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${RESULTS_SPLIT} gap-3 lg:items-start`}>
        <div className={`${RESULTS_LEFT} gap-3`}>
          <CompareChart
            title="Keep vs switch outcomes"
            className="min-h-[260px] flex-none sm:min-h-[280px]"
            showBarLabels
            data={result.compare}
            series={[
              { key: "keep", label: "Keep policy", color: "var(--app-chart-tax)" },
              { key: "switch", label: "Term + invest", color: "var(--app-chart-gain)" },
            ]}
          />
          <div className={`-mt-1 px-0.5 ${META_TEXT}`}>
            Final value under each strategy. Tax and term cost are shown separately.
          </div>

          <GrowthChart
            title="Switched corpus over time"
            className="h-[300px] min-h-[300px] w-full flex-none sm:h-[340px] sm:min-h-[340px]"
            data={corpusPath}
            series={[
              {
                key: "corpus",
                label: "Investment corpus",
                color: "var(--app-chart-gain)",
              },
            ]}
            showEndLabels
            endpointDots
            xTickFormatter={(year) => {
              if (year === 0) return "Y0";
              if (year === yearsToMaturity) return `Y${yearsToMaturity}`;
              if (year % 5 === 0) return `Y${year}`;
              return "";
            }}
          />
          <div className={`-mt-1 px-0.5 ${META_TEXT}`}>
            Year 0 surrender → year {yearsToMaturity} projected corpus.
          </div>
        </div>

        <div className={`${RESULTS_RIGHT} gap-3`}>
          <CompositionChart
            title="Initial switch funding"
            showPercentages
            slices={[
              {
                name: "Surrender invested",
                value: result.switch.surrenderValue,
                color: "var(--app-chart-invested)",
              },
              {
                name: "Term cost",
                value: result.switch.termCost,
                color: "var(--app-chart-tax)",
              },
            ]}
            centerLabel="Initial funding"
            centerValue={initialFunding}
            footer={
              <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)] px-2.5 py-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
                  Projected corpus
                </div>
                <div className="text-xs font-semibold tabular-nums text-[var(--app-text)]">
                  {formatINRCurrency(result.switch.investMaturity)}
                </div>
              </div>
            }
          />

          <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
            <div className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Strategy comparison
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[20rem] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--app-border)] text-[10px] uppercase tracking-wider text-[var(--app-text-muted)]">
                    <th className="px-3 py-2 font-semibold">Metric</th>
                    <th className="px-3 py-2 text-right font-semibold">Keep</th>
                    <th className="px-3 py-2 text-right font-semibold">Switch</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: "Initial / surrender",
                      keep: "—",
                      switch: formatINRCurrency(result.switch.surrenderValue),
                    },
                    {
                      label: "Term cost",
                      keep: "—",
                      switch: formatINRCurrency(result.switch.termCost),
                    },
                    {
                      label: "Term cover",
                      keep: "—",
                      switch: termCover > 0 ? formatINRCurrency(termCover) : "—",
                    },
                    {
                      label: "Maturity / corpus",
                      keep: formatINRCurrency(result.keep.maturity),
                      switch: formatINRCurrency(result.switch.investMaturity),
                    },
                    {
                      label: "Tax",
                      keep: formatINRCurrency(result.keep.tax),
                      switch: "—",
                    },
                    {
                      label: "Net / final value",
                      keep: formatINRCurrency(result.keep.net),
                      switch: formatINRCurrency(result.switch.investMaturity),
                    },
                    {
                      label: "IRR",
                      keep: formatIrr(keepIrrPct),
                      switch: formatIrr(switchIrrPct),
                    },
                  ].map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-[var(--app-border)] last:border-b-0"
                    >
                      <td className="px-3 py-2 text-[var(--app-text-muted)]">{row.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--app-text)]">
                        {row.keep}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--app-text)]">
                        {row.switch}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`border-t border-[var(--app-border)] px-3 py-2 ${META_TEXT}`}>
              Surrender IRR {formatIrr(surrenderIrrPct)} · Investment IRR{" "}
              {formatIrr(switchIrrPct)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
