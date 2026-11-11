"use client";

import { useMemo } from "react";
import type { SipCalculatorReportData } from "@/components/reports/sip-calculator-dossier";
import { buildSipStyleFragment } from "./document";
import { sipDossierFromReport } from "./sample-data";
import type { SipDossierStyleId } from "./types";

export const V2_SIP_STYLED_REPORT_ID = "v2-sip-calculator-report";

type Props = {
  id?: string;
  styleId: SipDossierStyleId;
  data: SipCalculatorReportData;
};

/**
 * Off-screen mount of a selected SIP dossier HTML style for PDF capture.
 */
export function SipStyledDossier({
  id = V2_SIP_STYLED_REPORT_ID,
  styleId,
  data,
}: Props) {
  const html = useMemo(() => {
    const view = sipDossierFromReport(data);
    return buildSipStyleFragment(styleId, view);
  }, [styleId, data]);

  return (
    <div
      id={id}
      data-v2-report="true"
      data-sip-style={styleId}
      className="pointer-events-none fixed w-[900px]"
      style={{
        left: "-10000px",
        top: 0,
        zIndex: -1,
        isolation: "isolate",
        boxSizing: "border-box",
        overflowX: "hidden",
        backgroundColor: "#f4f5f7",
      }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
