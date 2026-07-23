import { useState, useMemo } from 'react';
import { TrendingDown, Zap } from 'lucide-react';
import { DownloadCsvButton } from '../../utils/downloadCsv';

interface AmortizationRow {
  year: number;
  startBalance: number;
  interest: number;
  principal: number;
  endBalance: number;
  dateRange: string;
}

interface MonthlyRow {
  month: number;
  year: number;
  startBalance: number;
  interest: number;
  principal: number;
  endBalance: number;
}

export interface MonthlyBreakdown {
  principalAndInterest: number;
  propertyTax: number;
  homeInsurance: number;
  pmi: number;
  hoa: number;
  other: number;
  total: number;
}

const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(2024, i, 1))
);
const SCHEDULE_SAFETY_SLACK = (n: number) => Math.max(12, Math.ceil(n * 0.5));

function buildSchedule(
  loanAmount: number,
  monthlyRate: number,
  monthlyPayment: number,
  numPayments: number,
  startYear: number,
  startMonth: number,
  extraMonthly = 0
): { yearly: AmortizationRow[]; monthly: MonthlyRow[]; actualPayments: number } {
  const monthly: MonthlyRow[] = [];
  let balance = loanAmount;

  for (let i = 0; i < numPayments + SCHEDULE_SAFETY_SLACK(numPayments); i++) {
    if (balance <= 0) break;
    const interestCharge = balance * monthlyRate;
    const principalPaid = Math.min(monthlyPayment + extraMonthly - interestCharge, balance);
    if (principalPaid <= 0) break;
    const newBalance = Math.max(balance - principalPaid, 0);

    monthly.push({
      month: ((startMonth - 1 + i) % 12) + 1,
      year: startYear + Math.floor((startMonth - 1 + i) / 12),
      startBalance: balance,
      interest: interestCharge,
      principal: principalPaid,
      endBalance: newBalance,
    });

    balance = newBalance;
    if (balance <= 0) break;
  }

  const yearly: AmortizationRow[] = [];
  let yearGroup: MonthlyRow[] = [];

  for (let i = 0; i < monthly.length; i++) {
    const row = monthly[i];
    yearGroup.push(row);

    const isLastRow = i === monthly.length - 1;
    const isYearBoundary = !isLastRow && monthly[i + 1].year !== row.year;

    if (isLastRow || isYearBoundary) {
      const yearNum = yearly.length + 1;
      const first = yearGroup[0];
      const last = yearGroup[yearGroup.length - 1];
      const dateRange = `${MONTH_NAMES[first.month - 1]} ${first.year} – ${MONTH_NAMES[last.month - 1]} ${last.year}`;

      yearly.push({
        year: yearNum,
        startBalance: first.startBalance,
        interest: yearGroup.reduce((s, r) => s + r.interest, 0),
        principal: yearGroup.reduce((s, r) => s + r.principal, 0),
        endBalance: last.endBalance,
        dateRange,
      });

      yearGroup = [];
    }
  }

  return { yearly, monthly, actualPayments: monthly.length };
}

function buildBiweeklySchedule(
  loanAmount: number,
  monthlyRate: number,
  monthlyPayment: number,
  numPayments: number,
  startYear: number,
  startMonth: number,
  extraBiweekly = 0
): { actualPayments: number; totalInterest: number; lastMonth: number; lastYear: number } {
  const biweeklyRate = monthlyRate * 12 / 26;
  const biweeklyPayment = monthlyPayment / 2 + extraBiweekly;
  let balance = loanAmount;
  let payments = 0;
  const maxPayments = numPayments * 2 + SCHEDULE_SAFETY_SLACK(numPayments) * 2;

  let totalInterest = 0;

  for (let i = 0; i < maxPayments; i++) {
    if (balance <= 0) break;
    const interestCharge = balance * biweeklyRate;
    totalInterest += interestCharge;
    const principalPaid = Math.min(biweeklyPayment - interestCharge, balance);
    if (principalPaid <= 0) break;
    balance -= principalPaid;
    payments++;
    if (balance <= 0) break;
  }

  const monthsElapsed = Math.ceil((payments * 14) / 30.4375);
  const endMonthIdx = (startMonth - 1 + monthsElapsed) % 12;
  const endYear = startYear + Math.floor((startMonth - 1 + monthsElapsed) / 12);

  return { actualPayments: payments, totalInterest, lastMonth: endMonthIdx + 1, lastYear: endYear };
}

const SLICE_COLORS = ['#ea580c', '#22c55e', '#f97316', '#8b5cf6', '#0891b2', '#f59e0b'];
const SLICE_LABELS = ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI', 'HOA', 'Other'];

const CHART_GRID = '#e2e8f0';
const CHART_AXIS = '#94a3b8';
const CHART_LEGEND = '#475569';

function CostDonutChart({ breakdown }: { breakdown: MonthlyBreakdown }) {
  const slices = [
    breakdown.principalAndInterest,
    breakdown.propertyTax,
    breakdown.homeInsurance,
    breakdown.pmi,
    breakdown.hoa,
    breakdown.other,
  ].map((v, i) => ({ value: v, color: SLICE_COLORS[i], label: SLICE_LABELS[i] }))
    .filter((s) => s.value > 0.01);

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total <= 0) return null;

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 58;
  const stroke = 22;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = slices.map((sl) => {
    const dash = (sl.value / total) * circumference;
    const seg = { ...sl, dash, offset: -offset };
    offset += dash;
    return seg;
  });

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtTotal = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Principal vs interest donut chart">
            <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={stroke} />
            {segments.map((seg, i) => (
              <circle
                key={seg.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${seg.dash} ${circumference}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-600 dark:text-slate-400">Monthly</span>
            <span className="text-base font-black text-slate-800 dark:text-slate-100">{fmtTotal(total)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          {segments.map((seg, i) => (
            <div key={seg.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-xs text-slate-600 truncate dark:text-slate-300">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">${fmt(seg.value)}</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 w-8 text-right dark:text-slate-600 dark:text-slate-400">{((seg.value / total) * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
          <div className="border-t border-slate-100 pt-1.5 mt-0.5 flex items-center justify-between dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Total Monthly</span>
            <span className="text-xs font-black text-slate-900 dark:text-slate-50">${fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonChart({
  originalRows,
  newRows,
  maxYears,
}: {
  originalRows: AmortizationRow[];
  newRows: AmortizationRow[];
  maxYears: number;
}) {
  if (!originalRows.length) return null;

  const width = 520;
  const height = 190;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxBalance = originalRows[0].startBalance;
  const totalOriginalInterest = originalRows.reduce((s, r) => s + r.interest, 0);
  const maxY = maxBalance + totalOriginalInterest;

  const toX = (yearIndex: number) => padL + (yearIndex / (maxYears || 1)) * chartW;
  const toY = (val: number) => padT + (1 - val / maxY) * chartH;

  const balancePath = (rows: AmortizationRow[]) => {
    const pts = rows.map((r, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(r.startBalance).toFixed(1)}`);
    pts.push(`L ${toX(rows.length).toFixed(1)} ${toY(0).toFixed(1)}`);
    return pts.join(' ');
  };

  const interestPath = (rows: AmortizationRow[]) => {
    let cum = 0;
    return rows.map((r, i) => {
      cum += r.interest;
      return `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(cum).toFixed(1)}`;
    }).join(' ');
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const n = v * maxY;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const xLabels: number[] = [0];
  const step = maxYears <= 15 ? 5 : 10;
  for (let y = step; y <= maxYears; y += step) xLabels.push(y);

  const legend = [
    { color: '#94a3b8', label: 'Original Balance' },
    { color: '#ea580c', label: 'New Balance' },
    { color: '#f97316', label: 'Original Interest' },
    { color: '#22c55e', label: 'New Interest' },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Payoff comparison chart">
        {gridLines.map((g) => {
          const y = toY(g * maxY);
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke={CHART_GRID} strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill={CHART_AXIS}>{fmtY(g)}</text>
            </g>
          );
        })}
        {xLabels.map((yr) => {
          const x = toX(yr);
          return (
            <g key={yr}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke={CHART_GRID} strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 10} textAnchor="middle" fontSize={9} fill={CHART_AXIS}>{yr}</text>
            </g>
          );
        })}

        <path d={interestPath(originalRows)} fill="none" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 2" strokeLinejoin="round" />
        <path d={interestPath(newRows)} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinejoin="round" />
        <path d={balancePath(originalRows)} fill="none" stroke={CHART_AXIS} strokeWidth={1.5} strokeDasharray="4 2" strokeLinejoin="round" />
        <path d={balancePath(newRows)} fill="none" stroke="#ea580c" strokeWidth={2.5} strokeLinejoin="round" />

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke={CHART_GRID} strokeWidth={0.5} />
        <text x={padL + chartW / 2} y={height - 2} textAnchor="middle" fontSize={9} fill={CHART_AXIS}>Year</text>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 flex-shrink-0" style={{ backgroundColor: l.color }} />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-600 dark:text-slate-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BalanceChart({ rows }: { rows: AmortizationRow[] }) {
  const maxBalance = rows[0]?.startBalance ?? 0;
  if (maxBalance === 0) return null;

  const width = 520;
  const height = 180;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const maxY = maxBalance + totalInterest;
  const years = rows.length;

  const balancePoints = rows.map((r, i) => ({
    x: padL + (i / (years - 1 || 1)) * chartW,
    y: padT + (1 - r.startBalance / maxY) * chartH,
  }));
  balancePoints.push({ x: padL + chartW, y: padT + chartH });

  const cumInterestPoints = rows.map((r, i) => {
    const cumInt = rows.slice(0, i + 1).reduce((s, rr) => s + rr.interest, 0);
    return {
      x: padL + (i / (years - 1 || 1)) * chartW,
      y: padT + (1 - cumInt / maxY) * chartH,
    };
  });

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const n = v * maxY;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const xLabels: number[] = [0];
  const step = years <= 15 ? 5 : 10;
  for (let y = step; y <= years; y += step) xLabels.push(y);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px', maxWidth: '100%' }} role="img" aria-label="Amortization balance chart">
        {gridLines.map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke={CHART_GRID} strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill={CHART_AXIS}>{fmtY(g)}</text>
            </g>
          );
        })}
        {xLabels.map((yr) => {
          const x = padL + (yr / (years || 1)) * chartW;
          return (
            <g key={yr}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke={CHART_GRID} strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 10} textAnchor="middle" fontSize={9} fill={CHART_AXIS}>{yr}</text>
            </g>
          );
        })}

        <path d={toPath(cumInterestPoints)} fill="none" stroke="#f97316" strokeWidth={2} strokeLinejoin="round" />
        <path d={toPath(balancePoints)} fill="none" stroke="#ea580c" strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke={CHART_GRID} strokeWidth={0.5} />

        <g>
          <rect x={padL + 8} y={padT + 6} width={10} height={4} rx={1} fill="#ea580c" />
          <text x={padL + 22} y={padT + 10} fontSize={9} fill={CHART_LEGEND} dominantBaseline="middle">Balance</text>
          <rect x={padL + 70} y={padT + 6} width={10} height={4} rx={1} fill="#f97316" />
          <text x={padL + 84} y={padT + 10} fontSize={9} fill={CHART_LEGEND} dominantBaseline="middle">Cumulative Interest</text>
        </g>
        <text x={padL + chartW / 2} y={height - 2} textAnchor="middle" fontSize={9} fill={CHART_AXIS}>Year</text>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#ea580c' }} />
          <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-600 dark:text-slate-400">Balance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#f97316' }} />
          <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-600 dark:text-slate-400">Cumulative Interest</span>
        </div>
      </div>
    </div>
  );
}

interface ExtraPaymentSavings {
  extraMonthly: number;
  extraBiweekly: number;
  newMonths: number;
  newPayoffLabel: string;
  interestSaved: number;
  timeSavedMonths: number;
  newTotalInterest: number;
  originalTotalInterest: number;
  originalMonths: number;
  newYearly: AmortizationRow[];
}

function computeSavings(
  loanAmount: number,
  monthlyRate: number,
  monthlyPayment: number,
  originalMonths: number,
  startYear: number,
  startMonth: number,
  extraMonthly: number,
  extraBiweekly: number
): ExtraPaymentSavings | null {
  if (extraMonthly <= 0 && extraBiweekly <= 0) return null;

  const originalInterest = monthlyPayment * originalMonths - loanAmount;

  if (extraBiweekly > 0) {
    const bw = buildBiweeklySchedule(loanAmount, monthlyRate, monthlyPayment, originalMonths, startYear, startMonth, extraBiweekly);
    const newMonths = Math.ceil((bw.actualPayments * 14) / 30.4375);
    const endMonthIdx = (startMonth - 1 + newMonths) % 12;
    const endYear = startYear + Math.floor((startMonth - 1 + newMonths) / 12);
    const newPayoffLabel = `${MONTH_NAMES[endMonthIdx]} ${endYear}`;
    const timeSavedMonths = originalMonths - newMonths;
    const interestSaved = originalInterest - bw.totalInterest;
    const { yearly: newYearly } = buildSchedule(loanAmount, monthlyRate, monthlyPayment, originalMonths, startYear, startMonth, monthlyPayment / 2 * 26 / 12 - monthlyPayment + extraBiweekly * 26 / 12);

    return {
      extraMonthly,
      extraBiweekly,
      newMonths,
      newPayoffLabel,
      interestSaved,
      timeSavedMonths,
      newTotalInterest: bw.totalInterest,
      originalTotalInterest: originalInterest,
      originalMonths,
      newYearly,
    };
  }

  const { monthly: newMonthly, yearly: newYearly, actualPayments: newMonths } = buildSchedule(
    loanAmount, monthlyRate, monthlyPayment, originalMonths, startYear, startMonth, extraMonthly
  );
  const newTotalInterest = newMonthly.reduce((s, r) => s + r.interest, 0);
  const interestSaved = originalInterest - newTotalInterest;
  const timeSavedMonths = originalMonths - newMonths;

  const endMonthIdx = (startMonth - 1 + newMonths) % 12;
  const endYear = startYear + Math.floor((startMonth - 1 + newMonths) / 12);
  const newPayoffLabel = `${MONTH_NAMES[endMonthIdx]} ${endYear}`;

  return {
    extraMonthly,
    extraBiweekly,
    newMonths,
    newPayoffLabel,
    interestSaved,
    timeSavedMonths,
    newTotalInterest,
    originalTotalInterest: originalInterest,
    originalMonths,
    newYearly,
  };
}

function ExtraPaymentPanel({
  loanAmount,
  monthlyRate,
  monthlyPayment,
  originalMonths,
  startYear,
  startMonth,
}: {
  loanAmount: number;
  monthlyRate: number;
  monthlyPayment: number;
  originalMonths: number;
  startYear: number;
  startMonth: number;
}) {
  const [mode, setMode] = useState<'monthly' | 'biweekly'>('monthly');
  const [extraMonthlyStr, setExtraMonthlyStr] = useState('100');
  const [extraBiweeklyStr, setExtraBiweeklyStr] = useState('50');

  const extraMonthly = parseFloat(extraMonthlyStr) || 0;
  const extraBiweekly = parseFloat(extraBiweeklyStr) || 0;

  const savings = useMemo(() => computeSavings(
    loanAmount, monthlyRate, monthlyPayment, originalMonths, startYear, startMonth,
    mode === 'monthly' ? extraMonthly : 0,
    mode === 'biweekly' ? extraBiweekly : 0
  ), [loanAmount, monthlyRate, monthlyPayment, originalMonths, startYear, startMonth, mode, extraMonthly, extraBiweekly]);

  const { yearly: originalYearly } = useMemo(() => buildSchedule(
    loanAmount, monthlyRate, monthlyPayment, originalMonths, startYear, startMonth
  ), [loanAmount, monthlyRate, monthlyPayment, originalMonths, startYear, startMonth]);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const timeSavedLabel = (months: number) => {
    if (months <= 0) return '—';
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0) return `${m} mo`;
    if (m === 0) return `${y} yr`;
    return `${y} yr ${m} mo`;
  };

  const originalEndMonthIdx = (startMonth - 1 + originalMonths) % 12;
  const originalEndYear = startYear + Math.floor((startMonth - 1 + originalMonths) / 12);
  const originalPayoffLabel = `${MONTH_NAMES[originalEndMonthIdx]} ${originalEndYear}`;
  const originalInterest = monthlyPayment * originalMonths - loanAmount;

  const maxYears = Math.max(originalYearly.length, savings?.newYearly.length ?? 0);

  return (
    <div className="border-t border-slate-100 pt-5 space-y-4 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <Zap size={15} className="text-emerald-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Extra Payment Savings</span>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-4 dark:bg-slate-900">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('monthly')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${mode === 'monthly' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 dark:text-slate-400 border-slate-200 hover:border-blue-300'}`}
          >
            Extra Monthly
          </button>
          <button
            onClick={() => setMode('biweekly')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${mode === 'biweekly' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 dark:text-slate-400 border-slate-200 hover:border-blue-300'}`}
          >
            Bi-Weekly
          </button>
        </div>

        {mode === 'monthly' ? (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap dark:text-slate-300">Extra per month</label>
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-600 dark:text-slate-400 text-sm font-medium pointer-events-none dark:text-slate-600 dark:text-slate-400">$</span>
              <input
                type="text"
                inputMode="decimal"
                aria-label="Extra per month"
                value={extraMonthlyStr}
                onChange={(e) => setExtraMonthlyStr(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap dark:text-slate-300">Extra per bi-weekly</label>
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-600 dark:text-slate-400 text-sm font-medium pointer-events-none dark:text-slate-600 dark:text-slate-400">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label="Extra per bi-weekly"
                  value={extraBiweeklyStr}
                  onChange={(e) => setExtraBiweeklyStr(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-600 dark:text-slate-400">
              Bi-weekly = half payment every 2 weeks (26 payments/yr). Even $0 extra bi-weekly saves vs. monthly.
            </p>
          </div>
        )}
      </div>

      {savings && savings.timeSavedMonths > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/60 dark:bg-emerald-950/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Interest Saved</p>
              <p className="text-lg font-black text-emerald-700">${fmtInt(savings.interestSaved)}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/60 dark:bg-blue-950/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Time Saved</p>
              <p className="text-lg font-black text-blue-700">{timeSavedLabel(savings.timeSavedMonths)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 col-span-2 sm:col-span-1 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-1 dark:text-slate-600 dark:text-slate-400">New Payoff</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-100">{savings.newPayoffLabel}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] dark:text-slate-600 dark:text-slate-400"></th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] dark:text-slate-600 dark:text-slate-400">Original</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-emerald-600 uppercase tracking-wider text-[10px]">With Extra</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300">Monthly Payment</td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">${fmt(monthlyPayment)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">
                    {mode === 'monthly' ? `$${fmt(monthlyPayment + extraMonthly)}` : `$${fmt(monthlyPayment / 2 + extraBiweekly)}/2wk`}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800">
                  <td className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300">Total Interest</td>
                  <td className="px-3 py-2.5 text-right font-bold text-red-500">${fmtInt(originalInterest)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-600">${fmtInt(savings.newTotalInterest)}</td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300">Total Payments</td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">${fmtInt(monthlyPayment * originalMonths)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">${fmtInt(loanAmount + savings.newTotalInterest)}</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800">
                  <td className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300">Payoff Date</td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">{originalPayoffLabel}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{savings.newPayoffLabel}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300">Loan Term</td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">{timeSavedLabel(originalMonths)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{timeSavedLabel(savings.newMonths)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3 dark:text-slate-600 dark:text-slate-400">Payoff Comparison</p>
            <ComparisonChart originalRows={originalYearly} newRows={savings.newYearly} maxYears={maxYears} />
          </div>
        </div>
      )}

      {savings && savings.timeSavedMonths <= 0 && (
        <p className="text-xs text-slate-600 dark:text-slate-400 text-center py-2 dark:text-slate-600 dark:text-slate-400">Enter an extra payment amount to see your savings.</p>
      )}
    </div>
  );
}

interface AmortizationPanelProps {
  loanAmount: number;
  annualRate: number;
  years: number;
  monthlyPayment: number;
  totalInterest: number;
  monthlyBreakdown?: MonthlyBreakdown;
}

export default function AmortizationPanel({
  loanAmount,
  annualRate,
  years,
  monthlyPayment,
  totalInterest,
  monthlyBreakdown,
}: AmortizationPanelProps) {
  const [view, setView] = useState<'annual' | 'monthly'>('annual');
  const [showAll, setShowAll] = useState(false);

  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1;

  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;

  const { yearly, monthly } = useMemo(
    () => buildSchedule(loanAmount, monthlyRate, monthlyPayment, numPayments, startYear, startMonth),
    [loanAmount, monthlyRate, monthlyPayment, numPayments, startYear, startMonth]
  );

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const displayedYearly = showAll ? yearly : yearly.slice(0, 10);
  const displayedMonthly = showAll ? monthly : monthly.slice(0, 24);

  const hasExtras = monthlyBreakdown && (
    monthlyBreakdown.propertyTax > 0 ||
    monthlyBreakdown.homeInsurance > 0 ||
    monthlyBreakdown.pmi > 0 ||
    monthlyBreakdown.hoa > 0 ||
    monthlyBreakdown.other > 0
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden print:shadow-none dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <TrendingDown size={16} className="text-slate-600 dark:text-slate-400 dark:text-slate-600 dark:text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Amortization Schedule</span>
      </div>

      <div className="p-6 space-y-6">
        <div className={`grid gap-6 ${hasExtras ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {hasExtras && monthlyBreakdown && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3 dark:text-slate-600 dark:text-slate-400">Monthly Cost Breakdown</p>
              <CostDonutChart breakdown={monthlyBreakdown} />
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3 dark:text-slate-600 dark:text-slate-400">
              {hasExtras ? 'Principal vs. Interest Over Time' : 'Balance Over Time'}
            </p>
            <BalanceChart rows={yearly} />

            {!hasExtras && (
              <div className="mt-4 flex items-start gap-6">
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-sm bg-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Loan Amount</p>
                    <p className="text-sm font-black text-blue-600">
                      ${loanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-sm bg-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Total Interest</p>
                    <p className="text-sm font-black text-orange-500">
                      ${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ExtraPaymentPanel
          loanAmount={loanAmount}
          monthlyRate={monthlyRate}
          monthlyPayment={monthlyPayment}
          originalMonths={numPayments}
          startYear={startYear}
          startMonth={startMonth}
        />

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold dark:border-slate-700">
              <button
                onClick={() => { setView('annual'); setShowAll(false); }}
                className={`px-4 py-1.5 transition-colors ${
                  view === 'annual' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                Annual
              </button>
              <button
                onClick={() => { setView('monthly'); setShowAll(false); }}
                className={`px-4 py-1.5 transition-colors border-l border-slate-200 dark:border-slate-700 ${
                  view === 'monthly' ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                Monthly
              </button>
            </div>
            <div className="flex items-center gap-3">
              <DownloadCsvButton
                filename="amortization-schedule.csv"
                headers={
                  view === 'annual'
                    ? ['Year', 'Period', 'Interest', 'Principal', 'Balance']
                    : ['#', 'Date', 'Interest', 'Principal', 'Balance']
                }
                rows={
                  view === 'annual'
                    ? yearly.map((r) => [r.year, r.dateRange, r.interest.toFixed(2), r.principal.toFixed(2), r.endBalance.toFixed(2)])
                    : monthly.map((r, i) => [i + 1, `${MONTH_NAMES[r.month - 1]} ${r.year}`, r.interest.toFixed(2), r.principal.toFixed(2), r.endBalance.toFixed(2)])
                }
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-600 dark:text-slate-400">
                {view === 'annual' ? `${yearly.length} years` : `${monthly.length} payments`}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            {view === 'annual' ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                    <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] dark:text-slate-600 dark:text-slate-400">Year</th>
                    <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell dark:text-slate-600 dark:text-slate-400">Period</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-orange-500 uppercase tracking-wider text-[10px]">Interest</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Principal</th>
                    <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] dark:text-slate-600 dark:text-slate-400">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedYearly.map((row, i) => (
                    <tr
                      key={row.year}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100">{row.year}</td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 hidden sm:table-cell dark:text-slate-600 dark:text-slate-400">{row.dateRange}</td>
                      <td className="px-3 py-2.5 text-right text-orange-600 font-semibold">${fmt(row.interest)}</td>
                      <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">${fmt(row.principal)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                        {row.endBalance < 1 ? '—' : `$${fmt(row.endBalance)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                    <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] dark:text-slate-600 dark:text-slate-400">#</th>
                    <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] dark:text-slate-600 dark:text-slate-400">Date</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-orange-500 uppercase tracking-wider text-[10px]">Interest</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Principal</th>
                    <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] dark:text-slate-600 dark:text-slate-400">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedMonthly.map((row, i) => (
                    <tr
                      key={`${row.month}-${row.year}`}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-600 dark:text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 dark:text-slate-600 dark:text-slate-400">{MONTH_NAMES[row.month - 1]} {row.year}</td>
                      <td className="px-3 py-2 text-right text-orange-600 font-semibold">${fmt(row.interest)}</td>
                      <td className="px-3 py-2 text-right text-blue-600 font-semibold">${fmt(row.principal)}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-700 dark:text-slate-200">
                        {row.endBalance < 1 ? '—' : `$${fmt(row.endBalance)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {((view === 'annual' && yearly.length > 10) || (view === 'monthly' && monthly.length > 24)) && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-3 w-full py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 dark:hover:bg-blue-950/40 dark:border-blue-900/50"
            >
              {showAll
                ? 'Show less'
                : view === 'annual'
                ? `Show all ${yearly.length} years`
                : `Show all ${monthly.length} months`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
