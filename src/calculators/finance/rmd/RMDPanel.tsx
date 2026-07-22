import { AlertTriangle, Calendar } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

const UNIFORM_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4,
  88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2,
  104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4,
  112: 3.3, 113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3, 120: 2.0,
};

const JOINT_TABLE: Record<number, number> = {
  70: 35.0, 71: 34.1, 72: 33.3, 73: 32.4, 74: 31.5, 75: 30.6, 76: 29.8, 77: 28.9, 78: 28.0,
  79: 27.2, 80: 26.3, 81: 25.5, 82: 24.6, 83: 23.8, 84: 22.9, 85: 22.1, 86: 21.3, 87: 20.5,
  88: 19.7, 89: 19.0, 90: 18.2,
};

function getDistributionPeriod(age: number, useJoint: boolean): number {
  if (useJoint) {
    const clampedAge = Math.min(Math.max(age, 70), 90);
    return JOINT_TABLE[clampedAge] ?? UNIFORM_TABLE[Math.min(Math.max(age, 72), 120)] ?? 2.0;
  }
  const clampedAge = Math.min(Math.max(age, 72), 120);
  return UNIFORM_TABLE[clampedAge] ?? 2.0;
}

function getRmdStartAge(birthYear: number): number {
  if (birthYear <= 1950) return 72;
  if (birthYear <= 1959) return 73;
  return 75;
}

interface ProjectionRow {
  year: number;
  age: number;
  balance: number;
  rmd: number;
  factor: number;
}

interface RMDPanelProps {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function fmtDollar(n: number): string {
  if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2)}M`;
  }
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDollarFull(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface BarChartProps {
  projection: ProjectionRow[];
}

function RMDBarChart({ projection }: BarChartProps) {
  const activeRows = projection.filter((r) => r.rmd > 0);
  if (activeRows.length === 0) return null;

  const maxRmd = Math.max(...activeRows.map((r) => r.rmd));

  const svgWidth = 560;
  const svgHeight = 260;
  const padL = 72;
  const padR = 16;
  const padT = 16;
  const padB = 64;
  const chartW = svgWidth - padL - padR;
  const chartH = svgHeight - padT - padB;

  const n = activeRows.length;
  const barGroupW = chartW / n;
  const barW = Math.min(barGroupW * 0.62, 40);

  const toY = (val: number) => padT + (1 - val / maxRmd) * chartH;

  const gridFractions = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (frac: number) => {
    const v = frac * maxRmd;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ minWidth: '320px' }}
        role="img"
        aria-label="10-Year RMD Projection Bar Chart"
      >
        {/* Grid lines */}
        {gridFractions.map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line
                x1={padL}
                y1={y}
                x2={padL + chartW}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={g === 0 ? 1 : 0.5}
              />
              <text
                x={padL - 5}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="#94a3b8"
              >
                {fmtY(g)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {activeRows.map((row, i) => {
          const cx = padL + (i + 0.5) * barGroupW;
          const barX = cx - barW / 2;
          const barY = toY(row.rmd);
          const barH = padT + chartH - barY;
          const labelY = padT + chartH + 14;

          return (
            <g key={row.year}>
              <rect
                x={barX}
                y={barY}
                width={barW}
                height={barH}
                rx={3}
                fill="#3b82f6"
                fillOpacity={0.8}
              />
              {/* RMD value on top of bar (only if bar is tall enough) */}
              {barH > 22 && (
                <text
                  x={cx}
                  y={barY + 11}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#1e3a5f"
                  fontWeight="600"
                >
                  {fmtDollar(row.rmd)}
                </text>
              )}
              {/* X axis labels */}
              <text
                x={cx}
                y={labelY}
                textAnchor="middle"
                fontSize={8}
                fill="#64748b"
                fontWeight="600"
              >
                Age {row.age}
              </text>
              <text
                x={cx}
                y={labelY + 12}
                textAnchor="middle"
                fontSize={8}
                fill="#94a3b8"
              >
                {row.year}
              </text>
            </g>
          );
        })}

        {/* Chart border */}
        <rect
          x={padL}
          y={padT}
          width={chartW}
          height={chartH}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={0.5}
        />
      </svg>
    </div>
  );
}

const SECURE_RULES = [
  { range: 'Born 1950 or earlier', startAge: 72, law: 'SECURE Act 1.0' },
  { range: 'Born 1951–1959', startAge: 73, law: 'SECURE 2.0 (2023)' },
  { range: 'Born 1960 or later', startAge: 75, law: 'SECURE 2.0 (2033)' },
];

export default function RMDPanel({ values, results }: RMDPanelProps) {
  // Re-derive inputs from values
  const birthYear = parseInt(values.birthYear, 10);
  const accountBalance = parseFloat(values.accountBalance) || 0;
  const useJoint = values.spouseToggle === 'yes';
  const expectedReturn = parseFloat(values.expectedReturn) || 6;

  const currentYear = new Date().getFullYear();

  // Determine if the owner has started RMDs yet
  const currentAge = isNaN(birthYear) ? null : currentYear - birthYear;
  const rmdStartAge = isNaN(birthYear) ? null : getRmdStartAge(birthYear);
  const hasStarted = currentAge !== null && rmdStartAge !== null && currentAge >= rmdStartAge;

  // Compute current RMD for the penalty warning
  let currentRmd = 0;
  if (hasStarted && currentAge !== null) {
    const factor = getDistributionPeriod(currentAge, useJoint);
    currentRmd = accountBalance / factor;
  }
  const penalty25 = currentRmd * 0.25;

  // Build the 10-year projection internally
  const projection: ProjectionRow[] = [];
  if (!isNaN(birthYear) && accountBalance > 0 && rmdStartAge !== null && currentAge !== null) {
    const rate = expectedReturn / 100;
    let projBalance = accountBalance;
    for (let i = 0; i < 10; i++) {
      const projAge = currentAge + i;
      const projYear = currentYear + i;
      if (projAge < rmdStartAge) {
        projBalance = projBalance * (1 + rate);
        projection.push({ year: projYear, age: projAge, balance: projBalance, rmd: 0, factor: 0 });
      } else {
        const factor = getDistributionPeriod(projAge, useJoint);
        const projRmd = projBalance / factor;
        projection.push({ year: projYear, age: projAge, balance: projBalance, rmd: projRmd, factor });
        projBalance = (projBalance - projRmd) * (1 + rate);
      }
    }
  }

  const hasResults = results.some((r) => r.id === 'currentRmd');
  if (!hasResults && projection.length === 0) return null;

  const activeProjection = projection.filter((r) => r.rmd > 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">

      {/* Section 1: IRS Penalty Warning */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-red-50">
        <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-red-600">IRS Penalty Warning</span>
      </div>

      <div className="px-6 py-5 border-b border-slate-100">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800 mb-1">Failure to take your full RMD has consequences</p>
          <p className="text-sm text-red-700 leading-relaxed">
            If you fail to take your full RMD by December 31, you may owe a{' '}
            <span className="font-bold">25% excise tax</span> on the amount NOT withdrawn. Under SECURE 2.0,
            this penalty is reduced to <span className="font-bold">10%</span> if the shortfall is corrected
            within a 2-year window.
          </p>
          {currentRmd > 0 && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="rounded-lg bg-red-100 border border-red-300 px-4 py-2.5 inline-block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-0.5">
                  25% Penalty on Your RMD
                </p>
                <p className="text-lg font-black text-red-700">{fmtDollarFull(penalty25)}</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-300 px-4 py-2.5 inline-block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">
                  Reduced 10% (if corrected in 2 yrs)
                </p>
                <p className="text-lg font-black text-amber-700">{fmtDollarFull(currentRmd * 0.10)}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-red-500 mt-3">
            The first RMD can be delayed to April 1 of the following year, but if you do, you must take two
            RMDs in that year — both will be taxable income.
          </p>
        </div>
      </div>

      {/* Section 2: 10-Year RMD Projection Chart */}
      {activeProjection.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
            <Calendar size={16} className="text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
              10-Year RMD Projection
            </span>
          </div>

          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-xs text-slate-500 mb-4">
              Projected RMD amounts assuming your account grows at{' '}
              <span className="font-semibold text-slate-700">{expectedReturn.toFixed(1)}% annually</span>{' '}
              between distributions, using the{' '}
              <span className="font-semibold text-slate-700">
                {useJoint ? 'Joint Life Expectancy Table' : 'Uniform Lifetime Table'}
              </span>
              .
            </p>

            <RMDBarChart projection={activeProjection} />

            {/* Projection detail table */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Year / Age
                    </th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Balance (Start)
                    </th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      IRS Factor
                    </th>
                    <th scope="col" className="text-right px-4 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">
                      RMD
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeProjection.map((row, i) => (
                    <tr
                      key={row.year}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="px-4 py-2.5 font-bold text-slate-800">
                        {row.year}
                        <span className="text-slate-500 font-normal ml-1">(Age {row.age})</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600 font-semibold">
                        {fmtDollar(row.balance)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500">
                        {row.factor.toFixed(1)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-blue-700">
                        {fmtDollar(row.rmd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Section 3: SECURE 2.0 RMD Age Rules */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Calendar size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          SECURE 2.0 RMD Age Rules
        </span>
      </div>

      <div className="px-6 py-5">
        <p className="text-xs text-slate-500 mb-4">
          The SECURE 2.0 Act (signed December 2022) changed the age at which RMDs must begin, phased in over
          several years. Your birth year determines which rule applies to you.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Birth Year
                </th>
                <th scope="col" className="text-center px-3 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  RMD Start Age
                </th>
                <th scope="col" className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Governing Law
                </th>
              </tr>
            </thead>
            <tbody>
              {SECURE_RULES.map((rule, i) => {
                const isApplicable =
                  !isNaN(birthYear) &&
                  rmdStartAge !== null &&
                  rule.startAge === rmdStartAge;
                return (
                  <tr
                    key={rule.startAge}
                    className={`border-b border-slate-100 last:border-0 ${
                      isApplicable
                        ? 'bg-blue-50 ring-1 ring-inset ring-blue-200'
                        : i % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50/50'
                    }`}
                  >
                    <td className={`px-4 py-3 font-semibold ${isApplicable ? 'text-blue-800' : 'text-slate-700'}`}>
                      {rule.range}
                      {isApplicable && (
                        <span className="ml-2 inline-block rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                          You
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-3 py-3 text-center font-black text-base ${
                        isApplicable ? 'text-blue-700' : 'text-slate-600'
                      }`}
                    >
                      {rule.startAge}
                    </td>
                    <td className={`px-4 py-3 ${isApplicable ? 'text-blue-600' : 'text-slate-500'}`}>
                      {rule.law}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">Important: First RMD Deadline</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Your first RMD can be delayed to <span className="font-bold">April 1</span> of the year after you
            reach your RMD start age. All subsequent RMDs must be taken by{' '}
            <span className="font-bold">December 31</span> each year. Delaying the first RMD means you will
            owe <span className="font-bold">two taxable distributions</span> in that same calendar year, which
            could push you into a higher tax bracket.
          </p>
        </div>
      </div>
    </div>
  );
}
