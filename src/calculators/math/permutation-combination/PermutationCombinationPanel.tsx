import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function permutation(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / factorial(n - r);
}

function combination(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6'];

export default function PermutationCombinationPanel({ values, results }: Props) {
  const resultRow = results.find((r) => r.id === 'result');
  const typeRow = results.find((r) => r.id === 'type');
  const formulaRow = results.find((r) => r.id === 'formula');
  const appliedRow = results.find((r) => r.id === 'formulaApplied');
  const nFact = results.find((r) => r.id === 'nFactorial');
  const rFact = results.find((r) => r.id === 'rFactorial');
  const nMinusR = results.find((r) => r.id === 'nMinusRFactorial');

  if (!resultRow || !typeRow || !formulaRow) return null;

  const n = parseInt(values.n, 10);
  const r = parseInt(values.r, 10);
  const isPerm = typeRow.value === 'Permutation';

  // Generate bar chart data for all r values 0..n
  const chartData = useMemo(() => {
    if (isNaN(n) || n < 0 || n > 20) return []; // Limit to 20 for readability

    const data: { r: number; nPr: number; nCr: number }[] = [];
    for (let i = 0; i <= Math.min(n, 20); i++) {
      const nPr = permutation(n, i);
      const nCr = combination(n, i);
      data.push({
        r: i,
        nPr: nPr > 1e15 ? parseFloat(nPr.toExponential(2)) : nPr,
        nCr: nCr > 1e15 ? parseFloat(nCr.toExponential(2)) : nCr,
      });
    }
    return data;
  }, [n]);

  // Highlight the selected r value
  const activeKey = `nPr${r}`;
  const highlightIndex = r >= 0 && r <= Math.min(n, 20) ? r : -1;

  const fmtTooltip = (val: number) => {
    if (val > 1e15) return Number(val).toExponential(4);
    return Number(val).toLocaleString();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Formula &amp; Step-by-Step
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Type badge */}
        <div className={`rounded-xl border p-4 text-center ${isPerm ? 'border-blue-200 bg-blue-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Type</p>
          <p className={`text-lg font-bold ${isPerm ? 'text-blue-700' : 'text-emerald-700'}`}>
            {isPerm ? 'Permutation — Order Matters' : 'Combination — Order Does Not Matter'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isPerm
              ? 'Each different ordering counts as a unique arrangement.'
              : 'Different orderings of the same selection count as the same.'}
          </p>
        </div>

        {/* Bar Chart: nPr and nCr comparison */}
        {chartData.length > 2 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              {isPerm ? 'Permutations' : 'Combinations'} for n = {n}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="r" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} label={{ value: 'r (items chosen)', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [fmtTooltip(_ as number), isPerm ? 'nPr' : 'nCr']}
                />
                <Bar dataKey={isPerm ? 'nPr' : 'nCr'} radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, index) => {
                    const isHighlighted = isPerm ? entry.r === r : entry.r === r;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isHighlighted ? '#8b5cf6' : BAR_COLORS[index % BAR_COLORS.length]}
                        opacity={isHighlighted ? 1 : 0.6}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              The highlighted bar (at r = {r}) shows the current selection. Other bars show {isPerm ? 'nPr' : 'nCr'} for all possible r values.
            </p>
          </div>
        )}

        {/* Formula display */}
        {formulaRow && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Formula</p>
            <p className="text-lg font-mono font-bold text-slate-700">
              {isPerm
                ? `P(n,r) = n! / (n−r)!`
                : `C(n,r) = n! / (r!(n−r)!)`}
            </p>
          </div>
        )}

        {/* Applied calculation */}
        {appliedRow && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-700 whitespace-pre-wrap">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Step-by-Step</p>
            <p>{appliedRow.value}</p>
          </div>
        )}

        {/* Factorial breakdown */}
        <div className="grid grid-cols-3 gap-2">
          {nFact && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">n!</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5 break-all">{nFact.value}</p>
            </div>
          )}
          {rFact && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">r!</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5 break-all">{rFact.value}</p>
            </div>
          )}
          {nMinusR && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">(n−r)!</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5 break-all">{nMinusR.value}</p>
            </div>
          )}
        </div>

        {/* Comparison */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
            Quick Comparison
          </p>
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Permutations</strong> count arrangements where order matters (like passwords or race results).
            <br />
            <strong>Combinations</strong> count selections where order does not matter (like lottery tickets or committee members).
            <br />
            The combination formula divides by <strong>r!</strong> to remove duplicate orderings.
          </p>
        </div>
      </div>
    </div>
  );
}
