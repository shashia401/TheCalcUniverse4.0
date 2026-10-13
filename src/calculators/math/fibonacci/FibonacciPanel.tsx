import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { bigToScientific, fibonacciSequenceBig, groupDigits } from '../../../utils/bigMath';
import { parseIntegerStrict } from '../../../utils/rational';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ea580c', '#65a30d'];

// Axis/tooltip text for values that may reach 3.5e20.
const fmtTerm = (v: number) => (v >= 1e6 ? bigToScientific(BigInt(Math.round(v)), 3) : v.toLocaleString('en-US'));

export default function FibonacciPanel({ values, results }: Props) {
  const nthTerm = results.find(r => r.id === 'nthTerm');
  const sumRow = results.find(r => r.id === 'sum');
  const binetRow = results.find(r => r.id === 'binetApproximation');
  const nBig = parseIntegerStrict(values.n, 6);

  if (!nthTerm || nBig === null || nBig < 1n || nBig > 100n) return null;
  const n = Number(nBig);

  // Exact BigInt terms; Number() only for bar heights (the printed values stay exact strings).
  const seq = fibonacciSequenceBig(n);
  const data = seq.map((v, i) => ({ label: String(i + 1), value: Number(v), color: COLORS[i % COLORS.length] }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fibonacci Sequence Growth</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-600 mb-1">{nthTerm.label}</p>
          <p className="text-3xl font-bold text-blue-700 font-mono break-all">{groupDigits(nthTerm.value)}</p>
        </div>

        {/* Bar chart */}
        {data.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Sequence Growth (F(1) to F({n}))</p>
            <SvgBarChart
              data={data}
              ariaLabel={`Bar chart of the first ${n} Fibonacci numbers, F(1) = 1 up to F(${n}) = ${fmtTerm(data[data.length - 1].value)}`}
              height={240}
              format={fmtTerm}
              maxBarWidth={data.length > 50 ? 8 : 24}
            />
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-emerald-800 uppercase">Largest Term</p>
            <p className="text-sm font-bold font-mono text-emerald-800 break-all">{groupDigits(nthTerm.value)}</p>
          </div>
          {sumRow && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-blue-800 uppercase">Sum of Terms</p>
              <p className="text-sm font-bold font-mono text-blue-800 break-all">{groupDigits(sumRow.value)}</p>
            </div>
          )}
          {binetRow && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-purple-800 uppercase">Binet&apos;s Formula</p>
              <p className="text-sm font-bold font-mono text-purple-800 break-all">{groupDigits(binetRow.value)}</p>
            </div>
          )}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-amber-800 uppercase">Terms</p>
            <p className="text-sm font-bold font-mono text-amber-800">{seq.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
