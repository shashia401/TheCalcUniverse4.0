import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function PHPanel({ results }: Props) {
  const ph = results.find(r => r.id === 'ph');
  const poh = results.find(r => r.id === 'poh');
  const hConc = results.find(r => r.id === 'hConcentration');
  const ohConc = results.find(r => r.id === 'ohConcentration');
  const classification = results.find(r => r.id === 'classification');

  if (!ph) return null;

  const phVal = parseNum(ph.value);

  // pH scale colors
  const getPHColor = (v: number): string => {
    if (v < 3) return '#dc2626';
    if (v < 5) return '#f97316';
    if (v < 6.5) return '#eab308';
    if (v < 7.5) return '#22c55e';
    if (v < 9) return '#14b8a6';
    if (v < 11) return '#3b82f6';
    return '#6366f1';
  };

  const phPct = Math.min((phVal / 14) * 100, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">pH Scale</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">pH Value</p>
          <p className="text-3xl font-bold" style={{ color: getPHColor(phVal) }}>{ph.value}</p>
          {classification && (
            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold border`}
              style={{
                backgroundColor: `${getPHColor(phVal)}15`,
                color: getPHColor(phVal),
                borderColor: `${getPHColor(phVal)}30`
              }}>
              {classification.value}
            </span>
          )}
        </div>

        {/* pH Scale visualization */}
        <svg viewBox="0 0 300 40" className="w-full">
          <defs>
            <linearGradient id="phGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="21%" stopColor="#f97316" />
              <stop offset="36%" stopColor="#eab308" />
              <stop offset="46%" stopColor="#84cc16" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="54%" stopColor="#14b8a6" />
              <stop offset="71%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <rect x="10" y="8" width="280" height="10" rx="5" fill="url(#phGrad)" />
          <line x1="10" y1="22" x2="10" y2="28" stroke="#94a3b8" strokeWidth="1" />
          <text x="10" y="34" textAnchor="middle" fontSize="7" fill="#94a3b8">0</text>
          <line x1="110" y1="22" x2="110" y2="26" stroke="#94a3b8" strokeWidth="1" />
          <text x="110" y="34" textAnchor="middle" fontSize="7" fill="#94a3b8">3 Acidic</text>
          <line x1="150" y1="22" x2="150" y2="28" stroke="#22c55e" strokeWidth="1.5" />
          <text x="150" y="34" textAnchor="middle" fontSize="7" fill="#22c55e">7 Neutral</text>
          <line x1="250" y1="22" x2="250" y2="26" stroke="#94a3b8" strokeWidth="1" />
          <text x="250" y="34" textAnchor="middle" fontSize="7" fill="#94a3b8">11 Basic</text>
          <line x1="290" y1="22" x2="290" y2="28" stroke="#94a3b8" strokeWidth="1" />
          <text x="290" y="34" textAnchor="middle" fontSize="7" fill="#94a3b8">14</text>
          {/* Indicator triangle */}
          <polygon points={`${10 + phPct * 2.8},6 ${10 + phPct * 2.8 - 4},1 ${10 + phPct * 2.8 + 4},1`}
            fill={getPHColor(phVal)} />
        </svg>

        {poh && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">pOH</span>
            <span className="text-sm font-bold text-slate-700">{poh.value}</span>
          </div>
        )}
        {hConc && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">[H&sup3;O&sup2;] or [H&#8314;]</span>
            <span className="text-sm font-bold text-slate-700">{hConc.value}</span>
          </div>
        )}
        {ohConc && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">[OH&#8315;]</span>
            <span className="text-sm font-bold text-slate-700">{ohConc.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
