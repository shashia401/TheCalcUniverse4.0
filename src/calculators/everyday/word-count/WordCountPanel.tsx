import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function WordCountPanel({ results }: Props) {
  const wordRow = results.find(r => r.id === 'wordCount');
  const charRow = results.find(r => r.id === 'charCount');
  const structureRow = results.find(r => r.id === 'structure');
  const uniqueRow = results.find(r => r.id === 'uniqueWords');
  const timeRow = results.find(r => r.id === 'estimatedTime');

  if (!wordRow) return null;

  const words = parseInt(wordRow.value.replace(/,/g, '')) || 0;
  const charMatch = charRow?.value.match(/([\d,]+)/g);
  const charsTotal = charMatch ? parseInt(charMatch[0].replace(/,/g, '')) : 0;
  const charsNoSpace = charMatch && charMatch[1] ? parseInt(charMatch[1].replace(/,/g, '')) : 0;
  const unique = parseInt(uniqueRow?.value.replace(/,/g, '') || '0');
  const structure = structureRow?.value || '';
  const structMatch = structure.match(/([\d,]+)/g);
  const sentences = structMatch ? parseInt(structMatch[0].replace(/,/g, '')) : 0;
  const paragraphs = structMatch && structMatch[1] ? parseInt(structMatch[1].replace(/,/g, '')) : 0;
  const maxVal = Math.max(words, charsTotal, unique, 1);

  const bar = (label: string, val: number, max: number, color: string) => {
    const pct = max > 0 ? (val / max) * 100 : 0;
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-[10px] font-semibold text-slate-500 w-24 flex-shrink-0">{label}</span>
        <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-600 w-16 text-right">{val.toLocaleString()}</span>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Text Statistics</span>
      </div>
      <div className="p-5 space-y-1">
        {bar('Words', words, maxVal, 'bg-blue-500')}
        {bar('Characters', charsTotal, maxVal, 'bg-emerald-500')}
        {unique > 0 && bar('Unique Words', unique, maxVal, 'bg-purple-500')}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {structureRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Sentences</p>
              <p className="text-lg font-bold font-mono text-slate-700">{sentences.toLocaleString()}</p>
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Paragraphs</p>
            <p className="text-lg font-bold font-mono text-slate-700">{paragraphs.toLocaleString()}</p>
          </div>
        </div>

        {timeRow && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Estimated Time</p>
            <p className="text-sm font-semibold text-amber-700">{timeRow.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
