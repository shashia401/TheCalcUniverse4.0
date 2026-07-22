import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface BudgetData {
  monthlyIncome: number;
  totalNeeds: number;
  totalWants: number;
  totalSavings: number;
  totalSpending: number;
  leftover: number;
  targetNeeds: number;
  targetWants: number;
  targetSavings: number;
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
}

const SEGMENT_COLORS = {
  needs: '#3b82f6',    // blue-500
  wants: '#f59e0b',    // amber-500
  savings: '#10b981',  // emerald-500
};

interface DonutSegment {
  label: string;
  pct: number;
  color: string;
}

function buildDonutSegments(needsPct: number, wantsPct: number, savingsPct: number): DonutSegment[] {
  return [
    { label: 'Needs', pct: needsPct, color: SEGMENT_COLORS.needs },
    { label: 'Wants', pct: wantsPct, color: SEGMENT_COLORS.wants },
    { label: 'Savings', pct: savingsPct, color: SEGMENT_COLORS.savings },
  ];
}

function DonutChart({
  segments,
  centerTopLine,
  centerBottomLine,
  title,
}: {
  segments: DonutSegment[];
  centerTopLine: string;
  centerBottomLine: string;
  title: string;
}) {
  const cx = 80;
  const cy = 80;
  const r = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * r; // ~376.99

  // Build each arc segment using stroke-dasharray and stroke-dashoffset
  // Segments are stacked: each offset accounts for sum of prior segments
  let cumulativePct = 0;
  // Rotate start so the first segment begins at the top (−90deg offset = 25% of circumference ahead)
  const rotationOffset = circumference * 0.25;

  const totalPct = segments.reduce((s, seg) => s + seg.pct, 0);
  // If total < 100, we may have a gap — that's fine, the background grey circle shows it
  const cappedSegments = segments.map((seg) => ({
    ...seg,
    pct: totalPct > 0 ? Math.min(seg.pct, 100) : 0,
  }));

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 text-center">{title}</p>
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Budget allocation donut chart">
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />

          {cappedSegments.map((seg, _idx) => {
            const dashArray = (seg.pct / 100) * circumference;
            const dashOffset = circumference - cumulativePct / 100 * circumference + rotationOffset;
            const result = (
              <circle
                key={seg.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashArray.toFixed(3)} ${circumference.toFixed(3)}`}
                strokeDashoffset={dashOffset.toFixed(3)}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease' }}
              />
            );
            cumulativePct += seg.pct;
            return result;
          })}

          {/* Center text */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="700"
            className="fill-slate-900 dark:fill-slate-100"
          >
            {centerTopLine}
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            className="fill-slate-500 dark:fill-slate-400"
          >
            {centerBottomLine}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 space-y-1 w-full max-w-[180px]">
        {cappedSegments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[11px] text-slate-600">{seg.label}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-700">{seg.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CategoryBarProps {
  label: string;
  actualAmt: number;
  targetAmt: number;
  actualPct: number;
  targetPct: number;
  color: string;
}

function CategoryComparisonBar({
  label,
  actualAmt,
  targetAmt,
  actualPct,
  targetPct,
  color,
}: CategoryBarProps) {
  const isOver = actualAmt > targetAmt;
  const diff = Math.abs(actualAmt - targetAmt);
  const fmtD = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  // Cap bar widths at 100% visually
  const actualBarWidth = Math.min(actualPct, 100);
  const targetBarWidth = Math.min(targetPct, 100);

  // For actual bar color: red if over target, green if within
  const actualBarColor = isOver ? '#ef4444' : '#10b981';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isOver
              ? 'bg-red-100 text-red-600'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isOver ? `+${fmtD(diff)} over` : `-${fmtD(diff)} under`}
        </span>
      </div>

      {/* Actual bar */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Actual</span>
          <span className="text-[11px] font-semibold text-slate-600">{fmtD(actualAmt)}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${actualBarWidth}%`, backgroundColor: actualBarColor }}
          />
        </div>
      </div>

      {/* Target bar */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Target</span>
          <span className="text-[11px] font-semibold text-slate-500">{fmtD(targetAmt)}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 opacity-50"
            style={{ width: `${targetBarWidth}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

export default function BudgetPanel({ results }: Props) {
  const data = useMemo<BudgetData | null>(() => {
    const raw = results.find((r) => r.id === '_budgetData');
    if (!raw) return null;
    try {
      return JSON.parse(raw.value) as BudgetData;
    } catch {
      return null;
    }
  }, [results]);

  if (!data) return null;

  const {
    monthlyIncome,
    totalNeeds,
    totalWants,
    totalSavings,
    leftover,
    needsPct,
    wantsPct,
    savingsPct,
    targetNeeds,
    targetWants,
    targetSavings,
  } = data;

  const isSurplus = leftover >= 0;
  const leftoverAbs = Math.abs(leftover);
  const fmtD = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  // Ideal donut (always 50/30/20)
  const idealSegments = buildDonutSegments(50, 30, 20);

  // Actual donut
  const actualSegments = buildDonutSegments(needsPct, wantsPct, savingsPct);

  // Center text for surplus/deficit in actual chart
  const centerTopLine = isSurplus ? `+${fmtD(leftoverAbs)}` : `-${fmtD(leftoverAbs)}`;
  const centerBottomLine = isSurplus ? 'surplus' : 'deficit';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <PieChart size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Budget Breakdown
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Surplus / Deficit Banner */}
        <div
          className={`rounded-xl px-5 py-4 border ${
            isSurplus
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <p className={`text-sm font-bold ${isSurplus ? 'text-emerald-700' : 'text-red-700'}`}>
            {isSurplus
              ? `You have a ${fmtD(leftoverAbs)} monthly surplus \u2014 great work!`
              : `You are overspending by ${fmtD(leftoverAbs)}/month. Review your Wants category.`}
          </p>
          <p className={`text-xs mt-1 ${isSurplus ? 'text-emerald-600' : 'text-red-500'}`}>
            {isSurplus
              ? `Monthly take-home: ${fmtD(monthlyIncome)} \u2014 allocated ${fmtD(data.totalSpending)}, unallocated ${fmtD(leftoverAbs)}.`
              : `Monthly take-home: ${fmtD(monthlyIncome)} \u2014 you are spending ${fmtD(data.totalSpending)} total.`}
          </p>
        </div>

        {/* Dual Donut Charts */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
            50/30/20 Split: Ideal vs. Actual
          </p>
          <div className="grid grid-cols-2 gap-4 justify-items-center">
            <DonutChart
              segments={idealSegments}
              centerTopLine="50/30/20"
              centerBottomLine="target"
              title="Ideal Split"
            />
            <DonutChart
              segments={actualSegments}
              centerTopLine={centerTopLine}
              centerBottomLine={centerBottomLine}
              title="Your Actual Split"
            />
          </div>
        </div>

        {/* Category Comparison Bars */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
            Actual vs. Target by Category
          </p>
          <div className="space-y-6">
            <CategoryComparisonBar
              label="Needs"
              actualAmt={totalNeeds}
              targetAmt={targetNeeds}
              actualPct={needsPct}
              targetPct={50}
              color={SEGMENT_COLORS.needs}
            />
            <CategoryComparisonBar
              label="Wants"
              actualAmt={totalWants}
              targetAmt={targetWants}
              actualPct={wantsPct}
              targetPct={30}
              color={SEGMENT_COLORS.wants}
            />
            <CategoryComparisonBar
              label="Savings"
              actualAmt={totalSavings}
              targetAmt={targetSavings}
              actualPct={savingsPct}
              targetPct={20}
              color={SEGMENT_COLORS.savings}
            />
          </div>
        </div>

        {/* Summary Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Category
                </th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Actual
                </th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Target
                </th>
                <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  % of Income
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: 'Needs',
                  actual: totalNeeds,
                  target: targetNeeds,
                  pct: needsPct,
                  targetPct: 50,
                  color: SEGMENT_COLORS.needs,
                },
                {
                  label: 'Wants',
                  actual: totalWants,
                  target: targetWants,
                  pct: wantsPct,
                  targetPct: 30,
                  color: SEGMENT_COLORS.wants,
                },
                {
                  label: 'Savings',
                  actual: totalSavings,
                  target: targetSavings,
                  pct: savingsPct,
                  targetPct: 20,
                  color: SEGMENT_COLORS.savings,
                },
              ].map((row) => (
                <tr key={row.label} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="font-bold text-slate-700">{row.label}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                    {fmtD(row.actual)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500">{fmtD(row.target)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`font-bold ${
                        row.label === 'Savings'
                          ? row.pct >= row.targetPct
                            ? 'text-emerald-600'
                            : 'text-red-500'
                          : row.pct <= row.targetPct
                          ? 'text-emerald-600'
                          : 'text-red-500'
                      }`}
                    >
                      {row.pct.toFixed(1)}%
                    </span>
                    <span className="text-slate-500 ml-1 font-normal">/ {row.targetPct}%</span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="px-4 py-2.5 font-black text-slate-700">Total Allocated</td>
                <td className="px-3 py-2.5 text-right font-black text-slate-800">
                  {fmtD(data.totalSpending)}
                </td>
                <td className="px-3 py-2.5 text-right font-black text-slate-800">
                  {fmtD(monthlyIncome)}
                </td>
                <td className="px-4 py-2.5 text-right font-black text-slate-800">
                  {((data.totalSpending / monthlyIncome) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tip */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3">
          <p className="text-xs font-bold text-blue-700 mb-1">Budgeting Tip</p>
          <p className="text-xs text-blue-600">
            The 50/30/20 rule is a starting point. If your needs exceed 50%, focus on reducing the
            largest fixed expenses first. Even moving savings from 5% to 10% of income can
            dramatically improve your financial trajectory over time.
          </p>
        </div>
      </div>
    </div>
  );
}
