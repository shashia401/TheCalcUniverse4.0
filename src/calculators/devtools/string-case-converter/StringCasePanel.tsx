import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function StringCasePanel({ values, results }: Props) {
  const inputText = values.input || '';
  const conversions = ['camelCase', 'PascalCase', 'snake_case', 'kebab-case', 'UPPER CASE', 'lower case', 'Title Case', 'Start Case', 'dot.case'];

  if (!results.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Case Conversion</span>
      </div>
      <div className="p-5 space-y-2">
        {inputText && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 mb-2">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Input</p>
            <p className="text-xs font-mono text-slate-700 truncate">{inputText}</p>
          </div>
        )}
        <div className="space-y-1">
          {conversions.map(id => {
            const row = results.find(r => r.id === id);
            if (!row) return null;
            return (
              <div key={id} className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-colors">
                <span className="text-[10px] font-semibold text-slate-500 w-24 flex-shrink-0">{id}</span>
                <code className="text-xs font-mono text-slate-800 ml-2 break-all">{row.value}</code>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
