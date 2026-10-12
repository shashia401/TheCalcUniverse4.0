import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';

/** Indian grouping for axis ticks: 1.5Cr, 20L, 50K. */
function rupeeTick(n: number): string {
  const v = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (v >= 1e7) return `${sign}${+(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `${sign}${+(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${sign}${+(v / 1e3).toFixed(0)}K`;
  return `${sign}${Math.round(v)}`;
}

function SwpPanel({ values, results }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const chartDataStr = results.find((r) => r.id === '_withdrawalChart')?.value || '[]';
  const chartData = useMemo<{ year: number; value: number }[]>(() => {
    try {
      const parsed = JSON.parse(chartDataStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [chartDataStr]);

  if (chartData.length === 0) return null;

  const corpus = parseFloat(values.corpus) || 0;
  const last = chartData[chartData.length - 1];
  const isDepleted = last.value <= 0;
  const monthsLasted = results.find((r) => r.id === 'monthsLasted')?.value || '';
  const points = [{ x: 0, y: corpus }, ...chartData.map((d) => ({ x: d.year, y: d.value }))];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Corpus Depletion Over Time</span>
      </div>
      <div className="p-6 space-y-4">
        <SvgLineChart
          ariaLabel={isDepleted ? 'Corpus balance by year; the corpus is depleted' : 'Corpus balance by year'}
          series={[{ name: 'Corpus balance', color: isDepleted ? '#b91c1c' : '#1d4ed8', points }]}
          xFormat={(n) => `Yr ${+n.toFixed(1)}`}
          yFormat={rupeeTick}
        />
        {isDepleted && <p className="text-center text-sm font-bold text-red-700">Corpus depleted</p>}
        {monthsLasted && (
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Corpus Longevity</p>
            <p className={`text-sm font-black ${isDepleted ? 'text-red-700' : 'text-emerald-800'}`}>{monthsLasted}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwpPanel;
