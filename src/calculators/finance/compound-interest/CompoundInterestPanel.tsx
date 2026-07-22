import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { DownloadCsvButton } from '../../../utils/downloadCsv';

interface Props {
  principal: number;
  monthlyContribution: number;
  rate: number;
  variance: number;
  years: number;
  compoundFrequency: number;
}

interface DataPoint {
  year: number;
  principal: number;
  interest: number;
  total: number;
  optimistic: number;
  pessimistic: number;
}

function buildData(P: number, monthly: number, rate: number, variance: number, years: number, n: number): DataPoint[] {
  const points: DataPoint[] = [];

  for (let y = 0; y <= years; y++) {
    const mr = rate / 12;
    const months = y * 12;
    const futureP = P * Math.pow(1 + rate / n, n * y);
    const futurePMT = mr === 0 ? monthly * months : monthly * ((Math.pow(1 + mr, months) - 1) / mr);
    const total = futureP + futurePMT;
    const contributed = P + monthly * 12 * y;

    const calcFV = (r: number) => {
      const m = r / 12;
      const fP = P * Math.pow(1 + r / n, n * y);
      const fPMT = m === 0 ? monthly * months : monthly * ((Math.pow(1 + m, months) - 1) / m);
      return fP + fPMT;
    };

    points.push({
      year: y,
      principal: contributed,
      interest: Math.max(0, total - contributed),
      total,
      optimistic: variance > 0 ? calcFV(rate + variance) : total,
      pessimistic: variance > 0 ? calcFV(Math.max(0, rate - variance)) : total,
    });
  }

  return points;
}


function StackedAreaChart({ data, rate, variance }: { data: DataPoint[]; rate: number; variance: number }) {
  if (!data.length) return null;

  const width = 520;
  const height = 220;
  const padL = 65;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(...data.map((d) => d.optimistic));
  const toX = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const principalAreaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.principal).toFixed(1)}`),
    `L ${toX(data.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)}`,
    'Z',
  ].join(' ');

  const interestAreaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.total).toFixed(1)}`),
    ...data.map((_d, i) => `L ${toX(data.length - 1 - i).toFixed(1)} ${toY(data[data.length - 1 - i].principal).toFixed(1)}`),
    'Z',
  ].join(' ');

  const totalLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.total).toFixed(1)}`).join(' ');
  const optimisticLine = variance > 0 ? data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.optimistic).toFixed(1)}`).join(' ') : '';
  const pessimisticLine = variance > 0 ? data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.pessimistic).toFixed(1)}`).join(' ') : '';

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const val = v * maxVal;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const labelStep = Math.max(1, Math.ceil(data.length / 8));
  const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Compound interest growth chart">
        <defs>
          <linearGradient id="ciPrincipalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="ciInterestGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
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
          const x = toX(data.indexOf(d));
          return (
            <g key={d.year}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Yr {d.year}</text>
            </g>
          );
        })}

        <path d={principalAreaPath} fill="url(#ciPrincipalGrad)" />
        <path d={interestAreaPath} fill="url(#ciInterestGrad)" />

        {variance > 0 && optimisticLine && (
          <path d={optimisticLine} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="5 3" opacity={0.6} />
        )}
        {variance > 0 && pessimisticLine && (
          <path d={pessimisticLine} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="5 3" opacity={0.6} />
        )}
        <path d={totalLine} fill="none" stroke="#0ea5e9" strokeWidth={2.5} strokeLinejoin="round" />

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-70 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Principal (Linear)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-70 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Interest (Exponential)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-sky-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Total ({(rate * 100).toFixed(1)}%)</span>
        </div>
        {variance > 0 && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #22c55e' }} />
              <span className="text-[10px] text-slate-500">Optimistic (+{(variance * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #ef4444' }} />
              <span className="text-[10px] text-slate-500">Pessimistic (−{(variance * 100).toFixed(0)}%)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MilestoneTable({ data }: { data: DataPoint[] }) {
  const fmt = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const step = Math.max(1, Math.ceil(data.length / 11));
  const rows = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Contributed</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Interest</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={d.year} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">Year {d.year}</td>
              <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">{fmt(d.principal)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">{fmt(d.interest)}</td>
              <td className="px-4 py-2.5 text-right font-black text-slate-800">{fmt(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CompoundInterestPanel({ principal, monthlyContribution, rate, variance, years, compoundFrequency }: Props) {
  const data = useMemo(
    () => buildData(principal, monthlyContribution, rate, variance, years, compoundFrequency),
    [principal, monthlyContribution, rate, variance, years, compoundFrequency]
  );

  if (!data.length) return null;
  const final = data[data.length - 1];
  const pctInterest = ((final.interest / Math.max(final.total, 1)) * 100).toFixed(0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Compound Interest Growth</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Principal vs. Interest Growth Over {years} Year{years !== 1 ? 's' : ''}
          </p>
          <StackedAreaChart data={data} rate={rate} variance={variance} />
        </div>

        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3">
          <p className="text-sm text-slate-700">
            At year {years}, <strong className="text-emerald-700">{pctInterest}% of your total balance</strong> comes from compound interest — not your contributions.
            {' '}The market did most of the work for you.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Year-by-Year Breakdown</p>
            <DownloadCsvButton
              filename="compound-interest-yearly.csv"
              headers={['Year', 'Principal Contributed', 'Interest Earned', 'Total', 'Optimistic', 'Pessimistic']}
              rows={data.map((d) => [
                d.year,
                d.principal.toFixed(2),
                d.interest.toFixed(2),
                d.total.toFixed(2),
                d.optimistic.toFixed(2),
                d.pessimistic.toFixed(2),
              ])}
            />
          </div>
          <MilestoneTable data={data} />
        </div>
      </div>
    </div>
  );
}
