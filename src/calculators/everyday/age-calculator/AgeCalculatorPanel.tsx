import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { computeAge } from './ageMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function AgeCalculatorPanel({ values, results }: Props) {
  // Re-derive from the inputs with the same pure function index.ts uses, never by parsing result strings.
  const a = computeAge(values);
  if (!a || !results.length) return null;

  const nextBirthday = results.find((r) => r.id === 'nextBirthday');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Life Timeline</span>
      </div>
      <div className="p-5 space-y-3">
        {/* Age breakdown */}
        <div className="flex gap-3 justify-center">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3 text-center flex-1">
            <span className="text-2xl font-bold text-blue-700">{a.years}</span>
            <p className="text-[10px] font-semibold text-blue-700 uppercase">Years</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-center flex-1">
            <span className="text-2xl font-bold text-emerald-700">{a.months}</span>
            <p className="text-[10px] font-semibold text-emerald-700 uppercase">Months</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-center flex-1">
            <span className="text-2xl font-bold text-amber-700">{a.days}</span>
            <p className="text-[10px] font-semibold text-amber-700 uppercase">Days</p>
          </div>
        </div>

        {/* Progress through the current age-year */}
        <div className="pt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Progress to next birthday</p>
          <HBarRow
            label={`${a.daysSinceBirthday} of ${a.birthdayYearLength} days`}
            value={a.daysSinceBirthday}
            max={a.birthdayYearLength}
            display={`${Math.round((a.daysSinceBirthday / a.birthdayYearLength) * 100)}%`}
            color="bg-blue-700"
            labelWidth="w-32"
          />
        </div>

        {nextBirthday && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Next Birthday In</p>
            <p className="text-lg font-bold text-indigo-700">{nextBirthday.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
