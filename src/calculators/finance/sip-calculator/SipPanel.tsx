import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';

/** Indian grouping for axis ticks: 1.5Cr, 20L, 50K. */
function rupeeTick(n: number): string {
  const v = Math.abs(n);
  if (v >= 1e7) return `${+(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `${+(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${+(v / 1e3).toFixed(0)}K`;
  return `${Math.round(v)}`;
}

function SipPanel({ results }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const chartDataStr = results.find((r) => r.id === '_wealthChart')?.value || '[]';
  const chartData = useMemo<{ year: number; value: number }[]>(() => {
    try {
      const parsed = JSON.parse(chartDataStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [chartDataStr]);

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Wealth Growth Over Time</span>
      </div>
      <div className="p-6">
        <SvgLineChart
          ariaLabel="Projected investment value at the end of each year"
          series={[{ name: 'Projected value', color: '#1d4ed8', points: chartData.map((d) => ({ x: d.year, y: d.value })) }]}
          xFormat={(n) => `Yr ${+n.toFixed(1)}`}
          yFormat={rupeeTick}
        />
      </div>
    </div>
  );
}

export default SipPanel;
