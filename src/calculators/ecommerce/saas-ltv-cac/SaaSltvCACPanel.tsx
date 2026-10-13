import type { CalculatorResult } from '../../../types/calculator';
import MiniGauge from '../../../components/calculator/MiniGauge';
import { getResultValue as getValue } from '../../../utils/calcResults';
import { computeSaas } from './saasMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function ResultCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const textColor = color === 'positive' ? 'text-emerald-700' : color === 'negative' ? 'text-red-700' : 'text-slate-700';
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-600">{label}</div>
      <div className={`text-base font-bold ${textColor}`}>{value}</div>
    </div>
  );
}

export default function SaaSltvCACPanel({ values, results }: Props) {
  if (!results.length) return null;

  const rawMargin = values.grossMargin;
  const f = computeSaas(
    parseFloat(values.arpu),
    parseFloat(values.monthlyChurnRate),
    parseFloat(values.totalMarketingSpend),
    parseFloat(values.newCustomersAcquired),
    rawMargin !== undefined && rawMargin !== '' ? parseFloat(rawMargin) : 80,
  );
  if (!Number.isFinite(f.ltv) || !Number.isFinite(f.cac)) return null;

  const ratioFinite = Number.isFinite(f.ltvCacRatio);
  const paybackFinite = Number.isFinite(f.paybackMonths);
  const ratioStr = getValue(results, 'ltvCacRatio');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-100/50">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-800">SaaS Unit Economics</span>
      </div>

      <div className="p-5 space-y-4">
        {ratioFinite ? (
          <MiniGauge
            gauge={{
              value: f.ltvCacRatio,
              min: 0,
              max: 6,
              valueLabel: `LTV:CAC ${ratioStr}`,
              bands: [
                { to: 1, label: 'Below 1:1', color: '#b91c1c' },
                { to: 3, label: '1-3:1', color: '#b45309' },
                { to: 6, label: '3:1 and up', color: '#047857' },
              ],
              caption: 'LTV:CAC ratio against the commonly cited 3:1 target (scale ends at 6:1)',
            }}
          />
        ) : (
          <p className="text-sm text-slate-700">LTV:CAC is not defined because spend is zero (CAC is $0).</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ResultCard label="LTV" value={getValue(results, 'ltv')} color="positive" />
          <ResultCard label="CAC" value={getValue(results, 'cac')} color="negative" />
          <ResultCard label="Payback" value={getValue(results, 'paybackMonths')} />
          <ResultCard label="Lifetime" value={getValue(results, 'avgLifetimeMonths')} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ResultCard label="ARPU (Monthly)" value={getValue(results, 'arpu')} />
          <ResultCard label="Churn Rate" value={getValue(results, 'churnRate')} />
          <ResultCard label="New MRR per $1" value={getValue(results, 'newMrrPerSpend')} />
        </div>

        {paybackFinite && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">CAC Payback Timeline</p>
            <div
              className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative"
              role="img"
              aria-label={`CAC payback ${f.paybackMonths.toFixed(1)} months on a 0 to 24 month scale`}
            >
              <div
                className={`h-full rounded-full ${f.paybackMonths <= 12 ? 'bg-emerald-700' : f.paybackMonths <= 24 ? 'bg-amber-700' : 'bg-red-700'}`}
                style={{ width: `${Math.min(100, (f.paybackMonths / 24) * 100)}%` }}
              />
              <div className="absolute top-0 h-full w-0.5 bg-slate-700" style={{ left: '50%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
              <span>0 mo</span>
              <span>12 mo (common target)</span>
              <span>24+ mo</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
