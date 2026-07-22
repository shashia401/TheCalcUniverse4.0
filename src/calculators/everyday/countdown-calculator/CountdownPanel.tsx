import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.-]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function CountdownPanel({ results }: Props) {
  const countdown = results.find(r => r.id === 'countdown');
  const totalDays = results.find(r => r.id === 'totalDays');
  const totalWeeks = results.find(r => r.id === 'totalWeeks');
  const totalMonths = results.find(r => r.id === 'totalMonths');
  const totalHours = results.find(r => r.id === 'totalHours');
  const totalMinutes = results.find(r => r.id === 'totalMinutes');
  const breakdown = results.find(r => r.id === 'breakdown');

  if (!countdown || !totalDays) return null;

  const days = parseNum(totalDays.value);
  const isPast = countdown.value.includes('ago');

  // For the progress ring: assume 365 days = 100% if within a year
  // or use the total months as a proxy
  const months = totalMonths ? parseNum(totalMonths.value) : 0;
  const displayMax = months > 0 ? Math.max(months, 1) : 12;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Countdown</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Main countdown display */}
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">{countdown.label}</p>
          <p className={`text-2xl font-bold ${isPast ? 'text-slate-500' : 'text-indigo-600'}`}>
            {countdown.value}
          </p>
          {breakdown && (
            <p className="text-xs text-slate-400 mt-1">
              Breakdown: {breakdown.value}
            </p>
          )}
        </div>

        {/* Big number tiles */}
        <div className="grid grid-cols-3 gap-2">
          <BigNumber value={totalDays?.value ?? '0'} label="Days" />
          <BigNumber value={totalHours?.value ?? '0'} label="Hours" />
          <BigNumber value={totalMinutes?.value ?? '0'} label="Minutes" />
        </div>

        {/* Progress bar for time elapsed */}
        {!isPast && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                Progress
              </span>
              <span className="text-[10px] text-slate-400">
                {totalWeeks?.value ?? '0'} weeks
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-400 transition-all"
                style={{ width: `${months > 0 ? Math.min((days / (months * 30.44)) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Weeks</p>
            <p className="text-sm font-bold text-slate-700">{totalWeeks?.value ?? '-'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Months</p>
            <p className="text-sm font-bold text-slate-700">{totalMonths?.value ?? '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigNumber({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-blue-50 px-3 py-3 text-center">
      <p className="text-xl font-bold text-indigo-600">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mt-0.5">{label}</p>
    </div>
  );
}
