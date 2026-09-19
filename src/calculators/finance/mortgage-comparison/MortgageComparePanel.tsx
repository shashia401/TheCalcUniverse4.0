import { BarChart3 } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function ComparisonChart({ monthly15, monthly30, interest15, interest30 }: {
  monthly15: number; monthly30: number; interest15: number; interest30: number;
}) {
  const width = 400;
  const height = 280;
  const padL = 80;
  const padR = 20;
  const rowGap = 60;
  const groupH = 90;
  const row1Top = 20;
  const row2Top = row1Top + groupH + rowGap;

  const barWidth = 70;
  const gap = 20;
  const groupStart = padL;

  const monthlyMax = Math.max(monthly15, monthly30, 1);
  const interestMax = Math.max(interest15, interest30, 1);

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  function BarGroup(
    x: number, y: number, h: number, barH: number,
    label: string, value: string, color: string
  ) {
    return (
      <g>
        <rect x={x} y={y + groupH - barH} width={barWidth} height={barH} rx={3} fill={color} opacity={0.85} />
        <text x={x + barWidth / 2} y={y + groupH - barH - 5} textAnchor="middle" fontSize={9} fontWeight="700" fill={color}>{value}</text>
        <text x={x + barWidth / 2} y={y + groupH + 12} textAnchor="middle" fontSize={8} fill="#64748b">{label}</text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Mortgage comparison chart">
      <text x={padL} y={row1Top} textAnchor="start" fontSize={9} fontWeight="700" fill="#64748b">Monthly Payment</text>
      {BarGroup(groupStart, row1Top, groupH, (monthly15 / monthlyMax) * groupH, '15-yr', `$${fmt(monthly15)}`, '#3b82f6')}
      {BarGroup(groupStart + barWidth + gap, row1Top, groupH, (monthly30 / monthlyMax) * groupH, '30-yr', `$${fmt(monthly30)}`, '#ef4444')}
      <text x={padL} y={row2Top} textAnchor="start" fontSize={9} fontWeight="700" fill="#64748b">Total Interest</text>
      {BarGroup(groupStart, row2Top, groupH, (interest15 / interestMax) * groupH, '15-yr', `$${fmt(interest15)}`, '#3b82f6')}
      {BarGroup(groupStart + barWidth + gap, row2Top, groupH, (interest30 / interestMax) * groupH, '30-yr', `$${fmt(interest30)}`, '#ef4444')}
    </svg>
  );
}

export default function MortgageComparePanel({ results }: Props) {
  if (!results.length) return null;

  const monthly15Res = results.find((r) => r.id === 'monthly15');
  const monthly30Res = results.find((r) => r.id === 'monthly30');
  const interest15Res = results.find((r) => r.id === 'interest15');
  const interest30Res = results.find((r) => r.id === 'interest30');
  const savingsRes = results.find((r) => r.id === 'savings');
  const extraRes = results.find((r) => r.id === 'extraMonthly');

  if (!monthly15Res || !monthly30Res || !interest15Res || !interest30Res) return null;

  const monthly15 = parseVal(monthly15Res.value);
  const monthly30 = parseVal(monthly30Res.value);
  const interest15 = parseVal(interest15Res.value);
  const interest30 = parseVal(interest30Res.value);
  const savings = savingsRes ? parseVal(savingsRes.value) : interest30 - interest15;
  const extraMonthly = extraRes ? parseVal(extraRes.value) : monthly15 - monthly30;

  const fmtD = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const savingsPct = interest30 > 0 ? ((interest30 - interest15) / interest30 * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <BarChart3 size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          15-Year vs 30-Year Comparison
        </span>
      </div>

      <div className="p-6 space-y-5">
        <ComparisonChart
          monthly15={monthly15}
          monthly30={monthly30}
          interest15={interest15}
          interest30={interest30}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Total Savings</p>
            <p className="text-lg font-black text-emerald-700">{fmtD(savings)}</p>
            <p className="text-[10px] text-emerald-500">{savingsPct.toFixed(0)}% less interest</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Extra Monthly (15yr)</p>
            <p className="text-lg font-black text-amber-700">{fmtD(extraMonthly)}</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-xs font-bold text-slate-600 mb-1">Key Insight</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            15-year: ${fmtD(monthly15)}/month — ${fmtD(interest15)} interest. 30-year: ${fmtD(monthly30)}/month — ${fmtD(interest30)} interest.
            {savings > 0 && ` You save ${fmtD(savings)} with the 15-year term.`}
          </p>
        </div>
      </div>
    </div>
  );
}
