import { TrendingUp, Printer } from 'lucide-react';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import type { ProjectionRow } from './pensionMath';

interface Props {
  projection: ProjectionRow[];
  growthRate: number;
  monthlyContribution: number;
  inflationAdjust: string;
  finalBalance: number;
}


function triggerPrint() {
  window.print();
}

function GrowthChart({ projection }: { projection: ProjectionRow[] }) {
  if (projection.length < 2) return null;
  const first = projection[0];
  const points = [
    { x: first.startAge, y: first.startBalance },
    ...projection.map((d) => ({ x: d.age, y: d.endBalance })),
  ];
  const fmtAxis = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;
  return (
    <SvgLineChart
      ariaLabel="Projected pension balance by age"
      series={[{ name: 'Projected balance', points, color: '#2563eb' }]}
      xFormat={(n) => `Age ${Math.round(n)}`}
      yFormat={fmtAxis}
    />
  );
}

function ProjectionTable({ projection }: { projection: ProjectionRow[] }) {
  const step = Math.max(1, Math.ceil(projection.length / 10));
  const rows = projection.filter((_, i) => i % step === 0 || i === projection.length - 1);

  const fmtRow = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Year-by-year pension projection table">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Year</th>
            <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Age</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Start Balance</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-700 uppercase tracking-wider text-[10px]">Contributions</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-700 uppercase tracking-wider text-[10px]">Growth</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">End Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={d.year} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">{d.year}</td>
              <td className="px-3 py-2.5 text-slate-600">{Number.isInteger(d.age) ? d.age : d.age.toFixed(1)}</td>
              <td className="px-3 py-2.5 text-right text-slate-600">${fmtRow(d.startBalance)}</td>
              <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">${fmtRow(d.contribution)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-700 font-semibold">${fmtRow(d.growth)}</td>
              <td className="px-4 py-2.5 text-right font-bold text-slate-800">${fmtRow(d.endBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PensionPanel({ projection, growthRate, monthlyContribution }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Pension Growth Projection</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-1">Balance Over Time</p>
          <p className="text-xs text-slate-600 mb-3">
            ${monthlyContribution.toLocaleString()}/mo contribution at {growthRate.toFixed(2)}% annual growth
          </p>
          <GrowthChart projection={projection} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Year-by-Year Projection</p>
          <ProjectionTable projection={projection} />
        </div>

        <div className="flex justify-center pt-2 print:hidden">
          <button type="button"
            onClick={triggerPrint}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-md"
          >
            <Printer size={16} aria-hidden="true" />
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
