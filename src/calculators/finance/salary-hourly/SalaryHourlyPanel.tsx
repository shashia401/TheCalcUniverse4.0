import { CalculatorResult } from '../../../types/calculator';
import { payRates, trueHourly as computeTrueHourly, WORK_DAYS_PER_WEEK } from './salaryHourlyMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (s: string | undefined) => parseFloat(s ?? '') || 0;

export default function SalaryHourlyPanel({ values, results }: Props) {
  const salary = num(values.annualSalary);
  const hoursPerWeek = num(values.hoursPerWeek);
  if (!results.length || !(salary > 0) || !(hoursPerWeek > 0)) return null;

  // Same pure functions as index.ts: the panel never parses the formatted result strings.
  const rates = payRates(salary, hoursPerWeek);
  const showTrue = values.trueHourlyToggle === 'yes';
  const commuteHoursPerDay = num(values.commuteHoursPerDay);
  const overtime = num(values.unpaidOvertimeHours);
  const t = showTrue
    ? computeTrueHourly({
        salary,
        hoursPerWeek,
        commuteHoursPerDay,
        commuteCostPerDay: num(values.commuteCostPerDay),
        unpaidOvertimeHours: overtime,
        ptoDays: num(values.paidTimeOff),
      })
    : null;
  const trueOk = t !== null && Number.isFinite(t.trueHourly);

  const commuteHoursWeek = commuteHoursPerDay * WORK_DAYS_PER_WEEK;
  const weekTotal = hoursPerWeek + commuteHoursWeek + overtime;
  const slices = [
    { label: 'Work', hours: hoursPerWeek, bar: 'bg-blue-700', dot: 'bg-blue-700' },
    { label: 'Commute', hours: commuteHoursWeek, bar: 'bg-amber-800', dot: 'bg-amber-800' },
    { label: 'Unpaid Overtime', hours: overtime, bar: 'bg-red-700', dot: 'bg-red-700' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-blue-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Standard Calculation</p>
          </div>
          <div className="p-5">
            <p className="text-3xl font-black text-blue-700">{usd(rates.hourly)}</p>
            <p className="text-xs font-medium text-slate-600 mt-1">per hour</p>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between"><span>Annual Salary</span><span className="font-bold">{usd(salary)}</span></div>
              <div className="flex justify-between"><span>Hours/Week</span><span className="font-bold">{hoursPerWeek}h</span></div>
              <div className="flex justify-between"><span>Weeks/Year</span><span className="font-bold">52</span></div>
              <div className="border-t border-slate-100 pt-2 flex justify-between">
                <span>Formula</span>
                <span className="font-mono text-[10px] text-slate-600">Salary ÷ (hrs × 52)</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border shadow-md overflow-hidden ${showTrue ? 'bg-white border-orange-200 shadow-orange-200/60' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`px-5 py-4 border-b ${showTrue ? 'bg-orange-50 border-orange-100' : 'bg-slate-100 border-slate-200'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${showTrue ? 'text-orange-800' : 'text-slate-600'}`}>
              True Hourly Rate {!showTrue && '(Toggle On)'}
            </p>
          </div>
          <div className="p-5">
            {showTrue && t && trueOk ? (
              <>
                <p className="text-3xl font-black text-orange-800">{usd(t.trueHourly)}</p>
                <p className="text-xs font-medium text-slate-600 mt-1">after commute &amp; overtime</p>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between"><span>Effective Hrs/Week</span><span className="font-bold">{t.effectiveHoursPerWeek.toFixed(1)} hrs</span></div>
                  <div className="flex justify-between"><span>Effective Annual Hrs</span><span className="font-bold">{t.effectiveAnnualHours.toFixed(0)} hrs</span></div>
                  <div className="flex justify-between"><span>Annual Commute Cost</span><span className="font-bold text-red-700">{usd(t.commuteCostsAnnual)}</span></div>
                </div>
                <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 p-3">
                  <p className="text-xs font-bold text-orange-800 text-center">
                    Your {usd(salary)} salary is actually {usd(t.trueHourly)}/hr after commute &amp; overtime
                  </p>
                </div>
              </>
            ) : showTrue ? (
              <p className="text-xs text-slate-600 py-6 text-center">Paid time off leaves no working weeks — lower it to see a true hourly rate.</p>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <svg width="32" aria-hidden="true" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                <p className="text-xs text-slate-600 mt-3 text-center">
                  Enable &quot;True Hourly Rate&quot; to see the real impact of commute time, costs, and unpaid overtime
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTrue && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Where Your Week Goes</span>
          </div>
          <div className="p-6">
            <div
              className="flex h-8 rounded-lg overflow-hidden gap-0.5 mb-4"
              role="img"
              aria-label={`Weekly hours: ${hoursPerWeek} work, ${commuteHoursWeek} commute, ${overtime} unpaid overtime`}
            >
              {slices.filter((s) => s.hours > 0).map((s) => (
                <div key={s.label} className={`h-full ${s.bar}`} style={{ width: `${(s.hours / weekTotal) * 100}%` }} title={`${s.label}: ${s.hours} h`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {slices.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${s.dot}`} />
                    <span className="font-bold text-slate-700">{s.label}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{s.hours}h / week</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Pay Period Summary</span>
        </div>
        <div className="p-6 grid grid-cols-3 gap-4">
          {(
            [
              ['Weekly', rates.weekly],
              ['Biweekly', rates.biweekly],
              ['Monthly', rates.monthly],
            ] as const
          ).map(([label, v]) => (
            <div key={label} className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
              <p className="text-lg font-black text-slate-700 mt-1">{usd(v)}</p>
            </div>
          ))}
        </div>
      </div>

      {t && trueOk && (
        <div className="rounded-2xl border border-red-200 bg-red-50 shadow-md shadow-red-200/60 overflow-hidden">
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">Commute Costs You</p>
            <p className="text-2xl font-black text-red-700 mt-1">{usd(t.commuteCostsAnnual)}</p>
            <p className="text-[10px] text-red-700 mt-0.5">per year in unreimbursed commute expenses</p>
            <div className="mt-2 text-xs text-red-800 bg-red-100 rounded-lg p-3">
              That is <strong>{((t.commuteCostsAnnual / salary) * 100).toFixed(1)}%</strong> of your gross salary spent just getting to and from work
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
