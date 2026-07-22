import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function AgeCalculatorPanel({ results }: Props) {
  const exactAge = results.find(r => r.id === 'exactAge');
  const totalDays = results.find(r => r.id === 'totalDays');
  const totalWeeks = results.find(r => r.id === 'totalWeeks');
  const totalMonths = results.find(r => r.id === 'totalMonths');
  const nextBirthday = results.find(r => r.id === 'nextBirthday');

  if (!exactAge) return null;

  const parseNum = (s: string) => parseFloat(s.replace(/,/g, '')) || 0;
  const days = parseNum(totalDays?.value ?? '');
  const weeks = parseNum(totalWeeks?.value ?? '');
  const months = parseNum(totalMonths?.value ?? '');
  const maxVal = Math.max(days, weeks * 7, months * 30, 1);

  const bar = (label: string, val: number, color: string, max: number) => {
    const pct = max > 0 ? (val / max) * 100 : 0;
    return (
      <div className="flex items-center gap-2 py-1.5">
        <span className="text-[10px] font-semibold text-slate-500 w-24 flex-shrink-0">{label}</span>
        <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all`} style={{ width: `${Math.max(pct, 3)}%` }} />
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-600 w-20 text-right">{val.toLocaleString()}</span>
      </div>
    );
  };

  const ageMatch = exactAge.value.match(/([\d,]+)\s*years?,?\s*([\d,]+)\s*months?,?\s*([\d,]+)\s*days?/);
  const years = ageMatch ? parseNum(ageMatch[1]) : 0;
  const monthsV = ageMatch ? parseNum(ageMatch[2]) : 0;
  const daysV = ageMatch ? parseNum(ageMatch[3]) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Life Timeline</span>
      </div>
      <div className="p-5 space-y-3">
        {/* Age breakdown */}
        <div className="flex gap-3 justify-center">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3 text-center flex-1">
            <span className="text-2xl font-bold text-blue-600">{years}</span>
            <p className="text-[10px] font-semibold text-blue-400 uppercase">Years</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-center flex-1">
            <span className="text-2xl font-bold text-emerald-600">{monthsV}</span>
            <p className="text-[10px] font-semibold text-emerald-400 uppercase">Months</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-center flex-1">
            <span className="text-2xl font-bold text-amber-600">{daysV}</span>
            <p className="text-[10px] font-semibold text-amber-400 uppercase">Days</p>
          </div>
        </div>

        {/* Timeline bar */}
        {days > 0 && (
          <div className="pt-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Total Time Lived</p>
            {bar('Days', days, 'bg-blue-400', maxVal)}
            {weeks > 0 && bar('Weeks', weeks, 'bg-emerald-400', maxVal)}
            {months > 0 && bar('Months', months, 'bg-amber-400', maxVal)}
          </div>
        )}

        {nextBirthday && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Next Birthday In</p>
            <p className="text-lg font-bold text-indigo-700">{nextBirthday.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
