import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { analyzeText } from './wordCountMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function WordCountPanel({ values, results }: Props) {
  const timeRow = results.find((r) => r.id === 'estimatedTime');
  // Same pure function index.ts uses; the panel never parses result strings.
  const st = analyzeText(values.text || '', parseFloat(values.wordsPerMinute || '238'));
  if (!st) return null;
  const n = (x: number) => x.toLocaleString('en-US');
  const max = Math.max(st.wordCount, st.charCount, st.uniqueWords, 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Text Statistics</span>
      </div>
      <div className="p-5 space-y-1">
        <HBarRow label="Words" value={st.wordCount} max={max} display={n(st.wordCount)} color="bg-blue-700" labelWidth="w-28" height="h-5" className="py-1" />
        <HBarRow label="Characters" value={st.charCount} max={max} display={n(st.charCount)} color="bg-emerald-700" labelWidth="w-28" height="h-5" className="py-1" />
        <HBarRow label="Unique Words" value={st.uniqueWords} max={max} display={n(st.uniqueWords)} color="bg-purple-700" labelWidth="w-28" height="h-5" className="py-1" />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Sentences</p>
            <p className="text-lg font-bold font-mono text-slate-700">{n(st.sentences)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Paragraphs</p>
            <p className="text-lg font-bold font-mono text-slate-700">{n(st.paragraphs)}</p>
          </div>
        </div>

        {timeRow && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Estimated Time</p>
            <p className="text-sm font-semibold text-amber-800">{timeRow.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
