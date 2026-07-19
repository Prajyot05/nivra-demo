"use client";

import { useState, useMemo } from "react";
import { calculateSipPlan, CalculatorInputs } from "@/utils/calculator";
import { formatIndianCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info, Calculator, TrendingUp, Wallet, ArrowRight, Clock } from "lucide-react";

export default function Home() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    goalAmount: 10000000,
    years: 15,
    expectedReturnRate: 0.12,
    taxRate: 0.125,
    stepUpPercentage: 0.10,
    inflationRate: 0.0575,
    useInflationAdjusted: false,
    delayMonths: 0,
  });

  const handleInputChange = (field: keyof CalculatorInputs, value: number | boolean) => {
    if (field === 'delayMonths' && typeof value === 'number') {
      value = Math.max(0, value);
    }
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  // We default to the mathematical solver for production use as it's exact and fast.
  const results = useMemo(() => calculateSipPlan(inputs), [inputs]);

  const StatBox = ({ title, value, icon: Icon, subtext = "", highlight = false }: any) => (
    <div className={`p-4 rounded-lg border flex flex-col justify-center h-full ${highlight ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground'}`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        <span className="text-xs sm:text-sm font-medium tracking-wide">{title}</span>
      </div>
      <div className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight truncate" title={value}>
        {value}
      </div>
      {subtext && <div className="mt-1 text-xs font-medium opacity-70 truncate">{subtext}</div>}
    </div>
  );

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 bg-background text-foreground">
      
      {/* Header */}
      <div className="border-b pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Goal SIP Calculator
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Compare Standard and Step-Up SIP requirements side-by-side.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Inputs */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="shadow-none border rounded-xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Goal Amount (₹)</Label>
                <Input 
                  type="number" 
                  value={inputs.goalAmount} 
                  onChange={(e) => handleInputChange('goalAmount', Number(e.target.value))}
                  className="font-medium h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tenure (Years)</Label>
                  <Input 
                    type="number" 
                    value={inputs.years} 
                    onChange={(e) => handleInputChange('years', Number(e.target.value))}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Expected Return (%)</Label>
                  <Input 
                    type="number" 
                    value={inputs.expectedReturnRate * 100} 
                    onChange={(e) => handleInputChange('expectedReturnRate', Number(e.target.value) / 100)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tax Rate (%)</Label>
                  <Input 
                    type="number" 
                    value={inputs.taxRate * 100} 
                    onChange={(e) => handleInputChange('taxRate', Number(e.target.value) / 100)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Inflation Rate (%)</Label>
                  <Input 
                    type="number" 
                    value={inputs.inflationRate * 100} 
                    onChange={(e) => handleInputChange('inflationRate', Number(e.target.value) / 100)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Step-Up Rate (%)</Label>
                  <Input 
                    type="number" 
                    value={inputs.stepUpPercentage * 100} 
                    onChange={(e) => handleInputChange('stepUpPercentage', Number(e.target.value) / 100)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Delay (Months)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={inputs.delayMonths} 
                    onChange={(e) => handleInputChange('delayMonths', Number(e.target.value))}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium cursor-pointer" htmlFor="inflation-toggle">
                    Adjust target for inflation
                  </Label>
                  <Switch 
                    id="inflation-toggle"
                    checked={inputs.useInflationAdjusted} 
                    onCheckedChange={(checked) => handleInputChange('useInflationAdjusted', checked)} 
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Target Goal Summary */}
          <Card className="shadow-none border rounded-xl overflow-hidden bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                    {inputs.useInflationAdjusted ? "Inflation Adjusted Target" : "Target Goal"}
                  </div>
                  <div 
                    className="text-4xl font-bold tracking-tight truncate"
                    title={formatIndianCurrency(results.targetGoal)}
                  >
                    {formatIndianCurrency(results.targetGoal)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard SIP Panel */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                Standard SIP Plan
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <StatBox 
                    title="Monthly SIP Required" 
                    value={formatIndianCurrency(results.sipRequired)} 
                    icon={Wallet} 
                    highlight={true}
                  />
                </div>
                <StatBox 
                  title="Total Invested" 
                  value={formatIndianCurrency(results.sipTotalInvested)} 
                  icon={TrendingUp} 
                />
                <StatBox 
                  title="Capital Gains Tax" 
                  value={formatIndianCurrency(results.sipTax)} 
                  icon={Info} 
                />
              </div>

              {/* Cost of Delay - Always present to maintain layout stability */}
              <Card className="shadow-none border rounded-xl overflow-hidden bg-card mt-4">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Cost of Delay Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 gap-4">
                  <div className="overflow-hidden">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Delayed Monthly SIP</div>
                    <div className="text-lg font-semibold truncate">
                      {inputs.delayMonths > 0 ? formatIndianCurrency(results.delayedSipRequired) : "₹ 0"}
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Lost Compounding</div>
                    <div className={`text-lg font-semibold truncate ${inputs.delayMonths > 0 ? "text-destructive" : ""}`}>
                      {inputs.delayMonths > 0 ? formatIndianCurrency(results.costOfDelay) : "₹ 0"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step-Up SIP Panel */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                Step-Up SIP Plan
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <StatBox 
                    title="Starting SIP Amount" 
                    value={formatIndianCurrency(results.suStartAmount)} 
                    icon={Wallet} 
                    highlight={true}
                    subtext={`Increases by ${inputs.stepUpPercentage * 100}% annually`}
                  />
                </div>
                <StatBox 
                  title="Total Invested" 
                  value={formatIndianCurrency(results.suTotalInvested)} 
                  icon={TrendingUp} 
                />
                <StatBox 
                  title="Capital Gains Tax" 
                  value={formatIndianCurrency(results.suTax)} 
                  icon={Info} 
                />
              </div>

              <Card className="shadow-none border rounded-xl overflow-hidden bg-card mt-4">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    End of Tenure Outlook
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 gap-4">
                  <div className="overflow-hidden">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Final Year Monthly SIP Amount</div>
                    <div className="text-lg font-semibold truncate">
                      {formatIndianCurrency(results.suEndAmount)}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
