import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function AITokenPricingPanel({ results }: Props) {
  const costPerRequest = results.find(r => r.id === 'costPerRequest');
  const monthlyCost = results.find(r => r.id === 'monthlyCost');
  const annualCost = results.find(r => r.id === 'annualCost');
  const costPerUser = results.find(r => r.id === 'costPerUser');
  const inputCost = results.find(r => r.id === 'inputCost');
  const outputCost = results.find(r => r.id === 'outputCost');
  const modelName = results.find(r => r.id === 'modelName');
  const lastUpdated = results.find(r => r.id === 'lastUpdated');
  const allModelsRaw = results.find(r => r.id === '_allModels');

  const allModels = useMemo(() => {
    if (!allModelsRaw) return [];
    try { return JSON.parse(allModelsRaw.value); } catch { return []; }
  }, [allModelsRaw]);

  const parseVal = (r?: CalculatorResult) => {
    if (!r) return 0;
    const s = r.value.replace(/[\$,MK]/g, '');
    const n = parseFloat(s);
    if (r.value.includes('M')) return n * 1_000_000;
    if (r.value.includes('K')) return n * 1_000;
    return n;
  };

  const inputVal = parseVal(inputCost);
  const outputVal = parseVal(outputCost);
  const total = inputVal + outputVal || 1;
  const inputPct = (inputVal / total) * 100;
  const outputPct = (outputVal / total) * 100;

  const maxCost = allModels.length > 0 ? Math.max(...allModels.map((m: any) => m.costPerRequest)) : 1;

  return (
    <div className="rounded-xl border border-[rgba(26,115,232,0.12)] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[rgba(26,115,232,0.12)] bg-[#f8faff]">
        <span className="text-xs font-bold uppercase tracking-widest text-[#4a5568]">AI Token Cost Breakdown</span>
        {lastUpdated && (
          <span className="ml-auto text-[10px] text-[#718096]">Prices updated: {lastUpdated.value}</span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Stacked Bar — Input vs Output */}
        <div>
          <p className="text-xs font-semibold text-[#4a5568] mb-2">Cost Breakdown per Request</p>
          <div className="h-8 rounded-lg overflow-hidden flex">
            <div className="flex items-center justify-center text-xs font-bold text-white transition-all" style={{ width: `${inputPct}%`, background: '#3b82f6', minWidth: inputPct > 0 ? 'fit-content' : undefined }}>
              {inputPct > 10 && `Input ${inputPct.toFixed(0)}%`}
            </div>
            <div className="flex items-center justify-center text-xs font-bold text-white transition-all" style={{ width: `${outputPct}%`, background: '#8b5cf6', minWidth: outputPct > 10 ? 'fit-content' : undefined }}>
              {outputPct > 10 && `Output ${outputPct.toFixed(0)}%`}
            </div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-[#718096]">
            <span>● Input: {inputCost?.value || '$0'}</span>
            <span>● Output: {outputCost?.value || '$0'}</span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#f0f9f6] border border-[rgba(0,191,165,0.3)] p-4">
            <p className="text-[10px] font-semibold text-[#00BFA5] uppercase tracking-wider mb-1">Per Request</p>
            <p className="text-xl font-bold text-[#1C1C2E]">{costPerRequest?.value || '$0'}</p>
          </div>
          <div className="rounded-lg bg-[#f8faff] border border-[rgba(26,115,232,0.12)] p-4">
            <p className="text-[10px] font-semibold text-[#4a5568] uppercase tracking-wider mb-1">Monthly</p>
            <p className="text-xl font-bold text-[#1C1C2E]">{monthlyCost?.value || '$0'}</p>
          </div>
          <div className="rounded-lg bg-[#f8faff] border border-[rgba(26,115,232,0.12)] p-4">
            <p className="text-[10px] font-semibold text-[#4a5568] uppercase tracking-wider mb-1">Annual</p>
            <p className="text-xl font-bold text-[#1C1C2E]">{annualCost?.value || '$0'}</p>
          </div>
          <div className="rounded-lg bg-[#f8faff] border border-[rgba(26,115,232,0.12)] p-4">
            <p className="text-[10px] font-semibold text-[#4a5568] uppercase tracking-wider mb-1">Cost per User</p>
            <p className="text-xl font-bold text-[#1C1C2E]">{costPerUser?.value || '$0'}</p>
          </div>
        </div>

        {/* All-model comparison */}
        {allModels.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#4a5568] mb-3">All Models — Cost for Same Request</p>
            <div className="space-y-1.5">
              {allModels.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 text-xs">
                  <span className="w-36 shrink-0 text-[#4a5568] truncate" title={m.label}>{m.label}</span>
                  <span className="w-16 shrink-0 text-[#718096]">{m.provider}</span>
                  <div className="flex-1 h-5 rounded bg-[#f1f5f9] overflow-hidden relative">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${(m.costPerRequest / maxCost) * 100}%`,
                        background: m.costPerRequest === Math.min(...allModels.map((x: any) => x.costPerRequest)) ? '#22c55e' : '#3b82f6',
                        minWidth: m.costPerRequest > 0 ? '4px' : undefined,
                      }}
                    />
                  </div>
                  <span className="w-20 text-right font-medium text-[#1C1C2E]" suppressHydrationWarning>
                    ${m.costPerRequest.toFixed(m.costPerRequest < 0.01 ? 6 : 4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
