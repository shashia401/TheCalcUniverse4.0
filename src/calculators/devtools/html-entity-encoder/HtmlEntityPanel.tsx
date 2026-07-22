import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function HtmlEntityPanel({ values, results }: Props) {
  const output = results.find(r => r.id === 'output');
  const charCount = results.find(r => r.id === 'charCount');
  const originalCharCount = results.find(r => r.id === 'originalCharCount');
  const mode = values.mode || 'encode';

  if (!output) return null;

  const input = values.input || '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">HTML Entity {mode === 'encode' ? 'Encoding' : 'Decoding'}</span>
      </div>
      <div className="p-5 space-y-3">
        {/* Input / Output comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Input</p>
            <p className="text-xs font-mono text-slate-700 break-all max-h-20 overflow-y-auto">{input || '(empty)'}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Output</p>
            <p className="text-xs font-mono text-emerald-800 break-all max-h-20 overflow-y-auto">{output.value}</p>
          </div>
        </div>

        {/* Char counts */}
        <div className="flex gap-3">
          {originalCharCount && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center flex-1">
              <p className="text-[9px] font-bold text-slate-500">Input Chars</p>
              <p className="text-sm font-bold text-slate-700">{originalCharCount.value}</p>
            </div>
          )}
          {charCount && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center flex-1">
              <p className="text-[9px] font-bold text-slate-500">Output Chars</p>
              <p className="text-sm font-bold text-slate-700">{charCount.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
