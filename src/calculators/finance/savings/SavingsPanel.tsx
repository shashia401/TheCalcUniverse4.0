import { useMemo } from 'react';
import { PiggyBank } from 'lucide-react';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { monthlyForGoal, savingsSchedule, wholeMonths, type SavingsPoint } from './savingsMath';

interface Props {
  solveFor: string;
  initialDeposit: number;
  monthlyContribution: number;
  goal: number;
  timePeriod: number;
  timeUnit: string;
  apy: number;
}

const fmtK = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtShort = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

/** Keep the chart light for very long horizons: at most ~120 points, always including the last month. */
function thin<T>(rows: T[], max = 120): T[] {
  const step = Math.max(1, Math.ceil(rows.length / max));
  return rows.filter((_, i) => i % step === 0 || i === rows.length - 1);
}

function MilestoneTable({ data }: { data: SavingsPoint[] }) {
  const rows = thin(data, 12);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Monthly savings breakdown table">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Month</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-700 uppercase tracking-wider text-[10px]">Deposited</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Interest</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={d.month} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">Mo {d.month}</td>
              <td className="px-3 py-2.5 text-right text-blue-700 font-semibold">{fmtK(d.deposited)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-800 font-semibold">{fmtK(Math.max(0, d.balance - d.deposited))}</td>
              <td className="px-4 py-2.5 text-right font-black text-slate-800">{fmtK(d.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SavingsPanel({ solveFor, initialDeposit, monthlyContribution, goal, timePeriod, timeUnit, apy }: Props) {
  const months = useMemo(() => wholeMonths(timePeriod, timeUnit), [timePeriod, timeUnit]);

  // Same pure maths as index.ts (savingsMath), including the APY -> monthly-rate conversion.
  const monthly = useMemo(
    () => (solveFor === 'balance' ? monthlyContribution : goal > 0 ? monthlyForGoal(initialDeposit, goal, apy, months) : 0),
    [solveFor, initialDeposit, monthlyContribution, goal, months, apy],
  );
  const data = useMemo(() => savingsSchedule(initialDeposit, monthly, apy, months), [initialDeposit, monthly, apy, months]);

  const final = data[data.length - 1];
  const interest = Math.max(0, final.balance - final.deposited);
  const showGoal = solveFor === 'goal' && goal > 0;
  const chartRows = thin(data);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <PiggyBank size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Savings Growth Trajectory</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Balance Growth Over Time</p>
          <SvgLineChart
            ariaLabel="Savings balance and total deposits by month"
            series={[
              { name: 'Total deposited', color: '#1d4ed8', points: chartRows.map((d) => ({ x: d.month, y: d.deposited })) },
              { name: 'Balance with interest', color: '#047857', points: chartRows.map((d) => ({ x: d.month, y: d.balance })) },
            ]}
            refLines={showGoal ? [{ y: goal, label: 'Goal', color: '#b45309' }] : []}
            xFormat={(n) => `Mo ${Math.round(n)}`}
            yFormat={fmtShort}
          />
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-600"><span className="w-3 h-1 rounded bg-blue-700" />Principal (your deposits)</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-600"><span className="w-3 h-1 rounded bg-emerald-700" />Balance with interest</span>
            {showGoal && <span className="flex items-center gap-1.5 text-[10px] text-slate-600"><span className="w-3 h-1 rounded bg-amber-700" />Goal</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-[10px] text-blue-800 font-semibold uppercase tracking-wider">Deposited</p>
            <p className="text-base font-black text-blue-800">{fmtShort(final.deposited)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
            <p className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">Interest</p>
            <p className="text-base font-black text-emerald-800">{fmtShort(interest)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Total</p>
            <p className="text-base font-black text-slate-700">{fmtShort(final.balance)}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Monthly Breakdown</p>
          <MilestoneTable data={data} />
        </div>
      </div>
    </div>
  );
}
