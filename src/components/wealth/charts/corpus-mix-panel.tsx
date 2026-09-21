"use client";

import { WealthMixDonut } from "./wealth-mix-donut";

export function CorpusMixPanel({
  stdInvested,
  stdGain,
  stdCorpus,
  stdTax,
  stdNet,
  stepInvested,
  stepGain,
  stepCorpus,
  stepTax,
  stepNet,
}: {
  stdInvested: number;
  stdGain: number;
  stdCorpus: number;
  stdTax: number;
  stdNet: number;
  stepInvested: number;
  stepGain: number;
  stepCorpus: number;
  stepTax: number;
  stepNet: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <WealthMixDonut
        title="Standard SIP"
        centerValue={stdCorpus}
        tax={stdTax}
        net={stdNet}
        slices={[
          { name: "Invested", value: stdInvested, color: "#64748B" },
          { name: "Gain", value: stdGain, color: "#10B981" },
        ]}
      />
      <WealthMixDonut
        title="Step-Up SIP"
        centerValue={stepCorpus}
        tax={stepTax}
        net={stepNet}
        slices={[
          { name: "Invested", value: stepInvested, color: "#475569" },
          { name: "Gain", value: stepGain, color: "#059669" },
        ]}
      />
    </div>
  );
}
