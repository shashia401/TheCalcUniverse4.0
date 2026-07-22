import { TrendingUp } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[$%,+\s]/g, '').replace(/,/g, '')) || 0;
}

function ComparisonBars({ cagr, simpleAvg, totalReturn, growthMultiple }: {
  cagr: number; simpleAvg: number; totalReturn: number; growthMultiple: number;
}) {
  const maxVal = Math.max(Math.abs(cagr), Math.abs(simpleAvg), 1);
  const barScale = (v: number) => (v / maxVal) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-emerald-600">CAGR (True Growth)</span>
          <span className="text-xs font-bold text-slate-700">{(cagr * 100).toFixed(2)}%</span>
        </div>
        <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(barScale(cagr), 100)}%`, backgroundColor: cagr >= 0 ? '#10b981' : '#ef4444' }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-amber-600">Simple Average</span>
          <span className="text-xs font-bold text-slate-700">{(simpleAvg * 100).toFixed(2)}%</span>
        </div>
        <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(barScale(simpleAvg), 100)}%`, backgroundColor: '#f59e0b' }}
          />
        </div>
      </div>
      <div className="pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-600">Volatility Drag</span>
          <span className="text-xs font-bold text-red-500">{((simpleAvg - cagr) * 100).toFixed(2)}%</span>
        </div>
        <p className="text-[10px] text-slate-500">CAGR is always ≤ simple average — the gap reveals the cost of volatility</p>
      </div>
    </div>
  );
}

export default function AverageReturnPanel({ results }: Props) {
  if (!results.length) return null;

  const cagrRes = results.find((r) => r.id === 'cagr');
  const simpleAvgRes = results.find((r) => r.id === 'simpleAvg');
  const totalReturnRes = results.find((r) => r.id === 'totalReturn');
  const growthMultipleRes = results.find((r) => r.id === 'growthMultiple');

  if (!cagrRes || !simpleAvgRes) return null;

  const cagr = parseVal(cagrRes.value) / 100;
  const simpleAvg = parseVal(simpleAvgRes.value) / 100;
  const totalReturn = totalReturnRes ? parseVal(totalReturnRes.value) / 100 : 0;
  const growthMultiple = growthMultipleRes ? parseFloat(growthMultipleRes.value.replace('x', '')) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          CAGR vs. Simple Average
        </span>
      </div>

      <div className="p-6 space-y-5">
        <ComparisonBars
          cagr={cagr}
          simpleAvg={simpleAvg}
          totalReturn={totalReturn}
          growthMultiple={growthMultiple}
        />

        {growthMultiple > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Growth Multiple</p>
              <p className="text-lg font-black text-emerald-700">{growthMultiple.toFixed(2)}x</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Total Return</p>
              <p className="text-lg font-black text-blue-700">{(totalReturn * 100).toFixed(2)}%</p>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-xs font-bold text-slate-600 mb-1">Key Insight</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            The {((simpleAvg - cagr) * 100).toFixed(2)}% gap between simple average ({(simpleAvg * 100).toFixed(2)}%) and CAGR ({(cagr * 100).toFixed(2)}%) is volatility drag. The more volatile the returns, the larger this gap. CAGR is the honest measure of true investment growth.
          </p>
        </div>
      </div>
    </div>
  );
}
