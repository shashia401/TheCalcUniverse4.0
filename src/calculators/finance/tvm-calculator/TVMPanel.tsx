import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function tvmFV(pv: number, pmt: number, r: number, n: number, due: boolean): number {
  if (r === 0) return -(pv + pmt * n);
  const factor = Math.pow(1 + r, n);
  const annuityFactor = due ? (factor - 1) / r * (1 + r) : (factor - 1) / r;
  return -(pv * factor + pmt * annuityFactor);
}

interface GrowthPoint {
  period: number;
  balance: number;
  principal: number;
  interest: number;
}

function simulateGrowth(pv: number, pmt: number, rate: number, n: number, due: boolean): GrowthPoint[] {
  const data: GrowthPoint[] = [];
  let totalPmt = 0;
  for (let k = 0; k <= n; k++) {
    const balance = tvmFV(pv, pmt, rate, k, due);
    if (k > 0) totalPmt += pmt;
    const totalPrincipal = pv + totalPmt;
    data.push({
      period: k,
      balance,
      principal: totalPrincipal,
      interest: balance - totalPrincipal,
    });
  }
  return data;
}

function GrowthChart({ data }: { data: GrowthPoint[] }) {
  if (data.length < 2) return null;

  const width = 520;
  const height = 220;
  const padL = 65;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(...data.map((d) => d.balance), 1);
  const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const principalPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.principal).toFixed(1)}`),
    `L ${toX(data.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`,
  ].join(' ');

  const totalPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.balance).toFixed(1)}`),
    ...data.map((_d, i) => `L ${toX(data.length - 1 - i).toFixed(1)} ${toY(data[data.length - 1 - i].principal).toFixed(1)}`),
    'Z',
  ].join(' ');

  const totalLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.balance).toFixed(1)}`).join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const val = v * maxVal;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const maxLabels = 8;
  const labelStep = Math.max(1, Math.floor((data.length - 1) / (maxLabels - 1)));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="TVM balance growth chart">
        <defs>
          <linearGradient id="tvmPrincipalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="tvmInterestGrad" x1="0" y1="0" x2="0" y2="1">
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

        {data.filter((_, i) => i % labelStep === 0 || i === data.length - 1).map((d) => {
          const x = toX(d.period);
          return (
            <g key={d.period}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Period {d.period}</text>
            </g>
          );
        })}

        <path d={principalPath} fill="url(#tvmPrincipalGrad)" />
        <path d={totalPath} fill="url(#tvmInterestGrad)" />
        <path d={totalLine} fill="none" stroke="#0ea5e9" strokeWidth={2.5} strokeLinejoin="round" />

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-70 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Principal (PV + PMT)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-70 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Returns / Interest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-sky-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Total Balance</span>
        </div>
      </div>
    </div>
  );
}

function VariableComparisonChart({ pv, fv, pmt, n, rate }: { pv: number; fv: number; pmt: number; n: number; rate: number }) {
  const items = [
    { label: 'PV', value: Math.abs(pv), color: 'bg-blue-500' },
    { label: 'FV', value: Math.abs(fv), color: 'bg-emerald-500' },
    { label: 'PMT', value: Math.abs(pmt) * Math.min(n, 12), color: 'bg-amber-500' },
  ];

  const maxVal = Math.max(...items.map((i) => i.value), 1);
  const barMaxW = 280;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-12 text-right flex-shrink-0">
            <span className="text-xs font-bold text-slate-600">{item.label}</span>
          </div>
          <div className="flex-1 h-7 bg-slate-100 rounded-sm overflow-hidden relative">
            <div
              className={`absolute left-0 top-0 h-full rounded-sm ${item.color} opacity-70 transition-all duration-500`}
              style={{ width: `${(item.value / maxVal) * 100}%` }}
            />
            <span className="absolute left-2 top-0 text-[10px] text-white font-bold leading-7 drop-shadow-md">
              ${item.value >= 1_000_000 ? (item.value / 1_000_000).toFixed(1) + 'M' : item.value >= 1_000 ? (item.value / 1_000).toFixed(0) + 'K' : item.value.toFixed(0)}
            </span>
          </div>
        </div>
      ))}
      {rate > 0 && (
        <div className="flex items-center gap-3">
          <div className="w-12 text-right flex-shrink-0">
            <span className="text-xs font-bold text-slate-600">Rate</span>
          </div>
          <div className="flex-1 h-7 bg-slate-100 rounded-sm overflow-hidden relative">
            <div
              className="absolute left-0 top-0 h-full rounded-sm bg-purple-500 opacity-70 transition-all duration-500"
              style={{ width: `${Math.min(rate * 10, 100)}%` }}
            />
            <span className="absolute left-2 top-0 text-[10px] text-white font-bold leading-7 drop-shadow-md">
              {(rate * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TVMPanel({ values, results }: Props) {
  if (!results || results.length === 0) return null;

  const hasError = results.some((r) => r.id === 'error');
  if (hasError) return null;

  const solveFor = values.solveFor || 'FV';
  const timing = values.timing || 'end';
  const due = timing === 'begin';

  const n = parseFloat(values.n || 'NaN');
  const rateRaw = parseFloat(values.rate || 'NaN');
  const rate = isNaN(rateRaw) ? 0 : rateRaw / 100;
  const pv = parseFloat(values.pv || 'NaN');
  const pmtRaw = parseFloat(values.pmt || 'NaN');
  const pmt = isNaN(pmtRaw) ? 0 : pmtRaw;
  const fv = parseFloat(values.fv || 'NaN');

  const growthData = useMemo(() => {
    if (isNaN(n) || isNaN(rate) || isNaN(pv)) return [];
    return simulateGrowth(pv, pmt, rate, Math.round(n), due);
  }, [pv, pmt, rate, n, due]);

  const solvedResult = results.find((r) => r.id === 'result');
  const fmtMoney = (n: number) =>
    `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">TVM Growth Projection</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Growth Chart */}
        {growthData.length > 1 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Balance Growth Over {Math.round(n)} Period{solveFor === 'N' ? ' (solved result)' : ''}
            </p>
            <GrowthChart data={growthData} />
          </div>
        )}

        {/* Key insight */}
        {growthData.length > 1 && (() => {
          const final = growthData[growthData.length - 1];
          const pctInterest = final.interest > 0 ? ((final.interest / final.balance) * 100).toFixed(1) : '0';
          return (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3">
              <p className="text-sm text-slate-700">
                Over {Math.round(n)} period{Math.round(n) !== 1 ? 's' : ''},{' '}
                <strong className="text-emerald-700">{pctInterest}% of the final balance</strong> comes from returns — not the original investment or payments.
              </p>
            </div>
          );
        })()}

        {/* Variable comparison */}
        {!isNaN(pv) && !isNaN(fv) && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Variable Magnitudes
            </p>
            <VariableComparisonChart pv={pv} fv={fv} pmt={pmt} n={n} rate={rate} />
          </div>
        )}

        {/* Solved result card */}
        {solvedResult && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-1">Solved Variable</p>
            <p className="text-sm font-bold text-sky-800">
              {solvedResult.label}: {solvedResult.value}
            </p>
            <p className="text-xs text-sky-600 mt-1">
              {timing === 'begin' ? 'Annuity Due' : 'Ordinary Annuity'} &middot; {solveFor === 'RATE' ? 'Newton-Raphson iteration' : 'TVM formula'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
