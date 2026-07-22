import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function TireSizePanel({ results }: Props) {
  const diamDiff = results.find(r => r.id === 'diamDiff');
  const speedErr = results.find(r => r.id === 'speedError');
  const origDiam = results.find(r => r.id === 'origDiam');
  const newDiam = results.find(r => r.id === 'newDiam');

  if (!diamDiff || !origDiam || !newDiam) return null;

  const origVal = parseNum(origDiam.value);
  const newVal = parseNum(newDiam.value);
  const diffVal = parseNum(diamDiff.value);
  const maxDiam = Math.max(origVal, newVal);

  const isSafe = Math.abs(diffVal) <= 3;
  const diffColor = isSafe ? 'text-emerald-600' : Math.abs(diffVal) <= 5 ? 'text-amber-600' : 'text-red-600';
  const diffBg = isSafe ? 'bg-emerald-50 border-emerald-200' : Math.abs(diffVal) <= 5 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  const tireSVG = (diam: number, label: string, color: string, left: number) => {
    const r = Math.round(diam * 10);
    return (
      <svg viewBox={`0 0 ${r * 2 + 20} ${r * 2 + 40}`} className="w-full" style={{ maxWidth: 140 }}>
        <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke={color} strokeWidth="3" />
        <circle cx={r + 10} cy={r + 10} r={r * 0.3} fill="none" stroke={color} strokeWidth="2" />
        <text x={r + 10} y={r * 2 + 25} textAnchor="middle" fontSize="10" fill="#64748b">{label}</text>
      </svg>
    );
  };

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
          {tireSVG(origVal, `Original ${origVal.toFixed(1)}"`, '#3b82f6', 0)}
          {tireSVG(newVal, `New ${newVal.toFixed(1)}"`, '#8b5cf6', 1)}
        </div>
        <div className={`rounded-xl border px-4 py-3 ${diffBg}`}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">Diameter Difference</span>
            <span className={`text-sm font-bold ${diffColor}`}>{diamDiff.value}</span>
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
