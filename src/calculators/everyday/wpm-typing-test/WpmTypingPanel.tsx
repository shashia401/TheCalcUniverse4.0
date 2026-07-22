import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function WpmTypingPanel({ results }: Props) {
  const grossRow = results.find(r => r.id === 'grossWpm');
  const netRow = results.find(r => r.id === 'netWpm');
  const accuracyRow = results.find(r => r.id === 'accuracy');
  const errorRow = results.find(r => r.id === 'errorCount');

  if (!grossRow || !netRow) return null;

  const gross = parseFloat(grossRow.value) || 0;
  const net = parseFloat(netRow.value) || 0;
  const accuracy = parseFloat(accuracyRow?.value || '0') || 0;
  const errors = parseInt(errorRow?.value || '0');

  // Speed scale: 0-120 WPM mapped to 0-100%
  const speedPct = Math.min((gross / 120) * 100, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Speed &amp; Accuracy</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Speed gauge */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Typing Speed</p>
          <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 rounded-full" style={{ width: '100%' }} />
            <div
              className="absolute top-0 h-full w-0.5 bg-slate-900 transition-all"
              style={{ left: `${Math.min(speedPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>0</span>
            <span>40</span>
            <span>80</span>
            <span>120+ WPM</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center">
            <p className="text-[9px] font-bold text-blue-500 uppercase">Gross WPM</p>
            <p className="text-2xl font-bold font-mono text-blue-700">{gross.toFixed(1)}</p>
            <p className="text-[10px] text-blue-400">Raw speed</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center">
            <p className="text-[9px] font-bold text-emerald-500 uppercase">Net WPM</p>
            <p className="text-2xl font-bold font-mono text-emerald-700">{net.toFixed(1)}</p>
            <p className="text-[10px] text-emerald-400">Adjusted</p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Accuracy</p>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${accuracy >= 90 ? 'bg-emerald-500' : accuracy >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-slate-700">{accuracy.toFixed(1)}%</span>
        </div>

        {errorRow && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-red-500 uppercase">Errors</p>
            <p className="text-lg font-bold font-mono text-red-700">{errors.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
