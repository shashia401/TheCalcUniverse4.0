import { TrendingUp, Printer } from 'lucide-react';

interface ProjectionRow {
  year: number;
  age: number;
  startBalance: number;
  contribution: number;
  growth: number;
  endBalance: number;
}

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

  const width = 520;
  const height = 200;
  const padL = 65;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(projection[projection.length - 1].endBalance, 1);
  const toX = (i: number) => padL + (i / (projection.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const areaPath = [
    ...projection.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.endBalance).toFixed(1)}`),
    `L ${toX(projection.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`,
  ].join(' ');

  const linePath = projection
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.endBalance).toFixed(1)}`)
    .join(' ');

  const labelEvery = Math.max(1, Math.floor(projection.length / 7));
  const xLabels = projection.filter((_, i) => i % labelEvery === 0 || i === projection.length - 1);

  const fmtAxis = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;

  const midIdx = Math.floor(projection.length / 2);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Pension payment chart">
        <defs>
          <linearGradient id="pensionGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#22c55e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{fmtAxis(g * maxVal)}</text>
            </g>
          );
        })}

        {xLabels.map((d) => {
          const x = toX(projection.indexOf(d));
          return (
            <g key={d.year}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Age {d.age}</text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#pensionGrad)" />
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />

        {midIdx > 0 && midIdx < projection.length && (
          <text x={toX(midIdx)} y={toY(projection[midIdx].endBalance) - 8} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight="600">
            {fmtAxis(projection[midIdx].endBalance)}
          </text>
        )}

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>
    </div>
  );
}

function ProjectionTable({ projection }: { projection: ProjectionRow[] }) {
  const step = Math.max(1, Math.ceil(projection.length / 10));
  const rows = projection.filter((_, i) => i % step === 0 || i === projection.length - 1);

  const fmtRow = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
            <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Age</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Start Balance</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Contributions</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Growth</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">End Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={d.year} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">{d.year}</td>
              <td className="px-3 py-2.5 text-slate-600">{d.age}</td>
              <td className="px-3 py-2.5 text-right text-slate-600">${fmtRow(d.startBalance)}</td>
              <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">${fmtRow(d.contribution)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">${fmtRow(d.growth)}</td>
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
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Pension Growth Projection</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Balance Over Time</p>
          <p className="text-xs text-slate-500 mb-3">
            ${monthlyContribution.toLocaleString()}/mo contribution at {growthRate.toFixed(2)}% annual growth
          </p>
          <GrowthChart projection={projection} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Year-by-Year Projection</p>
          <ProjectionTable projection={projection} />
        </div>

        <div className="flex justify-center pt-2 print:hidden">
          <button type="button"
            onClick={triggerPrint}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-md"
          >
            <Printer size={16} />
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
