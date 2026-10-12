import { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { CPI_DATA, PARTIAL_YEARS } from './cpiData';
import SvgLineChart from '../../../components/charts/SvgLineChart';

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
  const points = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i)
    .filter((y) => CPI_DATA[y] !== undefined)
    .map((y) => ({ x: y, y: (amount / CPI_DATA[minY]) * CPI_DATA[y] }));

  if (points.length < 2) return null;

  const fmtY = (n: number) => (n >= 1000 ? `$${+(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`);

  return (
    <div>
      <SvgLineChart
        series={[{ name: `Equivalent of $${amount.toLocaleString()} from ${minY}`, color: '#b91c1c', points }]}
        height={200}
        xFormat={(n) => String(n)}
        yFormat={fmtY}
        ariaLabel={`Equivalent purchasing power of $${amount.toLocaleString()} from ${minY} rising from $${points[0].y.toFixed(0)} to $${points[points.length - 1].y.toFixed(0)} by ${maxY}`}
      />
      <p className="text-[10px] text-slate-600 mt-1 px-1">Equivalent purchasing power of ${amount.toLocaleString()} from {minY} over time</p>
    </div>
  );
}

function DecadeTable({ rows }: { rows: DecadeRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Inflation by period table">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Period</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-red-700 uppercase tracking-wider text-[10px]">Total Inflation</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Avg Annual Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">{row.label}</td>
              <td className="px-3 py-2.5 text-right font-bold text-red-700">{row.inflationRate >= 0 ? '+' : ''}{row.inflationRate.toFixed(1)}%</td>
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
  const partialYear = [startYear, endYear].find((y) => PARTIAL_YEARS[y]);

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
            <strong className={diff > 0 ? 'text-red-700' : 'text-emerald-700'}>{fmt(adjusted)}</strong> in <strong>{endYear}</strong>.
            {' '}That's a{' '}
            <strong>{diff > 0 ? 'price increase' : 'price decrease'}</strong> of{' '}
            <strong>{fmt(Math.abs(diff))}</strong>{' '}
            ({(((cpiEnd - cpiStart) / cpiStart) * 100).toFixed(1)}% {diff > 0 ? 'inflation' : 'deflation'}) over {Math.abs(endYear - startYear)} years.
          </p>
          <p className="text-[10px] text-slate-600 mt-2">
            Based on US CPI-U (All Urban Consumers) annual averages published by the Bureau of Labor Statistics.
            {partialYear ? ` ${partialYear} is the ${PARTIAL_YEARS[partialYear]} so far, not a full-year average.` : ''}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
            Purchasing Power of {fmt(amount)} Over Time
          </p>
          <CPIChart startYear={startYear} endYear={endYear} amount={amount} />
        </div>

        {decades.length > 1 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Inflation by Period</p>
            <DecadeTable rows={direction === 'forward' ? decades : decades.slice().reverse()} />
          </div>
        )}
      </div>
    </div>
  );
}
