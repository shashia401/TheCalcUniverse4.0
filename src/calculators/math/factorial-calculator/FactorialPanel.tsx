import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { bigToScientific } from '../../../utils/bigMath';
import { parseIntegerStrict } from '../../../utils/rational';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const BAR_COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#db2777', '#0891b2', '#65a30d'];
const MAX_BARS = 15; // 0! .. 15! stays readable; 15! = 1.3 x 10^12

// Compact tick/tooltip text: 1,307,674,368,000 -> 1.31e12
const fmtFact = (v: number) => (v >= 1e6 ? bigToScientific(BigInt(Math.round(v)), 3) : v.toLocaleString('en-US'));

export default function FactorialPanel({ values, results }: Props) {
  const nBig = parseIntegerStrict(values.n, 6);
  const factorialRow = results.find((r) => r.id === 'factorial');
  const digitRow = results.find((r) => r.id === 'digitCount');
  if (nBig === null || nBig < 0n || nBig > 1000n || !factorialRow) return null;
  const n = Number(nBig);

  const last = Math.min(n, MAX_BARS);
  const data = [];
  let f = 1n; // exact 0!, 1!, 2!, ... (Number() of these is exact up to 22!)
  for (let i = 0; i <= last; i++) {
    if (i > 1) f *= BigInt(i);
    data.push({ label: String(i), value: Number(f), color: BAR_COLORS[Math.floor(i / 2) % BAR_COLORS.length] });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Factorial Growth
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            0! through {last}!
          </p>
          <SvgBarChart
            data={data}
            ariaLabel={`Bar chart of the factorials 0! through ${last}!, growing from 1 to ${fmtFact(data[data.length - 1].value)}`}
            height={260}
            format={fmtFact}
            maxBarWidth={32}
          />
          <p className="text-[10px] text-slate-600 text-center mt-1">
            Factorials grow super-exponentially. {n}! has {digitRow?.value ?? '?'} digit{digitRow?.value === '1' ? '' : 's'}.
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 text-center">
          <p className="text-sm text-slate-600 mb-1">{factorialRow.label}</p>
          <p className="text-2xl font-bold text-blue-700 font-mono break-all max-h-48 overflow-y-auto">{factorialRow.value}</p>
        </div>
      </div>
    </div>
  );
}
