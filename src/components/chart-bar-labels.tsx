import type { ReactNode } from "react";
import { formatIndianCurrency } from "@/lib/utils";

type BarLabelProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: ReactNode;
  variant?: "sip" | "stepup";
};

function formatBarValue(value: ReactNode) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (isNaN(n)) return "";
  return formatIndianCurrency(n);
}

// Rough monospace-ish width estimate for bold 9-10px sans text (digits, ₹, commas)
function estimateTextLength(text: string, fontSize: number) {
  return text.length * fontSize * 0.62;
}

const VARIANT_COLORS = {
  sip: "#123f4d",
  stepup: "#a47b2c",
};

export function ChartBarLabel({ variant = "sip", ...props }: BarLabelProps) {
  const x = Number(props.x || 0);
  const y = Number(props.y || 0);
  const width = Number(props.width || 0);
  const height = Number(props.height || 0);
  const label = formatBarValue(props.value);
  if (!label) return null;

  const textX = x + width / 2;
  const fontSize = 9;
  const textLen = estimateTextLength(label, fontSize);
  const isSmall = height < 70;

  if (isSmall) {
    // Rotated label placed just above the bar, on a solid pill so white text
    // stays legible against the white chart background and doesn't collide
    // with the neighboring bar's label.
    const padY = 4;
    const pivotY = y - padY - textLen / 2;
    const pillWidth = fontSize + 8;
    const pillHeight = textLen + 8;
    const pillX = textX - pillWidth / 2;
    const pillY = pivotY - textLen / 2 - 4;

    return (
      <g>
        <rect
          x={pillX}
          y={pillY}
          width={pillWidth}
          height={pillHeight}
          rx={4}
          fill={VARIANT_COLORS[variant]}
        />
        <text
          x={textX}
          y={pivotY}
          fill="#ffffff"
          fontSize={fontSize}
          fontWeight={600}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(-90, ${textX}, ${pivotY})`}
        >
          {label}
        </text>
      </g>
    );
  }

  const textY = y + height / 2;

  return (
    <text
      x={textX}
      y={textY}
      fill="#ffffff"
      fontSize={10}
      fontWeight={600}
      textAnchor="middle"
      dominantBaseline="middle"
      transform={`rotate(-90, ${textX}, ${textY})`}
    >
      {label}
    </text>
  );
}

export const ChartBarLabelSIP = (props: Omit<BarLabelProps, "variant">) => (
  <ChartBarLabel {...props} variant="sip" />
);

export const ChartBarLabelStepUp = (props: Omit<BarLabelProps, "variant">) => (
  <ChartBarLabel {...props} variant="stepup" />
);

export const comparisonChartData = (results: {
  sipTotalInvested: number;
  suTotalInvested: number;
  sipTax: number;
  suTax: number;
  sipMaturityValue: number;
  suMaturityValue: number;
}) => [
  { name: "Invested", Standard: results.sipTotalInvested, StepUp: results.suTotalInvested },
  { name: "Tax", Standard: results.sipTax, StepUp: results.suTax },
  { name: "Corpus", Standard: results.sipMaturityValue, StepUp: results.suMaturityValue },
];