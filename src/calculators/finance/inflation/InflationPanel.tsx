import { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { CPI_DATA } from './cpiData';

interface InflationPanelProps {
  amount: number;
  startYear: number;
  endYear: number;
}

interface DecadeRow {
  label: string;
  startYear: number;
  endYear: number;
  inflationRate: number;
  avgAnnual: number;
}

function buildDecades(startYear: number, endYear: number): DecadeRow[] {
  const minY = Math.min(startYear, endYear);
  const maxY = Math.max(startYear, endYear);
  const rows: DecadeRow[] = [];

  let y = minY;
  while (y < maxY) {
    const nextDecadeStart = Math.ceil((y + 1) / 10) * 10;
    const segEnd = Math.min(nextDecadeStart, maxY);
    if (!CPI_DATA[y] || !CPI_DATA[segEnd]) { y = segEnd; continue; }
    const cpiS = CPI_DATA[y];
    const cpiE = CPI_DATA[segEnd];
    const years = segEnd - y;
    const inflationRate = ((cpiE - cpiS) / cpiS) * 100;
    const avgAnnual = years > 0 ? (Math.pow(cpiE / cpiS, 1 / years) - 1) * 100 : 0;
    rows.push({ label: `${y}–${segEnd}`, startYear: y, endYear: segEnd, inflationRate, avgAnnual });
    y = segEnd;
  }
  return rows;
}

function CPIChart({ startYear, endYear, amount }: { startYear: number; endYear: number; amount: number }) {
  const minY = Math.min(startYear, endYear);
  const maxY = Math.max(startYear, endYear);
  const yearsInRange = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i)
    .filter((y) => CPI_DATA[y] !== undefined);

  if (yearsInRange.length < 2) return null;

  const width = 520;
  const height = 200;
  const padL = 60;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const cpiStart = CPI_DATA[minY];
  const values = yearsInRange.map((y) => ({
    year: y,
    adjusted: (amount / cpiStart) * CPI_DATA[y],
    cpi: CPI_DATA[y],
  }));

  const maxVal = Math.max(...values.map((v) => v.adjusted));
  const toX = (i: number) => padL + (i / Math.max(values.length - 1, 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const linePath = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v.adjusted).toFixed(1)}`).join(' ');
  const areaPath = [
    ...values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v.adjusted).toFixed(1)}`),
    `L ${toX(values.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)}`,
    'Z',
  ].join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const n = v * maxVal;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const labelStep = Math.max(1, Math.ceil(values.length / 8));
  const xLabels = values.filter((_, i) => i % labelStep === 0 || i === values.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Inflation impact chart">
        <defs>
          <linearGradient id="inflGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{fmtY(g)}</text>
            </g>
          );
        })}

        {xLabels.map((d) => {
          const idx = values.indexOf(d);
          const x = toX(idx);
          return (
            <g key={d.year}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.year}</text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#inflGrad)" />
        <path d={linePath} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinejoin="round" />

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>
      <p className="text-[10px] text-slate-500 mt-1 px-1">Equivalent purchasing power of ${amount.toLocaleString()} from {minY} over time</p>
    </div>
  );
}

function DecadeTable({ rows }: { rows: DecadeRow[]; direction: 'forward' | 'backward' }) {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Period</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-red-500 uppercase tracking-wider text-[10px]">Total Inflation</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Avg Annual Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">{row.label}</td>
              <td className="px-3 py-2.5 text-right font-bold text-red-500">{row.inflationRate >= 0 ? '+' : ''}{row.inflationRate.toFixed(1)}%</td>
              <td className="px-4 py-2.5 text-right text-slate-600">{row.avgAnnual.toFixed(2)}%/yr</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InflationPanel({ amount, startYear, endYear }: InflationPanelProps) {
  const decades = useMemo(() => buildDecades(startYear, endYear), [startYear, endYear]);
  const direction = endYear >= startYear ? 'forward' : 'backward';

  if (!CPI_DATA[startYear] || !CPI_DATA[endYear]) return null;

  const cpiStart = CPI_DATA[startYear];
  const cpiEnd = CPI_DATA[endYear];
  const adjusted = (amount / cpiStart) * cpiEnd;
  const diff = adjusted - amount;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <BarChart2 size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Inflation Analysis · Official BLS CPI Data</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            {fmt(amount)} in <strong>{startYear}</strong> had the same purchasing power as{' '}
            <strong className={diff > 0 ? 'text-red-600' : 'text-emerald-600'}>{fmt(adjusted)}</strong> in <strong>{endYear}</strong>.
            {' '}That's a{' '}
            <strong>{diff > 0 ? 'price increase' : 'price decrease'}</strong> of{' '}
            <strong>{fmt(Math.abs(diff))}</strong>{' '}
            ({(((cpiEnd - cpiStart) / cpiStart) * 100).toFixed(1)}% {diff > 0 ? 'inflation' : 'deflation'}) over {Math.abs(endYear - startYear)} years.
          </p>
          <p className="text-[10px] text-slate-500 mt-2">
            Based on US CPI-U (All Urban Consumers) annual averages published by the Bureau of Labor Statistics.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Purchasing Power of {fmt(amount)} Over Time
          </p>
          <CPIChart startYear={startYear} endYear={endYear} amount={amount} />
        </div>

        {decades.length > 1 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Inflation by Period</p>
            <DecadeTable rows={direction === 'forward' ? decades : decades.slice().reverse()} direction={direction} />
          </div>
        )}
      </div>
    </div>
  );
}
