import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function SalaryHourlyPanel({ values, results }: Props) {
  const standardHourly = results.find((r) => r.id === 'standardHourly')?.value ?? '';
  const trueHourly = results.find((r) => r.id === 'trueHourly')?.value ?? '';
  const weeklyPay = results.find((r) => r.id === 'weeklyPay')?.value ?? '';
  const monthlyPay = results.find((r) => r.id === 'monthlyPay')?.value ?? '';
  const biweeklyPay = results.find((r) => r.id === 'biweeklyPay')?.value ?? '';
  const effectiveHoursPerWeek = results.find((r) => r.id === 'effectiveHoursPerWeek')?.value ?? '';
  const effectiveAnnualHours = results.find((r) => r.id === 'effectiveAnnualHours')?.value ?? '';
  const commuteCostsAnnual = results.find((r) => r.id === 'commuteCostsAnnual')?.value ?? '';
  const salary = results.find((r) => r.id === 'salary')?.value ?? '';
  const hoursPerWeek = results.find((r) => r.id === 'hoursPerWeek')?.value ?? '40';

  const showTrue = values.trueHourlyToggle === 'yes';
  const standardNum = parseFloat(standardHourly.replace(/[^0-9.]/g, ''));
  const trueNum = showTrue ? parseFloat(trueHourly.replace(/[^0-9.]/g, '')) : 0;
  const salaryNum = parseFloat(salary.replace(/[^0-9.]/g, ''));

  return (
    <div className="space-y-5">
      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Standard Hourly Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-blue-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Standard Calculation</p>
          </div>
          <div className="p-5">
            <p className="text-3xl font-black text-blue-600">{standardHourly}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">per hour</p>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Annual Salary</span>
                <span className="font-bold">{salary}</span>
              </div>
              <div className="flex justify-between">
                <span>Hours/Week</span>
                <span className="font-bold">{hoursPerWeek}h</span>
              </div>
              <div className="flex justify-between">
                <span>Weeks/Year</span>
                <span className="font-bold">52</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between">
                <span>Formula</span>
                <span className="font-mono text-[10px] text-slate-500">Salary ÷ (hrs × 52)</span>
              </div>
            </div>
          </div>
        </div>

        {/* True Hourly Card */}
        <div className={`rounded-2xl border shadow-md overflow-hidden ${showTrue ? 'bg-white border-orange-200 shadow-orange-200/60' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
          <div className={`px-5 py-4 border-b ${showTrue ? 'bg-orange-50 border-orange-100' : 'bg-slate-100 border-slate-200'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${showTrue ? 'text-orange-600' : 'text-slate-500'}`}>
              True Hourly Rate {!showTrue && '(Toggle On)'}
            </p>
          </div>
          <div className="p-5">
            {showTrue ? (
              <>
                <p className="text-3xl font-black text-orange-600">{trueHourly}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">after commute & overtime</p>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Effective Hrs/Week</span>
                    <span className="font-bold">{effectiveHoursPerWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective Annual Hrs</span>
                    <span className="font-bold">{effectiveAnnualHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Commute Cost</span>
                    <span className="font-bold text-red-500">{commuteCostsAnnual}</span>
                  </div>
                </div>
                {/* Shock value comparison */}
                {salaryNum > 0 && standardNum > 0 && trueNum > 0 && (
                  <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 p-3">
                    <p className="text-xs font-bold text-orange-700 text-center">
                      Your {salary} salary is actually{' '}
                      <span className="text-orange-600 underline underline-offset-2 decoration-orange-300">
                        {trueHourly}
                      </span>{' '}
                      after commute & overtime
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <svg width="32" aria-hidden="true" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Enable "True Hourly Rate" to see the real impact of commute time, costs, and unpaid overtime
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Breakdown Gauge */}
      {showTrue && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
            <svg width="16" aria-hidden="true" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Where Your Time Goes</span>
          </div>
          <div className="p-6">
            {/* Gauge SVG */}
            <svg width="100%" height="80" viewBox="0 0 300 80" className="mb-4" role="img" aria-label="Daily time breakdown gauge chart">
              {/* Working hours */}
              <rect x="0" y="20" width="120" height="40" rx="6" fill="#3b82f6" opacity="0.8" />
              <text x="60" y="44" textAnchor="middle" className="fill-white" fontSize="11" fontWeight="bold">Working</text>
              {/* Commute */}
              <rect x="125" y="20" width="45" height="40" rx="6" fill="#f59e0b" opacity="0.8" />
              <text x="147" y="44" textAnchor="middle" className="fill-white" fontSize="9" fontWeight="bold">Commute</text>
              {/* Overtime */}
              <rect x="175" y="20" width="55" height="40" rx="6" fill="#ef4444" opacity="0.8" />
              <text x="202" y="44" textAnchor="middle" className="fill-white" fontSize="9" fontWeight="bold">Overtime</text>
              {/* Remaining */}
              <rect x="235" y="20" width="60" height="40" rx="6" fill="#e2e8f0" opacity="0.5" />
              <text x="265" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">Rest</text>
            </svg>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-blue-500" />
                  <span className="font-bold text-slate-700">Work</span>
                </div>
                <p className="text-slate-500 mt-0.5">{hoursPerWeek}h / week</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-amber-500" />
                  <span className="font-bold text-slate-700">Commute</span>
                </div>
                <p className="text-slate-500 mt-0.5">{values.commuteHoursPerDay || '0'}h × 5 days</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500" />
                  <span className="font-bold text-slate-700">Unpaid Overtime</span>
                </div>
                <p className="text-slate-500 mt-0.5">{values.unpaidOvertimeHours || '0'}h / week</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Period Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg width="16" aria-hidden="true" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 10h20" />
            <path d="M8 2v4" />
            <path d="M16 2v4" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Pay Period Summary</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Weekly</p>
              <p className="text-lg font-black text-slate-700 mt-1">{weeklyPay}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Biweekly</p>
              <p className="text-lg font-black text-slate-700 mt-1">{biweeklyPay}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Monthly</p>
              <p className="text-lg font-black text-slate-700 mt-1">{monthlyPay}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commute Cost Visualization */}
      {showTrue && (
        <div className="rounded-2xl border border-red-200 bg-red-50 shadow-md shadow-red-200/60 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg width="20" aria-hidden="true" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-600">Commute Costs You</p>
                <p className="text-2xl font-black text-red-600 mt-1">{commuteCostsAnnual}</p>
                <p className="text-[10px] text-red-400 mt-0.5">
                  per year in unreimbursed commute expenses
                </p>
                <div className="mt-2 text-xs text-red-700 bg-red-100 rounded-lg p-3">
                  That is{' '}
                  <strong>
                    {salaryNum > 0
                      ? `${((parseFloat(commuteCostsAnnual.replace(/[^0-9.]/g, '')) / salaryNum) * 100).toFixed(1)}%`
                      : ''}
                  </strong>{' '}
                  of your gross salary spent just getting to and from work
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
