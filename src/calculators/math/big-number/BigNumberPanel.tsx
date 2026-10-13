import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const OP_SYMBOLS: Record<string, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
};

export default function BigNumberPanel({ values, results }: Props) {
  if (results.length === 0) return null;

  const result = results.find(r => r.id === 'result')?.value || '';
  const a = values.a || '';
  const b = values.b || '';
  const op = values.op || 'add';
  const digitCount = results.find(r => r.id === 'digitCount')?.value || '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">BigInt Exact Arithmetic</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Operation display */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500 mb-1">Expression</p>
          <p className="text-sm font-mono text-slate-700 break-all">
            {a} {OP_SYMBOLS[op] || op} {b}
          </p>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Exact Result</p>
            <div className="text-sm font-mono text-emerald-700 break-all max-h-40 overflow-y-auto leading-relaxed">
              {result}
            </div>
          </div>
        )}

        {/* Digit counts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Value 1 Digits</p>
            <p className="text-sm font-bold font-mono text-slate-700">{results.find(r => r.id === 'digitCountA')?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Value 2 Digits</p>
            <p className="text-sm font-bold font-mono text-slate-700">{results.find(r => r.id === 'digitCountB')?.value}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Result Digits</p>
            <p className="text-sm font-bold font-mono text-emerald-700">{digitCount}</p>
          </div>
        </div>

        {/* Magnitude bar chart */}
        {(() => {
          const dA = parseInt(results.find(r => r.id === 'digitCountA')?.value || '0', 10);
          const dB = parseInt(results.find(r => r.id === 'digitCountB')?.value || '0', 10);
          const dR = parseInt(digitCount || '0', 10);
          if (dA <= 0 && dB <= 0 && dR <= 0) return null;
          const chartData = [
            { label: 'Value 1', value: dA, color: '#2563eb' },
            { label: 'Value 2', value: dB, color: '#7c3aed' },
            { label: 'Result', value: dR, color: '#059669' },
          ];
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Digit Count Comparison</p>
              <SvgBarChart
                data={chartData}
                ariaLabel={`Digits in Value 1 (${dA}), Value 2 (${dB}) and the result (${dR})`}
                height={160}
                format={(v) => `${Math.round(v)}`}
                maxBarWidth={48}
              />
            </div>
          );
        })()}

        {/* Power notice */}
        {op === 'power' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            ⚡ Powered by JavaScript BigInt — unlimited precision for integer arithmetic.
            {parseInt(digitCount) > 100 && ' Result has more than 100 digits!'}
          </div>
        )}
      </div>
    </div>
  );
}
