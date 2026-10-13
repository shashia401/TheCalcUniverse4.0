import { CalculatorResult } from '../../../types/calculator';
import { MAX_DAYS, schengenInfo } from './schengenMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function SchengenVisaPanel({ values, results }: Props) {
  const status = results.find((r) => r.id === 'ruleReminder');
  // Same pure function index.ts uses; the panel never parses result strings.
  const info = schengenInfo(values);
  if (!info || !results.length) return null;

  const { used, remaining, overstay } = info;
  const pct = Math.min((used / MAX_DAYS) * 100, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">90/180 Day Status</span>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">90-Day Limit</p>
          <div className="h-6 bg-slate-100 rounded-full overflow-hidden" role="img" aria-label={`${used} of ${MAX_DAYS} days used`}>
            <div
              className={`h-full rounded-full flex items-center justify-end pr-2 ${overstay ? 'bg-red-700' : used > 70 ? 'bg-amber-700' : 'bg-emerald-700'}`}
              style={{ width: `${pct}%`, minWidth: '4.5rem' }}
            >
              <span className="text-[10px] font-bold text-white">{used}/{MAX_DAYS} days</span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>0 days</span>
            <span>45 days</span>
            <span>90 days</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Days Used</p>
            <p className="text-2xl font-bold font-mono text-slate-800">{used}</p>
          </div>
          <div className={`rounded-lg border px-3 py-3 text-center ${overstay ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${overstay ? 'text-red-700' : 'text-blue-700'}`}>{overstay ? 'Days Over' : 'Remaining'}</p>
            <p className={`text-2xl font-bold font-mono ${overstay ? 'text-red-800' : 'text-blue-800'}`}>{overstay ? Math.abs(remaining) : remaining}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Longest stay now</p>
            <p className="text-2xl font-bold font-mono text-emerald-800">{info.maxStay}{info.maxStay >= MAX_DAYS ? '+' : ''}</p>
          </div>
        </div>

        {status && (
          <div className={`rounded-xl border px-4 py-3 ${overstay ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <p className={`text-xs font-semibold ${overstay ? 'text-red-800' : 'text-emerald-800'}`}>{status.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
