import { Clock } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function SalaryToHourlyPanel({ values, results }: Props) {
  const hourlyRes = results.find((r) => r.id === 'hourlyRate');
  const dailyRes = results.find((r) => r.id === 'dailyRate');
  const weeklyRes = results.find((r) => r.id === 'weeklyRate');
  const monthlyRes = results.find((r) => r.id === 'monthlyRate');

  if (!hourlyRes) return null;

  const salary = parseFloat(values.salary) || 0;
  const hoursPerWeek = parseFloat(values.hoursPerWeek) || 40;
  const weeksPerYear = parseFloat(values.weeksPerYear || '52') || 52;
  const hourly = parseVal(hourlyRes.value);
  const daily = dailyRes ? parseVal(dailyRes.value) : 0;
  const weekly = weeklyRes ? parseVal(weeklyRes.value) : 0;
  const monthly = monthlyRes ? parseVal(monthlyRes.value) : 0;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const freeLanceLow = hourly * 1.5;
  const freeLanceHigh = hourly * 2;

  const maxVal = Math.max(salary, 1);
  const bar = (v: number) => (v / maxVal) * 100;

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Annual Salary</p>
          <p className="text-2xl font-black text-blue-700">{fmt(salary)}</p>
          <p className="text-xs text-blue-500 mt-1">{hoursPerWeek} hrs/wk &middot; {weeksPerYear} wks/yr</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Monthly</p>
            <p className="text-base font-black text-slate-700">{fmt(monthly)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Weekly</p>
            <p className="text-base font-black text-slate-700">{fmt(weekly)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Daily</p>
            <p className="text-base font-black text-slate-700">{fmt(daily)}</p>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 border-2 border-amber-300 px-5 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Your Time is Worth</p>
          <p className="text-3xl font-black text-amber-700">{fmt(hourly)}<span className="text-lg">/hr</span></p>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold text-slate-600">Salary</span>
            <span className="font-semibold text-slate-700">{fmt(salary)}/yr</span>
          </div>
          <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="rounded-xl bg-purple-50 border border-purple-200 px-5 py-3">
          <p className="text-xs font-bold text-purple-700 mb-2">Freelance Rate Estimate</p>
          <p className="text-xs text-purple-600">
            To match this salary as a freelancer (factoring in self-employment tax, benefits, PTO):
          </p>
          <div className="flex gap-3 mt-2">
            <div className="flex-1 bg-white rounded-lg px-3 py-2 text-center border border-purple-100">
              <p className="text-[10px] text-purple-500">Minimum</p>
              <p className="text-base font-black text-purple-700">{fmt(freeLanceLow)}/hr</p>
            </div>
            <div className="flex-1 bg-white rounded-lg px-3 py-2 text-center border border-purple-100">
              <p className="text-[10px] text-purple-500">Recommended</p>
              <p className="text-base font-black text-purple-700">{fmt(freeLanceHigh)}/hr</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
