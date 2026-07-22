import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function WireGaugePanel({ results }: Props) {
  const rec = results.find(r => r.id === 'recommended');
  const designCurrent = results.find(r => r.id === 'designCurrent');
  const derating = results.find(r => r.id === 'derating');

  if (!rec) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Wire Gauge</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Recommended Wire</p>
          <p className="text-2xl font-bold text-amber-700">{rec.value}</p>
        </div>

        {designCurrent && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Design Current</span>
            <span className="text-sm font-bold text-slate-700">{designCurrent.value}</span>
          </div>
        )}
        {derating && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Derating Factor</span>
            <span className="text-sm font-bold text-slate-700">{derating.value}</span>
          </div>
        )}

        {/* Wire gauge visual */}
        <svg viewBox="0 0 280 80" className="w-full" style={{ maxHeight: 60 }}>
          <rect x="20" y="20" width="24" height="40" rx="2" fill="#3b82f6" opacity="0.6" />
          <text x="32" y="75" textAnchor="middle" fontSize="8" fill="#64748b">14</text>
          <rect x="60" y="16" width="30" height="48" rx="2" fill="#3b82f6" opacity="0.7" />
          <text x="75" y="75" textAnchor="middle" fontSize="8" fill="#64748b">12</text>
          <rect x="106" y="12" width="36" height="56" rx="2" fill="#3b82f6" opacity="0.8" />
          <text x="124" y="75" textAnchor="middle" fontSize="8" fill="#64748b">10</text>
          <rect x="158" y="8" width="42" height="64" rx="2" fill="#f59e0b" opacity="0.8" />
          <text x="179" y="75" textAnchor="middle" fontSize="8" fill="#64748b">8</text>
          <rect x="216" y="4" width="48" height="72" rx="2" fill="#ef4444" opacity="0.8" />
          <text x="240" y="75" textAnchor="middle" fontSize="8" fill="#64748b">6</text>
        </svg>
      </div>
    </div>
  );
}
