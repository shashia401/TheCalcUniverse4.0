import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { solveMargin } from './marginMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const money = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MarginCalculatorPanel({ values, results }: Props) {
  const solved = results.find((r) => r.id === 'solvedValue');
  const marginR = results.find((r) => r.id === 'marginResult');
  const markupR = results.find((r) => r.id === 'markupResult');
  const sol = solveMargin(values);
  if (!solved || !sol) return null;

  const max = Math.max(sol.cost, sol.revenue, Math.abs(sol.profit), 0.01);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Margin vs Markup</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{solved.label}</p>
          <p className="text-2xl font-bold text-emerald-800">{solved.value}</p>
        </div>
        <HBarRow label="Cost" value={sol.cost} max={max} display={money(sol.cost)} color="bg-red-700" labelWidth="w-28" />
        <HBarRow
          label={sol.profit >= 0 ? 'Gross Profit' : 'Gross Loss'}
          value={Math.abs(sol.profit)}
          max={max}
          display={money(sol.profit)}
          color={sol.profit >= 0 ? 'bg-emerald-700' : 'bg-red-800'}
          labelWidth="w-28"
        />
        <HBarRow label="Revenue" value={sol.revenue} max={max} display={money(sol.revenue)} color="bg-blue-700" labelWidth="w-28" />
        {marginR && markupR && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-[10px] font-bold text-blue-700 uppercase">Margin</p>
              <p className="text-lg font-bold text-blue-800">{marginR.value}</p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold text-purple-700 uppercase">Markup</p>
              <p className="text-lg font-bold text-purple-800">{markupR.value}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
