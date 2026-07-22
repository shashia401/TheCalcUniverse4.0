import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function HtmlMinifierPanel({ results }: Props) {
  const originalSizeRow = results.find(r => r.id === 'originalSize');
  const minifiedSizeRow = results.find(r => r.id === 'minifiedSize');
  const savingsRow = results.find(r => r.id === 'savingsPercent');

  if (!originalSizeRow || !minifiedSizeRow || !savingsRow) return null;

  const orig = parseInt(originalSizeRow.value.replace(/,/g, '')) || 0;
  const mini = parseInt(minifiedSizeRow.value.replace(/,/g, '')) || 0;
  const savings = parseFloat(savingsRow.value) || 0;
  const savedBytes = orig - mini;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Size Comparison</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Size bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="font-semibold text-slate-500">Original</span>
              <span className="font-bold font-mono text-slate-700">{originalSizeRow.value}</span>
            </div>
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="font-semibold text-slate-500">Minified</span>
              <span className="font-bold font-mono text-slate-700">{minifiedSizeRow.value}</span>
            </div>
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${orig > 0 ? (mini / orig) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Savings */}
        <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Savings</p>
          <p className="text-3xl font-bold font-mono text-emerald-700">{savingsRow.value}</p>
          <p className="text-sm text-emerald-500 mt-1">{savedBytes.toLocaleString()} bytes removed</p>
        </div>
      </div>
    </div>
  );
}
