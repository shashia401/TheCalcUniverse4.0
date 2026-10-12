import { CalculatorResult } from '../../../types/calculator';
import { compareTires } from './tireMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function TireCircle({ diameterIn, label, color }: { diameterIn: number; label: string; color: string }) {
  const r = Math.round(diameterIn * 10);
  return (
    <svg viewBox={`0 0 ${r * 2 + 20} ${r * 2 + 40}`} className="w-full" style={{ maxWidth: 140 }} role="img" aria-label={`${label}: overall tire diameter ${diameterIn.toFixed(1)} inches`}>
      <title>{`${label}: ${diameterIn.toFixed(1)} inches`}</title>
      <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke={color} strokeWidth="3" />
      <circle cx={r + 10} cy={r + 10} r={r * 0.3} fill="none" stroke={color} strokeWidth="2" />
      <text x={r + 10} y={r * 2 + 25} textAnchor="middle" fontSize="10" fill="#475569">{label}</text>
    </svg>
  );
}

export default function TireSizePanel({ values, results }: Props) {
  const t = compareTires(values);
  if (!t || !results.length) return null;

  const origIn = t.origDiamMm / 25.4;
  const newIn = t.newDiamMm / 25.4;
  const diff = parseFloat(t.diamDiffPct.toFixed(2));
  const isSafe = Math.abs(diff) <= 3;
  const mid = Math.abs(diff) <= 5;
  const diffColor = isSafe ? 'text-emerald-800' : mid ? 'text-amber-800' : 'text-red-800';
  const diffBg = isSafe ? 'bg-emerald-50 border-emerald-200' : mid ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  const speedErr = results.find((r) => r.id === 'speedError');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Tire Size Comparison</span>
      </div>
      <div className="p-5">
        <div className="flex justify-center items-end gap-4 mb-4">
          <TireCircle diameterIn={origIn} label={`Original ${origIn.toFixed(1)}"`} color="#1d4ed8" />
          <TireCircle diameterIn={newIn} label={`New ${newIn.toFixed(1)}"`} color="#6d28d9" />
        </div>
        <div className={`rounded-xl border px-4 py-3 ${diffBg}`}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">Diameter Difference</span>
            <span className={`text-sm font-bold ${diffColor}`}>{diff > 0 ? '+' : ''}{diff}%</span>
          </div>
          {speedErr && (
            <div className="flex justify-between items-center border-t border-inherit mt-2 pt-2">
              <span className="text-xs text-slate-600">Speedometer Error</span>
              <span className="text-sm font-bold text-slate-700">{speedErr.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
