import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { computeBreakEven } from './breakEvenMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function BreakEvenPanel({ values, results }: Props) {
  const units = results.find((r) => r.id === 'breakEvenUnits');
  const revenue = results.find((r) => r.id === 'breakEvenRevenue');
  const cm = results.find((r) => r.id === 'contributionMargin');
  if (!units || !revenue) return null;

  const fixed = parseFloat(values.fixedCosts);
  const price = parseFloat(values.pricePerUnit);
  const vc = parseFloat(values.variableCostPerUnit);
  const be = computeBreakEven(fixed, price, vc);
  if (!be) return null;

  // Revenue and total-cost lines out to 2x break-even volume (at least 10 units so a tiny BE still draws).
  const xMax = Math.max(10, be.units * 2);
  const at = (x: number) => ({ x, rev: price * x, cost: fixed + vc * x });
  const pts = [at(0), at(be.units), at(xMax)];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Break-Even Analysis</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Break-Even</p>
          <p className="text-2xl font-bold text-emerald-800">{units.value}</p>
          <p className="text-xs text-emerald-700 mt-1">{revenue.value} in sales</p>
        </div>

        <SvgLineChart
          ariaLabel={`Revenue and total cost versus units sold; they cross at ${units.value}`}
          series={[
            { name: 'Revenue', color: '#047857', points: pts.map((p) => ({ x: p.x, y: p.rev })) },
            { name: 'Total cost', color: '#b45309', points: pts.map((p) => ({ x: p.x, y: p.cost })) },
          ]}
          dots={[{ x: be.units, y: price * be.units, label: `Break-even: ${money(price * be.units)}`, color: '#1e293b' }]}
          refLines={[{ y: fixed, label: 'Fixed costs', color: '#b91c1c', dashed: true }]}
          xFormat={(n) => `${Math.round(n)}`}
          yFormat={money}
        />
        <p className="text-[11px] text-slate-600">
          Left of the crossing point total cost exceeds revenue (a loss); to the right each extra unit adds {money(be.contributionMargin)} of profit.
        </p>

        {cm && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-600">{cm.label}</p>
            <p className="text-lg font-bold text-slate-700">{cm.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
