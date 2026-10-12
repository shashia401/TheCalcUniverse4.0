import { AlertTriangle, Calendar } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { rmdStartAge as getRmdStartAge, type ProjectionRow } from './rmdMath';

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

function RMDBarChart({ projection }: { projection: ProjectionRow[] }) {
  if (projection.length === 0) return null;
  return (
    <SvgBarChart
      ariaLabel="Projected required minimum distribution for each of the next years"
      data={projection.map((r) => ({ label: `Age ${r.age}`, value: r.rmd }))}
      format={fmtDollar}
      height={240}
    />
  );
}

const SECURE_RULES = [
  { range: 'Born 1950 or earlier', startAge: 72, law: 'SECURE Act 1.0' },
  { range: 'Born 1951–1959', startAge: 73, law: 'SECURE 2.0 (2023)' },
  { range: 'Born 1960 or later', startAge: 75, law: 'SECURE 2.0 (2033)' },
];

export default function RMDPanel({ values, results }: RMDPanelProps) {
  const birthYear = parseInt(values.birthYear, 10);
  const parsedReturn = parseFloat(values.expectedReturn);
  const expectedReturn = Number.isFinite(parsedReturn) ? parsedReturn : 6;
  const rmdStartAge = isNaN(birthYear) ? null : getRmdStartAge(birthYear);

  // The projection is computed once, in index.ts; the panel only renders it.
  let projection: ProjectionRow[] = [];
  try {
    projection = JSON.parse(results.find((r) => r.id === '_projectionData')?.value ?? '[]') as ProjectionRow[];
  } catch {
    projection = [];
  }
  const useJoint = /Joint/.test(results.find((r) => r.id === 'distributionPeriod')?.label ?? '');
  const currentRmd = projection[0]?.rmd ?? 0;
  const penalty25 = currentRmd * 0.25;

  const hasResults = results.some((r) => r.id === 'currentRmd');
  if (!hasResults && projection.length === 0) return null;

  const activeProjection = projection.filter((r) => r.rmd > 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">

      {/* Section 1: IRS Penalty Warning */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-red-50">
        <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-red-700">IRS Penalty Warning</span>
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-0.5">
                  25% Penalty on Your RMD
                </p>
                <p className="text-lg font-black text-red-700">{fmtDollarFull(penalty25)}</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-300 px-4 py-2.5 inline-block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-0.5">
                  Reduced 10% (if corrected in 2 yrs)
                </p>
                <p className="text-lg font-black text-amber-700">{fmtDollarFull(currentRmd * 0.10)}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-red-700 mt-3">
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
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="10-year RMD projection detail table">
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
                    <th scope="col" className="text-right px-4 py-2.5 font-bold text-blue-700 uppercase tracking-wider text-[10px]">
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
        <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="SECURE 2.0 RMD age rules table">
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
                        <span className="ml-2 inline-block rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700">
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
