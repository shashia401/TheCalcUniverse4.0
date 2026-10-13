import { CalculatorResult } from '../../../types/calculator';
import MiniRing from '../../../components/calculator/MiniRing';
import { computeF2d } from './f2dMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function FractionToDecimalPanel({ values, results }: Props) {
  if (!results.length) return null;

  const decimalRow = results.find(r => r.id === 'decimal');
  const fractionRow = results.find(r => r.id === 'fraction');
  const simplifiedRow = results.find(r => r.id === 'simplified');
  const percentageRow = results.find(r => r.id === 'percentage');
  const improperRow = results.find(r => r.id === 'improper');
  const exactRow = results.find(r => r.id === 'exactDecimal');
  const typeRow = results.find(r => r.id === 'decimalType');
  const nearestRow = results.find(r => r.id === 'nearestFraction');

  // The pie is drawn from the same exact computation as the results (not parsed back out of result strings).
  const outcome = computeF2d(values);
  const viz = outcome.kind === 'ok' ? outcome.comp.viz : null;
  const showFractionViz = viz !== null && viz.d > 0n && viz.d <= 20n && viz.n >= 0n;
  const filled = viz ? Math.min(Number(viz.n), Number(viz.d)) : 0;
  const total = viz ? Number(viz.d) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Visual Conversion</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Main result */}
        {decimalRow && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
            <p className="text-xs text-slate-500 mb-1">Decimal Value</p>
            <p className="text-3xl font-bold font-mono text-blue-700 break-all">{decimalRow.value}</p>
            {exactRow && <p className="text-sm font-mono text-slate-600 mt-2 break-all">= {exactRow.value}</p>}
            {typeRow && <p className="text-xs text-slate-600 mt-1">{typeRow.value}</p>}
          </div>
        )}
        {fractionRow && !decimalRow && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
            <p className="text-xs text-slate-500 mb-1">Fraction</p>
            <p className="text-3xl font-bold font-mono text-blue-700 break-all">{fractionRow.value}</p>
            {nearestRow && <p className="text-sm font-mono text-slate-600 mt-2">≈ {nearestRow.value}</p>}
          </div>
        )}

        {/* Fraction pie */}
        {showFractionViz && viz && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 text-center">{viz.label}</p>
            <div className="flex items-center justify-center">
              <MiniRing
                value={filled}
                total={total}
                color="#3b82f6"
                size={160}
                label={`${viz.label}: ${filled} of ${total} parts filled`}
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> Filled ({filled})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" /> Empty ({Math.max(total - filled, 0)})
              </div>
            </div>
          </div>
        )}

        {/* Results grid */}
        <div className="grid grid-cols-2 gap-3">
          {simplifiedRow && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Simplified</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-1 break-all">{simplifiedRow.value}</p>
            </div>
          )}
          {percentageRow && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Percentage</p>
              <p className="text-sm font-mono font-bold text-green-700 mt-1">{percentageRow.value}</p>
            </div>
          )}
          {improperRow && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Improper Fraction</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-1">{improperRow.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
