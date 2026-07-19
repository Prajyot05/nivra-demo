"use client";

import { useState, useMemo } from "react";
import { calculateSipPlan, CalculatorInputs } from "@/utils/calculator";
import { formatIndianCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Calculator, TrendingUp, Wallet, ArrowRight } from "lucide-react";

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

  const [useGoalSeek, setUseGoalSeek] = useState(false);

  const handleInputChange = (field: keyof CalculatorInputs, value: number | boolean) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const results = useMemo(() => calculateSipPlan(inputs, useGoalSeek), [inputs, useGoalSeek]);

  const StatCard = ({ title, value, icon: Icon, highlight = false, subtext = "" }: any) => (
    <div className={`p-5 rounded-lg border ${highlight ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium tracking-wide">{title}</span>
      </div>
      <div className="text-xl sm:text-2xl font-semibold tracking-tight truncate" title={value}>
        {value}
      </div>
      {subtext && <div className={`mt-2 text-xs font-medium opacity-70`}>{subtext}</div>}
    </div>
  );

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Goal SIP Calculator
        </h1>
        <p className="text-muted-foreground mt-2">
          Calculate standard and step-up SIP requirements with precision.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-none border rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
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
                  className="font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tenure (Years)</Label>
                  <Input 
                    type="number" 
                    value={inputs.years} 
                    onChange={(e) => handleInputChange('years', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Expected Return (%)</Label>
                  <Input 
                    type="number" 
                    value={inputs.expectedReturnRate * 100} 
                    onChange={(e) => handleInputChange('expectedReturnRate', Number(e.target.value) / 100)}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Inflation Rate (%)</Label>
                  <Input 
                    type="number" 
                    value={inputs.inflationRate * 100} 
                    onChange={(e) => handleInputChange('inflationRate', Number(e.target.value) / 100)}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Delay (Months)</Label>
                  <Input 
                    type="number" 
                    value={inputs.delayMonths} 
                    onChange={(e) => handleInputChange('delayMonths', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
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

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium cursor-pointer" htmlFor="solver-toggle">
                    Use Iterative Solver
                  </Label>
                  <Switch 
                    id="solver-toggle"
                    checked={useGoalSeek} 
                    onCheckedChange={setUseGoalSeek} 
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-6">
          
          <Card className="shadow-none border rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 w-full overflow-hidden">
                  <div className="text-muted-foreground font-medium text-sm">
                    {inputs.useInflationAdjusted ? "Inflation Adjusted Target" : "Target Goal"}
                  </div>
                  <div 
                    className="text-4xl font-bold tracking-tight truncate w-full"
                    title={formatIndianCurrency(results.targetGoal)}
                  >
                    {formatIndianCurrency(results.targetGoal)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="standard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted/50 p-1">
              <TabsTrigger value="standard" className="rounded-md">Standard SIP</TabsTrigger>
              <TabsTrigger value="stepup" className="rounded-md">Step-Up SIP</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="standard" className="space-y-4 focus-visible:outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StatCard 
                    title="Monthly SIP Required" 
                    value={formatIndianCurrency(results.sipRequired)} 
                    icon={Wallet} 
                    highlight={true}
                  />
                  <StatCard 
                    title="Total Invested" 
                    value={formatIndianCurrency(results.sipTotalInvested)} 
                    icon={TrendingUp} 
                  />
                  <StatCard 
                    title="Maturity Value" 
                    value={formatIndianCurrency(results.sipMaturityValue)} 
                    icon={ArrowRight} 
                  />
                  <StatCard 
                    title="Capital Gains Tax" 
                    value={formatIndianCurrency(results.sipTax)} 
                    icon={Info} 
                  />
                </div>
                
                {inputs.delayMonths > 0 && (
                  <Card className="shadow-none border border-border">
                    <CardHeader className="pb-2 border-b bg-muted/30">
                      <CardTitle className="text-base font-semibold">Cost of Delay ({inputs.delayMonths} months)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="overflow-hidden">
                        <div className="text-sm font-medium mb-1">New SIP Required</div>
                        <div className="text-xl font-semibold truncate" title={formatIndianCurrency(results.delayedSipRequired)}>{formatIndianCurrency(results.delayedSipRequired)}</div>
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm font-medium mb-1">Additional Cost</div>
                        <div className="text-xl font-semibold truncate" title={formatIndianCurrency(results.costOfDelay)}>{formatIndianCurrency(results.costOfDelay)}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="stepup" className="space-y-4 focus-visible:outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StatCard 
                    title="Starting SIP Amount" 
                    value={formatIndianCurrency(results.suStartAmount)} 
                    icon={Wallet} 
                    highlight={true}
                    subtext={`+${inputs.stepUpPercentage * 100}% annually`}
                  />
                  <StatCard 
                    title={`Final Year SIP Amount`} 
                    value={formatIndianCurrency(results.suEndAmount)} 
                    icon={ArrowRight} 
                  />
                  <StatCard 
                    title="Total Invested" 
                    value={formatIndianCurrency(results.suTotalInvested)} 
                    icon={TrendingUp} 
                  />
                  <StatCard 
                    title="Capital Gains Tax" 
                    value={formatIndianCurrency(results.suTax)} 
                    icon={Info} 
                  />
                </div>
                
                <div className="flex items-center gap-2 p-3 rounded-lg border text-xs text-muted-foreground">
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    Method: <strong className="text-foreground font-medium">{results.stepUpMethodUsed}</strong>
                  </span>
                </div>
              </TabsContent>
            </div>
          </Tabs>

        </div>
      </div>
    </main>
  );
}
