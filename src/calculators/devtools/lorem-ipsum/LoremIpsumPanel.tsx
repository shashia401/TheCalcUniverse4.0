import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LoremIpsumPanel({ results }: Props) {
  const generatedText = results.find(r => r.id === 'generatedText');
  const wordCount = results.find(r => r.id === 'wordCount');
  const charCount = results.find(r => r.id === 'charCount');

  if (!generatedText) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Generated Text</span>
      </div>
      <div className="p-5 space-y-3">
        {/* Text preview */}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 max-h-40 overflow-y-auto">
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{generatedText.value}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          {wordCount && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center flex-1">
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Words</p>
              <p className="text-lg font-bold text-blue-700">{wordCount.value}</p>
            </div>
          )}
          {charCount && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-center flex-1">
              <p className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">Characters</p>
              <p className="text-lg font-bold text-purple-700">{charCount.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
