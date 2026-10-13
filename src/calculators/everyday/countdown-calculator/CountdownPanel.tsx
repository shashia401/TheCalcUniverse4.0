import { CalculatorResult } from '../../../types/calculator';
import MiniRing from '../../../components/calculator/MiniRing';
import { countdownInfo } from './countdownMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function CountdownPanel({ values, results }: Props) {
  const countdown = results.find((r) => r.id === 'countdown');
  // Same pure function index.ts uses; the panel never parses the formatted result strings.
  const c = countdownInfo(values);
  if (!countdown || !c) return null;
  const n = (x: number) => x.toLocaleString('en-US');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Countdown</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">{countdown.label}</p>
          <p className={`text-2xl font-bold ${c.isPast ? 'text-slate-600' : 'text-indigo-700'}`}>{countdown.value}</p>
          <p className="text-xs text-slate-600 mt-1">
            Breakdown: {c.years}y {c.months}m {c.weeks}w {c.days}d
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <BigNumber value={n(c.totalDays)} label="Days" />
          <BigNumber value={n(c.totalHours)} label="Hours" />
          <BigNumber value={n(c.totalMinutes)} label="Minutes" />
        </div>

        {!c.isPast && c.totalDays <= 365 && (
          <div className="flex items-center gap-4">
            <MiniRing value={365 - c.totalDays} total={365} color="#4338ca" size={72} label={`${c.totalDays} of the next 365 days remain`} />
            <p className="text-xs text-slate-600">
              {n(c.totalDays)} of the next 365 days remain. {n(c.totalWeeks)} weeks, {n(c.totalMonths)} months.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
            <p className="text-[10px] text-slate-600 uppercase font-semibold">Weeks</p>
            <p className="text-sm font-bold text-slate-700">{n(c.totalWeeks)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
            <p className="text-[10px] text-slate-600 uppercase font-semibold">Months</p>
            <p className="text-sm font-bold text-slate-700">{n(c.totalMonths)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigNumber({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-blue-50 px-3 py-3 text-center">
      <p className="text-xl font-bold text-indigo-700">{value}</p>
      <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold mt-0.5">{label}</p>
    </div>
  );
}
