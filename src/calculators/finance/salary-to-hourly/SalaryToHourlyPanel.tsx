import { Clock } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { payRates } from '../salary-hourly/salaryHourlyMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SalaryToHourlyPanel({ values, results }: Props) {
  const salary = parseFloat(values.salary);
  const hoursPerWeek = parseFloat(values.hoursPerWeek);
  const weeksPerYear = parseFloat(values.weeksPerYear || '52');
  if (!results.length || !(salary > 0) || !(hoursPerWeek > 0) || !(weeksPerYear > 0)) return null;

  // Same pure conversion as index.ts, so the panel never parses formatted result strings.
  const { hourly, daily, weekly, monthly } = payRates(salary, hoursPerWeek, weeksPerYear);
  const freeLanceLow = hourly * 1.5;
  const freeLanceHigh = hourly * 2;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Clock size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Rate Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="rounded-xl bg-blue-50 border-2 border-blue-300 px-5 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Annual Salary</p>
          <p className="text-2xl font-black text-blue-700">{fmt(salary)}</p>
          <p className="text-xs text-blue-700 mt-1">{hoursPerWeek} hrs/wk &middot; {weeksPerYear} wks/yr</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ['Monthly', monthly],
              ['Weekly', weekly],
              ['Daily', daily],
            ] as const
          ).map(([label, v]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">{label}</p>
              <p className="text-base font-black text-slate-700">{fmt(v)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-amber-50 border-2 border-amber-300 px-5 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">Your Time is Worth</p>
          <p className="text-3xl font-black text-amber-800">{fmt(hourly)}<span className="text-lg">/hr</span></p>
        </div>

        <div className="rounded-xl bg-purple-50 border border-purple-200 px-5 py-3">
          <p className="text-xs font-bold text-purple-800 mb-2">Freelance Rate Estimate</p>
          <p className="text-xs text-purple-800">
            Rule of thumb for matching this salary as a freelancer (1.5–2× to cover self-employment tax, benefits and unpaid time):
          </p>
          <div className="flex gap-3 mt-2">
            <div className="flex-1 bg-white rounded-lg px-3 py-2 text-center border border-purple-100">
              <p className="text-[10px] text-purple-800">Minimum (1.5×)</p>
              <p className="text-base font-black text-purple-800">{fmt(freeLanceLow)}/hr</p>
            </div>
            <div className="flex-1 bg-white rounded-lg px-3 py-2 text-center border border-purple-100">
              <p className="text-[10px] text-purple-800">Recommended (2×)</p>
              <p className="text-base font-black text-purple-800">{fmt(freeLanceHigh)}/hr</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
