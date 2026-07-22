import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function computeFactorial(n: number): number {
  if (n === 0) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

const BAR_COLORS = ['#22c55e', '#22c55e', '#3b82f6', '#3b82f6', '#8b5cf6', '#8b5cf6', '#f59e0b', '#f59e0b', '#ef4444', '#ef4444', '#ec4899', '#ec4899', '#06b6d4', '#06b6d4', '#84cc16', '#84cc16'];

export default function FactorialPanel({ values, results }: Props) {
  const n = parseInt(values.n, 10);
  if (isNaN(n) || n < 0 || n > 170) return null;

  const factorialRow = results.find((r) => r.id === 'factorial');

  const chartData = useMemo(() => {
    const maxDisplay = Math.min(n, 15); // Show up to 15! max for readability
    const data: { n: number; fact: number }[] = [];
    for (let i = 0; i <= maxDisplay; i++) {
      const fact = computeFactorial(i);
      data.push({ n: i, fact: fact > 1e15 ? parseFloat(fact.toExponential(2)) : fact });
    }
    return data;
  }, [n]);

  const tooltipFormatter: any = (value: number) => {
    if (value > 1e15) {
      return [Number(value).toExponential(4), 'n!'];
    }
    return [Number(value).toLocaleString(), 'n!'];
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Factorial Growth
        </span>
      </div>

      <div className="p-5 space-y-4">
        {chartData.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              0! through {chartData[chartData.length - 1].n}!
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="n" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} label={{ value: 'n', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={tooltipFormatter}
                />
                <Bar dataKey="fact" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              Factorials grow super-exponentially. {n}! has {computeFactorial(n) > 1e15 ? 'many' : ''} digits.
            </p>
          </div>
        )}

        {/* Result */}
        {factorialRow && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 text-center">
            <p className="text-sm text-slate-500 mb-1">{factorialRow.label}</p>
            <p className="text-2xl font-bold text-blue-700 font-mono break-all">{factorialRow.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
