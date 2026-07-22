import { useMemo } from 'react';
import type { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getResultValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

function parseNumberFromResult(val: string): number {
  const m = /(-?[\d,.]+)/.exec(val);
  if (!m) return 0;
  return parseFloat(m[1].replace(/,/g, ''));
}

function buildFireProjection(
  nw: number,
  annualSavings: number,
  fireNumber: number,
  returnRate: number
): { year: number; balance: number }[] {
  const points: { year: number; balance: number }[] = [{ year: 0, balance: nw }];
  if (nw >= fireNumber || annualSavings <= 0 || returnRate <= 0) return points;

  const r = returnRate / 100;
  let balance = nw;
  let year = 0;
  while (year < 100 && balance < fireNumber) {
    balance = balance * (1 + r) + annualSavings;
    year++;
    points.push({ year, balance: Math.round(balance) });
  }
  return points;
}

function TimelineChart({
  projection,
  fireNumber,
}: {
  projection: { year: number; balance: number }[];
  fireNumber: number;
}) {
  if (!projection.length) return null;
  const width = 480;
  const height = 160;
  const padL = 50;
  const padR = 20;
  const padT = 12;
  const padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(fireNumber, ...projection.map((p) => p.balance));
  const toX = (i: number) => padL + (i / Math.max(projection.length - 1, 1)) * chartW;
  const toY = (v: number) => padT + (1 - Math.min(v, maxVal) / maxVal) * chartH;

  const fireLine = fireNumber;
  const fireY = toY(fireLine);

  const areaPath = [
    ...projection.map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.balance).toFixed(1)}`
    ),
    `L ${toX(projection.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)}`,
    'Z',
  ].join(' ');

  const linePath = projection
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.balance).toFixed(1)}`)
    .join(' ');

  const fmtY = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '240px' }} role="img" aria-label="FIRE portfolio balance over time chart">
      <defs>
        <linearGradient id="fireAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <line
        x1={padL}
        y1={fireY}
        x2={padL + chartW}
        y2={fireY}
        stroke="#f59e0b"
        strokeWidth={2}
        strokeDasharray="6 3"
      />
      <rect
        x={padL + chartW - 65}
        y={fireY - 12}
        width={65}
        height={16}
        rx={4}
        fill="#f59e0b"
      />
      <text
        x={padL + chartW - 32}
        y={fireY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={8}
        className="fill-white"
        fontWeight="bold"
      >
        FIRE ${(fireLine / 1_000_000).toFixed(1)}M
      </text>

      <path d={areaPath} fill="url(#fireAreaGrad)" />
      <path d={linePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinejoin="round" />

      {[0, 0.25, 0.5, 0.75, 1].map((g) => {
        const y = padT + (1 - g) * chartH;
        return (
          <g key={g}>
            <line
              x1={padL}
              y1={y}
              x2={padL + chartW}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={0.5}
            />
            <text
              x={padL - 4}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={8}
              fill="#94a3b8"
            >
              {fmtY(g * maxVal)}
            </text>
          </g>
        );
      })}

      <text
        x={padL + chartW / 2}
        y={height - 2}
        textAnchor="middle"
        fontSize={8}
        fill="#94a3b8"
      >
        Years
      </text>
    </svg>
  );
}

function DonutChart({ savingsRate }: { savingsRate: number }) {
  const size = 100;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(savingsRate, 100) / 100);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} role="img" aria-label="Savings rate donut chart">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={savingsRate >= 50 ? '#10b981' : savingsRate >= 20 ? '#f59e0b' : '#ef4444'}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={16}
          fontWeight="bold"
          fill="#1e293b"
        >
          {savingsRate.toFixed(0)}%
        </text>
      </svg>
      <span className="text-[10px] text-slate-500 mt-0.5">Savings Rate</span>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
        <span>Progress to FIRE</span>
        <span>{clamped.toFixed(0)}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, #10b981 0%, #34d399 ${clamped}%)`,
          }}
        />
      </div>
    </div>
  );
}

function FIREAgeCard({ fireAge, fireType }: { fireAge: string; fireType: string }) {
  const ageNum = parseFloat(fireAge);
  const color =
    !isNaN(ageNum) && ageNum < 40
      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
      : !isNaN(ageNum) && ageNum < 50
      ? 'bg-amber-50 border-amber-300 text-amber-700'
      : 'bg-slate-50 border-slate-300 text-slate-700';

  return (
    <div
      className={`rounded-xl border-2 px-4 py-3 text-center ${color}`}
    >
      <div className="text-[10px] uppercase tracking-widest font-bold mb-0.5">
        {fireType} Target Age
      </div>
      <div className="text-2xl font-black">{fireAge}</div>
    </div>
  );
}

export default function FIREPanel({ values, results }: Props) {
  const nw = parseFloat(values.currentNetWorth) || 0;
  const income = parseFloat(values.annualIncome) || 0;
  const expenses = parseFloat(values.annualExpenses) || 0;
  const investmentReturn = parseFloat(values.investmentReturn) || 7;
  const fireType = values.fireType || 'standard';

  const fireNumberStr = getResultValue(results, 'fireNumber');
  const fireAgeStr = getResultValue(results, 'fireAge');
  const yearsToFireStr = getResultValue(results, 'yearsToFire');
  const savingsRateStr = getResultValue(results, 'savingsRate');
  const monthlySavingsStr = getResultValue(results, 'monthlySavings');

  const fireNumber = parseNumberFromResult(fireNumberStr);
  const savingsRate = parseFloat(savingsRateStr);
  const annualSavings = Math.max(0, income - expenses);
  const fireTypeLabel =
    fireType === 'standard'
      ? 'Standard'
      : fireType === 'lean'
      ? 'Lean'
      : fireType === 'fat'
      ? 'Fat'
      : 'Coast';

  const projection = useMemo(
    () =>
      buildFireProjection(nw, annualSavings, fireNumber || expenses * 25, investmentReturn),
    [nw, annualSavings, fireNumber, expenses, investmentReturn]
  );

  const pctToFire = fireNumber > 0 ? (nw / fireNumber) * 100 : 0;

  if (!results.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          {fireTypeLabel} FIRE Path
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* FIRE Age Card & Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FIREAgeCard fireAge={fireAgeStr} fireType={fireTypeLabel} />

          <div className="rounded-xl border border-slate-200 px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">
              Target Nest Egg
            </div>
            <div className="text-lg font-black text-slate-800">{fireNumberStr}</div>
          </div>

          <div className="rounded-xl border border-slate-200 px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">
              Years to Go
            </div>
            <div className="text-lg font-black text-slate-800">{yearsToFireStr}</div>
          </div>

          <div className="rounded-xl border border-slate-200 px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">
              Monthly Savings
            </div>
            <div className="text-lg font-black text-slate-800">{monthlySavingsStr}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar pct={pctToFire} />

        {/* Timeline Chart */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Net Worth Growth to FIRE
          </p>
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
            <TimelineChart projection={projection} fireNumber={fireNumber} />
          </div>
        </div>

        {/* Bottom Row: Donut + Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex justify-center">
            <DonutChart savingsRate={savingsRate} />
          </div>

          <div className="flex flex-col justify-center gap-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500 flex-shrink-0" />
              <span>Net worth growth towards FIRE number</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-amber-500 flex-shrink-0" />
              <span>FIRE number target line</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#e2e8f0' }} />
              <span>Remaining gap to FIRE</span>
            </div>
          </div>
        </div>

        {/* FIRE Type Info */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5">
          <p className="text-xs text-blue-800">
            <strong>{fireTypeLabel} FIRE:</strong>{' '}
            {fireType === 'lean'
              ? 'Targets a minimalist lifestyle. FIRE number = 25x annual expenses.'
              : fireType === 'fat'
              ? 'Targets a luxury retirement. FIRE number = 37.5x annual expenses (1.5x standard).'
              : fireType === 'coast'
              ? 'You have enough invested to reach FIRE by retirement without additional contributions.'
              : 'Standard FIRE using the 4% safe withdrawal rule. FIRE number = 25x annual expenses.'}
          </p>
        </div>
      </div>
    </div>
  );
}
