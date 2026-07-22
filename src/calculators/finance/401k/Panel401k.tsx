import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { DownloadCsvButton } from '../../../utils/downloadCsv';

interface Props {
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  annualSalary: number;
  salaryIncrease: number;
  yourContrib: number;
  employerMatch: number;
  employerMatchLimit: number;
  rate: number;
}

interface YearData {
  age: number;
  yourCumulative: number;
  employerCumulative: number;
  returns: number;
  total: number;
}

function buildData(
  currentAge: number, retirementAge: number, currentBalance: number,
  annualSalary: number, salaryIncrease: number, yourContrib: number,
  employerMatch: number, employerMatchLimit: number, rate: number
): YearData[] {
  const data: YearData[] = [];
  const monthlyRate = rate / 12;
  let balance = currentBalance;
  let totalYour = 0;
  let totalEmployer = 0;
  let salary = annualSalary;

  data.push({ age: currentAge, yourCumulative: 0, employerCumulative: 0, returns: 0, total: currentBalance });

  for (let y = 0; y < retirementAge - currentAge; y++) {
    const yourAnnual = salary * yourContrib;
    const eligible = Math.min(yourContrib, employerMatchLimit);
    const employerAnnual = salary * eligible * employerMatch;
    totalYour += yourAnnual;
    totalEmployer += employerAnnual;

    const monthlyContrib = (yourAnnual + employerAnnual) / 12;
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContrib;
    }
    salary *= (1 + salaryIncrease);

    const totalContribs = currentBalance + totalYour + totalEmployer;
    data.push({
      age: currentAge + y + 1,
      yourCumulative: totalYour,
      employerCumulative: totalEmployer,
      returns: Math.max(0, balance - totalContribs),
      total: balance,
    });
  }

  return data;
}

function StackedAreaChart({ data, hasEmployerMatch }: { data: YearData[]; hasEmployerMatch: boolean }) {
  if (data.length < 2) return null;

  const width = 520;
  const height = 220;
  const padL = 65;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(...data.map((d) => d.total));
  const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const yourBase = (i: number) => {
    const d = data[i];
    return d.yourCumulative + (i === 0 ? d.total : 0);
  };
  const employerBase = (i: number) => {
    const d = data[i];
    return d.yourCumulative + d.employerCumulative + (i === 0 ? d.total : 0);
  };

  const yourAreaPath = [
    ...data.map((_d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(yourBase(i)).toFixed(1)}`),
    `L ${toX(data.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`,
  ].join(' ');

  const employerAreaPath = hasEmployerMatch ? [
    ...data.map((_d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(employerBase(i)).toFixed(1)}`),
    ...data.map((_d, i) => `L ${toX(data.length - 1 - i).toFixed(1)} ${toY(yourBase(data.length - 1 - i)).toFixed(1)}`),
    'Z',
  ].join(' ') : '';

  const returnsAreaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.total).toFixed(1)}`),
    ...data.map((_d, i) => `L ${toX(data.length - 1 - i).toFixed(1)} ${toY(employerBase(data.length - 1 - i)).toFixed(1)}`),
    'Z',
  ].join(' ');

  const totalLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.total).toFixed(1)}`).join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const val = v * maxVal;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$0`;
  };

  const labelStep = Math.max(5, Math.ceil((data.length - 1) / 6 / 5) * 5);
  const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="401k balance growth projection chart">
        <defs>
          <linearGradient id="k401YourGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="k401EmpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="k401RetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
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
            <g key={d.age}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Age {d.age}</text>
            </g>
          );
        })}

        <path d={yourAreaPath} fill="url(#k401YourGrad)" />
        {hasEmployerMatch && employerAreaPath && <path d={employerAreaPath} fill="url(#k401EmpGrad)" />}
        <path d={returnsAreaPath} fill="url(#k401RetGrad)" />
        <path d={totalLine} fill="none" stroke="#0ea5e9" strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-80 flex-shrink-0" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Your Contributions</span>
        </div>
        {hasEmployerMatch && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-400 opacity-80 flex-shrink-0" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Employer Match</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-70 flex-shrink-0" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Investment Returns</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-sky-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Total Balance</span>
        </div>
      </div>
    </div>
  );
}

function MilestoneTable({ data }: { data: YearData[] }) {
  const fmtM = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const step = Math.max(1, Math.ceil(data.length / 11));
  const rows = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Age</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Your Contribs</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-amber-500 uppercase tracking-wider text-[10px]">Employer</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Returns</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={d.age} className={`border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${i % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/30'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">Age {d.age}</td>
              <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">{fmtM(d.yourCumulative)}</td>
              <td className="px-3 py-2.5 text-right text-amber-600 font-semibold">{fmtM(d.employerCumulative)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">{fmtM(d.returns)}</td>
              <td className="px-4 py-2.5 text-right font-black text-slate-800 dark:text-slate-200">{fmtM(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Panel401k(props: Props) {
  const { currentAge, retirementAge, currentBalance, annualSalary, salaryIncrease, yourContrib, employerMatch, employerMatchLimit, rate } = props;
  const data = useMemo(() => buildData(
    currentAge, retirementAge, currentBalance,
    annualSalary, salaryIncrease, yourContrib,
    employerMatch, employerMatchLimit, rate
  ), [currentAge, retirementAge, currentBalance, annualSalary, salaryIncrease, yourContrib, employerMatch, employerMatchLimit, rate]);

  const hasEmployerMatch = props.employerMatch > 0;
  const final = data[data.length - 1];
  const returnsPct = final ? ((final.returns / final.total) * 100).toFixed(1) : '0';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md shadow-slate-200/60 dark:shadow-slate-900/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
        <TrendingUp size={16} className="text-slate-500 dark:text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">401(k) Growth Projection</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Your Contributions vs. Employer Match vs. Investment Returns
          </p>
          <StackedAreaChart data={data} hasEmployerMatch={hasEmployerMatch} />
        </div>

        {final && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-5 py-3">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              At retirement, <strong className="text-emerald-700 dark:text-emerald-300">{returnsPct}% of your balance</strong> comes from investment returns — not your own savings.
              The market does the heavy lifting over time.
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Year-by-Year Snapshot</p>
            <DownloadCsvButton
              filename="401k-projection.csv"
              headers={['Age', 'Your Contributions', 'Employer Match', 'Investment Returns', 'Total']}
              rows={data.map((d) => [
                d.age,
                d.yourCumulative.toFixed(2),
                d.employerCumulative.toFixed(2),
                d.returns.toFixed(2),
                d.total.toFixed(2),
              ])}
            />
          </div>
          <MilestoneTable data={data} />
        </div>
      </div>
    </div>
  );
}
